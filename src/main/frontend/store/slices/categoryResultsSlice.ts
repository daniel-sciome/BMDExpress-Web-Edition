import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import type ExperimentDescriptionDto from 'Frontend/generated/com/sciome/dto/ExperimentDescriptionDto';
import type { RootState, AppDispatch } from '../store';
import type { ReactiveSelectionMap, SelectionSource } from 'Frontend/types/reactiveTypes';
import { initializeCategories, upsertCategorySet } from './renderStateSlice';
import { createClusterSets, createPrimaryFilterSet } from '../utils/initializeRenderState';
// Note: highlightCategories/selectHighlightedIds from visibilitySlice are deprecated
// Use reactiveSelection.category.selectedIds instead
import { applyFilterGroups, evaluateFilterGroups } from '../../utils/filterEvaluation';
import type { CategoryWithFocus } from '../../types/categoryTypes';
import { selectEnabledFilterGroups } from './filterSlice';
import { umapDataService } from '../../data/umapDataService';

// Cluster ID constants
export const CLUSTER_UNCLASSIFIED = -1;   // In UMAP reference but not assigned to a cluster
export const CLUSTER_NOT_IN_REF = -2;     // Not in UMAP reference data

/**
 * Extended category type with cluster information enriched at load time.
 * This avoids repeated umapDataService lookups in selectors.
 */
export interface CategoryAnalysisResultWithCluster extends CategoryAnalysisResultDto {
  clusterId: number;  // -2 = not in reference, -1 = outlier, 0+ = cluster
}

// View mode localStorage key
const VIEW_MODE_STORAGE_KEY = 'bmdexpress_view_mode';

// Helper to load view mode from localStorage
function loadViewMode(): 'simple' | 'power' {
  try {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (saved === 'simple' || saved === 'power') {
      return saved;
    }
  } catch (error) {
    console.error('Failed to load view mode from localStorage:', error);
  }
  // Default to 'simple' for simplest experience
  return 'simple';
}

// Helper to save view mode to localStorage
function saveViewMode(mode: 'simple' | 'power'): void {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.error('Failed to save view mode to localStorage:', error);
  }
}

// Filters interface
interface Filters {
  bmdMin?: number;
  bmdMax?: number;
  pValueMax?: number;
  minGenesInCategory?: number;
  fisherPValueMax?: number;
  foldChangeMin?: number;
  // Primary Filter fields (Phase 1)
  percentageMin?: number;
  genesPassedFiltersMin?: number;
  allGenesMin?: number;
  allGenesMax?: number;
}

// State interface
interface CategoryResultsState {
  // Data (enriched with cluster info at load time)
  data: CategoryAnalysisResultWithCluster[];
  experimentDescription: ExperimentDescriptionDto | null;
  loading: boolean;
  error: string | null;

  // Project/Result context
  projectId: string | null;
  resultName: string | null;

  // Analysis parameters (from AnalysisInfo notes)
  analysisParameters: string[];
  parametersLoading: boolean;

  // Analysis type (from annotation - used to conditionally apply master filters)
  analysisType: string | null;

  // Filters
  filters: Filters;

  // Multi-dataset comparison mode (intersection vs union)
  comparisonMode: 'intersection' | 'union';

  // View mode (normal vs power user)
  viewMode: 'simple' | 'power';

  // Phase 4: Generic reactive selection state
  reactiveSelection: ReactiveSelectionMap;

  // Highlighting (for hover states)
  highlightedRow: number | null;

  // Table state
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';

  // Pagination
  currentPage: number;
  pageSize: number;
}

// Initial state
const initialState: CategoryResultsState = {
  data: [],
  experimentDescription: null,
  loading: false,
  error: null,
  projectId: null,
  resultName: null,
  analysisParameters: [],
  parametersLoading: false,
  analysisType: null,
  filters: {},
  comparisonMode: 'intersection',
  viewMode: loadViewMode(),
  // Phase 4: Reactive selection state
  reactiveSelection: {
    category: {
      selectedIds: new Set<string>(),
      source: null,
    },
    cluster: {
      selectedIds: new Set<number | string>(),
      source: null,
    },
  },
  highlightedRow: null,
  sortColumn: 'clusterId',  // Default sort by cluster ID
  sortDirection: 'asc',
  currentPage: 0,
  pageSize: 50,
};

// Async thunk to load category results
export const loadCategoryResults = createAsyncThunk(
  'categoryResults/load',
  async ({ projectId, resultName }: { projectId: string; resultName: string }) => {
    console.log('[Redux] Loading category results:', { projectId, resultName });
    try {
      const containerData = await CategoryResultsService.getCategoryResults(projectId, resultName);
      console.log('[Redux] Received container data:', containerData);
      // Extract results array and experiment description from container DTO
      const results = containerData?.results || [];
      const experimentDescription = containerData?.experimentDescription || null;
      // Filter out any undefined values that might come from the backend
      const filtered = results.filter((item): item is CategoryAnalysisResultDto => item !== undefined);
      console.log('[Redux] Filtered data:', filtered.length, 'items');
      return { results: filtered, experimentDescription };
    } catch (error) {
      console.error('[Redux] Error loading category results:', error);
      throw error;
    }
  }
);

// Primary filter localStorage key and defaults (shared with PrimaryFilter component)
const PRIMARY_FILTER_STORAGE_KEY = 'bmdexpress_master_filters_global';
const DEFAULT_PRIMARY_FILTERS: Filters = {
  percentageMin: 5,
  genesPassedFiltersMin: 3,
  allGenesMin: 40,
  allGenesMax: 500,
};

/**
 * Load primary filter values from localStorage, falling back to defaults.
 * This is called during data load to ensure filters are applied immediately.
 */
function loadPrimaryFiltersFromStorage(): Filters {
  try {
    const stored = localStorage.getItem(PRIMARY_FILTER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PRIMARY_FILTERS, ...parsed };
    }
  } catch (error) {
    console.error('[Redux] Failed to load primary filters from localStorage:', error);
  }
  return DEFAULT_PRIMARY_FILTERS;
}

/**
 * Apply primary filters to a list of categories.
 * Returns only categories that pass all filter criteria.
 */
function applyPrimaryFilters(
  categories: CategoryAnalysisResultDto[],
  filters: Filters,
  analysisType: string | null
): CategoryAnalysisResultDto[] {
  return categories.filter(row => {
    // Skip primary filter for GENE analyses
    if (analysisType === 'GENE') return true;

    if (filters.percentageMin !== undefined && row.percentage !== undefined && row.percentage < filters.percentageMin) return false;
    if (filters.genesPassedFiltersMin !== undefined && row.genesThatPassedAllFilters !== undefined && row.genesThatPassedAllFilters < filters.genesPassedFiltersMin) return false;
    if (filters.allGenesMin !== undefined && row.geneAllCount !== undefined && row.geneAllCount < filters.allGenesMin) return false;
    if (filters.allGenesMax !== undefined && row.geneAllCount !== undefined && row.geneAllCount > filters.allGenesMax) return false;

    return true;
  });
}

// Wrapper thunk to load category results AND initialize render state
export const loadCategoryResultsWithRenderState = createAsyncThunk<
  void,
  { projectId: string; resultName: string },
  { dispatch: AppDispatch; state: RootState }
>(
  'categoryResults/loadWithRenderState',
  async ({ projectId, resultName }, { dispatch, getState }) => {
    console.log('[Redux] Loading category results with render state initialization');

    // Step 1: Load and apply primary filters FIRST (before data load completes)
    const primaryFilters = loadPrimaryFiltersFromStorage();
    console.log('[Redux] Loaded primary filters from storage:', primaryFilters);
    dispatch(categoryResultsSlice.actions.setFilters(primaryFilters));

    // Step 1b: Fetch annotation to get analysisType (needed for filter logic)
    let analysisType: string | null = null;
    try {
      const annotation = await CategoryResultsService.getCategoryResultAnnotation(projectId, resultName);
      analysisType = annotation?.analysisType ?? null;
      console.log('[Redux] Fetched analysisType:', analysisType);
      if (analysisType) {
        dispatch(categoryResultsSlice.actions.setAnalysisType(analysisType));
      }
    } catch (error) {
      console.warn('[Redux] Failed to fetch annotation for analysisType:', error);
    }

    // Load the category data
    const resultAction = await dispatch(loadCategoryResults({ projectId, resultName }));

    if (loadCategoryResults.fulfilled.match(resultAction)) {
      const allCategories = resultAction.payload.results;

      // Initialize CategoryRenderState for all categories
      console.log('[Redux] Initializing render state for', allCategories.length, 'categories');
      dispatch(initializeCategories(allCategories));

      // Create cluster CategorySets from UMAP data
      console.log('[Redux] Creating cluster CategorySets');
      const clusterSets = createClusterSets(allCategories);
      clusterSets.forEach(set => {
        dispatch(upsertCategorySet(set));
      });

      // Create master filter CategorySet with current filter criteria
      const state = getState();
      const filters = state.categoryResults.filters;
      console.log('[Redux] Creating master filter CategorySet with criteria:', filters);
      const primaryFilterSet = createPrimaryFilterSet(allCategories, {
        minBmd: filters.bmdMin,
        maxBmd: filters.bmdMax,
        minPValue: undefined, // Not currently a filter
        maxPValue: filters.pValueMax,
      });
      dispatch(upsertCategorySet(primaryFilterSet));

      // Step 2: Apply primary filters to get the Working Set
      const filteredCategories = applyPrimaryFilters(allCategories, filters, analysisType);
      console.log('[Redux] Applied primary filters:', allCategories.length, '→', filteredCategories.length, 'categories');

      // Initialize only FILTERED categories as "selected" - all checkboxes start checked
      // This ensures users see only filtered data with all checkboxes checked
      const filteredCategoryIds = filteredCategories
        .map(cat => cat.categoryId)
        .filter((id): id is string => id !== undefined && id !== null);

      console.log('[Redux] Initializing filtered categories as selected:', filteredCategoryIds.length);

      // Dispatch to reactive selection (used by both table and charts)
      dispatch(categoryResultsSlice.actions.setReactiveSelection({
        type: 'category',
        ids: filteredCategoryIds,
        source: null
      }));

      console.log('[Redux] Render state initialization complete');
    }
  }
);

// Wrapper thunk to update filters AND update master filter CategorySet
export const updateFiltersWithRenderState = createAsyncThunk<
  void,
  Partial<Filters>,
  { dispatch: AppDispatch; state: RootState }
>(
  'categoryResults/updateFiltersWithRenderState',
  async (newFilters, { dispatch, getState }) => {
    // Update the filters in state
    dispatch(categoryResultsSlice.actions.setFilters(newFilters));

    // Get updated state
    const state = getState();
    const categories = state.categoryResults.data;
    const filters = state.categoryResults.filters;

    // Update master filter CategorySet
    console.log('[Redux] Updating master filter CategorySet with criteria:', filters);
    const primaryFilterSet = createPrimaryFilterSet(categories, {
      minBmd: filters.bmdMin,
      maxBmd: filters.bmdMax,
      minPValue: undefined,
      maxPValue: filters.pValueMax,
    });
    dispatch(upsertCategorySet(primaryFilterSet));

    // Also update the filtered status on each CategoryRenderState
    // (This will be used by charts to determine what to display)
    const { updateFilteredStatus } = await import('./renderStateSlice');
    const filteredStatusUpdates = categories.map(cat => ({
      categoryId: cat.categoryId!,
      filtered: primaryFilterSet.categoryIds.includes(cat.categoryId!),
    }));
    dispatch(updateFilteredStatus(filteredStatusUpdates));
  }
);

// Async thunk to load analysis parameters
export const loadAnalysisParameters = createAsyncThunk(
  'categoryResults/loadParameters',
  async ({ projectId, resultName }: { projectId: string; resultName: string }) => {
    console.log('[Redux] Loading analysis parameters:', { projectId, resultName });
    try {
      const parameters = await CategoryResultsService.getAnalysisParameters(projectId, resultName);
      console.log('[Redux] Received analysis parameters:', parameters);
      return parameters || [];
    } catch (error) {
      console.error('[Redux] Error loading analysis parameters:', error);
      throw error;
    }
  }
);

// Slice
const categoryResultsSlice = createSlice({
  name: 'categoryResults',
  initialState,

  reducers: {
    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<Filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = {};
    },

    // Set comparison mode (intersection vs union)
    setComparisonMode: (state, action: PayloadAction<'intersection' | 'union'>) => {
      state.comparisonMode = action.payload;
    },

    setViewMode: (state, action: PayloadAction<'simple' | 'power'>) => {
      state.viewMode = action.payload;
      saveViewMode(action.payload);
    },

    // Set analysis type (for conditional filter application)
    setAnalysisType: (state, action: PayloadAction<string | null>) => {
      state.analysisType = action.payload;
    },

    // Reactive selection actions (used by charts via useReactiveState hook)
    // Note: Table/ClusterPicker now use setReactiveSelection (integrated selection)
    setReactiveSelection: (
      state,
      action: PayloadAction<{ type: 'category' | 'cluster'; ids: any[]; source: SelectionSource }>
    ) => {
      const { type, ids, source } = action.payload;
      console.log('[Redux] setReactiveSelection reducer called:', {
        type,
        idsCount: ids.length,
        firstIds: ids.slice(0, 5),
        source,
        oldSelectedCount: state.reactiveSelection[type].selectedIds.size,
        oldSource: state.reactiveSelection[type].source
      });

      // CRITICAL: Replace the entire parent object to ensure React detects the change
      // Immer has issues with Set/Map reference changes, so we must replace the parent
      state.reactiveSelection[type] = {
        selectedIds: new Set(ids),
        source: source,
      };
      console.log('[Redux] setReactiveSelection after update:', {
        newSelectedCount: state.reactiveSelection[type].selectedIds.size,
        newSource: state.reactiveSelection[type].source
      });
    },

    toggleReactiveSelection: (
      state,
      action: PayloadAction<{ type: 'category' | 'cluster'; id: any }>
    ) => {
      const { type, id } = action.payload;
      const oldSelectedIds = state.reactiveSelection[type].selectedIds;
      const newSelectedIds = new Set(oldSelectedIds);

      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }

      // Replace entire parent object - use type assertion to handle union type
      state.reactiveSelection[type] = {
        selectedIds: newSelectedIds as any,
        source: state.reactiveSelection[type].source,
      };
    },

    clearReactiveSelection: (state, action: PayloadAction<'category' | 'cluster'>) => {
      const type = action.payload;

      // Replace entire parent object with empty state - use type assertion
      state.reactiveSelection[type] = {
        selectedIds: new Set() as any,
        source: null,
      };
    },

    // Highlighting action
    setHighlightedRow: (state, action: PayloadAction<number | null>) => {
      state.highlightedRow = action.payload;
    },

    // Sorting actions
    setSortColumn: (state, action: PayloadAction<{ column: string; direction: 'asc' | 'desc' }>) => {
      state.sortColumn = action.payload.column;
      state.sortDirection = action.payload.direction;
    },

    // Pagination actions
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },

    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.currentPage = 0; // Reset to first page when changing page size
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadCategoryResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCategoryResults.fulfilled, (state, action) => {
        state.loading = false;
        // Enrich categories with cluster info at load time
        state.data = action.payload.results.map(cat => {
          const umapData = cat.categoryId ? umapDataService.getByGoId(cat.categoryId) : undefined;
          let clusterId: number;
          if (!umapData) {
            clusterId = CLUSTER_NOT_IN_REF;  // -2: Not in UMAP reference
          } else {
            // Coerce cluster_id to number (may be string in reference data)
            const rawClusterId = umapData.cluster_id;
            clusterId = typeof rawClusterId === 'number'
              ? rawClusterId
              : (rawClusterId !== undefined ? parseInt(String(rawClusterId), 10) : CLUSTER_UNCLASSIFIED);
          }
          return { ...cat, clusterId };
        });
        state.experimentDescription = action.payload.experimentDescription;
        state.projectId = action.meta.arg.projectId;
        state.resultName = action.meta.arg.resultName;
        // Clear reactive selection state - REPLACE entire parent objects to trigger React updates
        state.reactiveSelection.category = {
          selectedIds: new Set(),
          source: null,
        };
        state.reactiveSelection.cluster = {
          selectedIds: new Set(),
          source: null,
        };
        state.highlightedRow = null;
      })
      .addCase(loadCategoryResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load results';
      })
      .addCase(loadAnalysisParameters.pending, (state) => {
        state.parametersLoading = true;
      })
      .addCase(loadAnalysisParameters.fulfilled, (state, action) => {
        state.parametersLoading = false;
        state.analysisParameters = action.payload;
      })
      .addCase(loadAnalysisParameters.rejected, (state, action) => {
        state.parametersLoading = false;
        console.error('Failed to load analysis parameters:', action.error);
      });
  },
});

// Export actions
export const {
  setFilters,
  clearFilters,
  setComparisonMode,
  setViewMode,
  setAnalysisType,
  // Reactive selection actions (used by charts via useReactiveState hook)
  setReactiveSelection,
  toggleReactiveSelection,
  clearReactiveSelection,
  setHighlightedRow,
  setSortColumn,
  setPage,
  setPageSize,
} = categoryResultsSlice.actions;

// Export reducer
export default categoryResultsSlice.reducer;

// Selectors - Base selectors
const selectCategoryResultsState = (state: RootState) => state.categoryResults;
const selectData = (state: RootState) => state.categoryResults.data;
export const selectExperimentDescription = (state: RootState) => state.categoryResults.experimentDescription;
const selectFilters = (state: RootState) => state.categoryResults.filters;
const selectSortColumn = (state: RootState) => state.categoryResults.sortColumn;
const selectSortDirection = (state: RootState) => state.categoryResults.sortDirection;
const selectCurrentPage = (state: RootState) => state.categoryResults.currentPage;
const selectPageSize = (state: RootState) => state.categoryResults.pageSize;

// Memoized selectors

/**
 * Helper function to check if a single row passes all filter criteria.
 * Used by selectDataWithFocus to mark each row with inFocus status.
 */
function rowPassesFilters(
  row: CategoryAnalysisResultWithCluster,
  filters: Filters,
  analysisType: string | null,
  filterGroups: ReturnType<typeof selectEnabledFilterGroups>
): boolean {
  // Master filters
  if (filters.bmdMin !== undefined && row.bmdMean !== undefined && row.bmdMean < filters.bmdMin) return false;
  if (filters.bmdMax !== undefined && row.bmdMean !== undefined && row.bmdMean > filters.bmdMax) return false;
  if (filters.pValueMax !== undefined && row.fishersExactTwoTailPValue !== undefined && row.fishersExactTwoTailPValue > filters.pValueMax) return false;
  if (filters.minGenesInCategory !== undefined && row.genesThatPassedAllFilters !== undefined && row.genesThatPassedAllFilters < filters.minGenesInCategory) return false;
  if (filters.fisherPValueMax !== undefined && row.fishersExactTwoTailPValue !== undefined && row.fishersExactTwoTailPValue > filters.fisherPValueMax) return false;

  // Primary Filter fields (Phase 1) - skip for GENE analyses
  if (analysisType !== 'GENE') {
    if (filters.percentageMin !== undefined && row.percentage !== undefined && row.percentage < filters.percentageMin) return false;
    if (filters.genesPassedFiltersMin !== undefined && row.genesThatPassedAllFilters !== undefined && row.genesThatPassedAllFilters < filters.genesPassedFiltersMin) return false;
    if (filters.allGenesMin !== undefined && row.geneAllCount !== undefined && row.geneAllCount < filters.allGenesMin) return false;
    if (filters.allGenesMax !== undefined && row.geneAllCount !== undefined && row.geneAllCount > filters.allGenesMax) return false;
  }

  // Filter groups (custom filters) with AND logic
  if (filterGroups.length > 0) {
    if (!evaluateFilterGroups(filterGroups, row)) return false;
  }

  return true;
}

/**
 * Debug helper: Count how many rows fail each filter criterion.
 * Call this once per selector invocation to understand filter impact.
 */
function debugFilterImpact(
  data: CategoryAnalysisResultWithCluster[],
  filters: Filters,
  analysisType: string | null
): void {
  const counts = {
    total: data.length,
    failBmdMin: 0,
    failBmdMax: 0,
    failPValueMax: 0,
    failMinGenesInCategory: 0,
    failFisherPValueMax: 0,
    failPercentageMin: 0,
    failGenesPassedFiltersMin: 0,
    failAllGenesMin: 0,
    failAllGenesMax: 0,
  };

  data.forEach(row => {
    if (filters.bmdMin !== undefined && row.bmdMean !== undefined && row.bmdMean < filters.bmdMin) counts.failBmdMin++;
    if (filters.bmdMax !== undefined && row.bmdMean !== undefined && row.bmdMean > filters.bmdMax) counts.failBmdMax++;
    if (filters.pValueMax !== undefined && row.fishersExactTwoTailPValue !== undefined && row.fishersExactTwoTailPValue > filters.pValueMax) counts.failPValueMax++;
    if (filters.minGenesInCategory !== undefined && row.genesThatPassedAllFilters !== undefined && row.genesThatPassedAllFilters < filters.minGenesInCategory) counts.failMinGenesInCategory++;
    if (filters.fisherPValueMax !== undefined && row.fishersExactTwoTailPValue !== undefined && row.fishersExactTwoTailPValue > filters.fisherPValueMax) counts.failFisherPValueMax++;

    if (analysisType !== 'GENE') {
      if (filters.percentageMin !== undefined && row.percentage !== undefined && row.percentage < filters.percentageMin) counts.failPercentageMin++;
      if (filters.genesPassedFiltersMin !== undefined && row.genesThatPassedAllFilters !== undefined && row.genesThatPassedAllFilters < filters.genesPassedFiltersMin) counts.failGenesPassedFiltersMin++;
      if (filters.allGenesMin !== undefined && row.geneAllCount !== undefined && row.geneAllCount < filters.allGenesMin) counts.failAllGenesMin++;
      if (filters.allGenesMax !== undefined && row.geneAllCount !== undefined && row.geneAllCount > filters.allGenesMax) counts.failAllGenesMax++;
    }
  });

  // Only log non-zero failures
  const activeFailures = Object.entries(counts)
    .filter(([key, val]) => key !== 'total' && val > 0)
    .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});

  // Log explicitly to avoid truncation
  console.log('[categoryResultsSlice] Filter impact analysis - total:', counts.total);
  console.log('[categoryResultsSlice] Filter impact analysis - failures:', JSON.stringify(activeFailures));

  // Also log data distribution for debugging
  if (data.length > 0) {
    const percentages = data.map(r => r.percentage).filter(v => v !== undefined);
    const genesPassed = data.map(r => r.genesThatPassedAllFilters).filter(v => v !== undefined);
    const allGenes = data.map(r => r.geneAllCount).filter(v => v !== undefined);

    console.log('[categoryResultsSlice] Data distribution:', {
      percentage: { min: Math.min(...percentages), max: Math.max(...percentages), defined: percentages.length },
      genesThatPassedAllFilters: { min: Math.min(...genesPassed), max: Math.max(...genesPassed), defined: genesPassed.length },
      geneAllCount: { min: Math.min(...allGenes), max: Math.max(...allGenes), defined: allGenes.length },
    });
  }
}

/**
 * selectDataWithFocus
 *
 * Returns ALL data with an `inFocus` boolean indicating whether each category
 * passes the user's filter criteria. Categories that don't pass filters are
 * NOT removed - they're marked as `inFocus: false`.
 *
 * This enables display mode to control visibility of out-of-focus categories:
 * - Highlight mode: shows out-of-focus at full opacity (context)
 * - Dim mode: shows out-of-focus at reduced opacity
 * - Focus mode: hides out-of-focus completely
 */
export const selectDataWithFocus = createSelector(
  [selectData, selectFilters, (state: RootState) => state.categoryResults.analysisType, selectEnabledFilterGroups],
  (data, filters, analysisType, filterGroups): (CategoryAnalysisResultWithCluster & CategoryWithFocus)[] => {
    // Log ALL filter values to see if there are unexpected filters being applied
    console.log('[categoryResultsSlice] selectDataWithFocus running with:', {
      dataCount: data.length,
      filters: JSON.stringify(filters, null, 2),
      analysisType,
      filterGroupsCount: filterGroups.length,
    });

    // Log individual filter values for clarity
    console.log('[categoryResultsSlice] Individual filter values:', {
      // Master filters (legacy)
      bmdMin: filters.bmdMin,
      bmdMax: filters.bmdMax,
      pValueMax: filters.pValueMax,
      minGenesInCategory: filters.minGenesInCategory,
      fisherPValueMax: filters.fisherPValueMax,
      foldChangeMin: filters.foldChangeMin,
      // Primary filters
      percentageMin: filters.percentageMin,
      genesPassedFiltersMin: filters.genesPassedFiltersMin,
      allGenesMin: filters.allGenesMin,
      allGenesMax: filters.allGenesMax,
    });

    // Debug: analyze filter impact before computing inFocus
    if (data.length > 0) {
      debugFilterImpact(data, filters, analysisType);
    }

    const result = data.map(row => ({
      ...row,
      inFocus: rowPassesFilters(row, filters, analysisType, filterGroups),
    }));

    const inFocusCount = result.filter(r => r.inFocus).length;
    console.log('[categoryResultsSlice] selectDataWithFocus result:', {
      total: result.length,
      inFocus: inFocusCount,
      outOfFocus: result.length - inFocusCount,
    });

    // Debug: log first few rows to see their filter values
    if (result.length > 0) {
      console.log('[categoryResultsSlice] Sample rows:', result.slice(0, 3).map(r => ({
        categoryId: r.categoryId,
        inFocus: r.inFocus,
        percentage: r.percentage,
        genesThatPassedAllFilters: r.genesThatPassedAllFilters,
        geneAllCount: r.geneAllCount,
        clusterId: r.clusterId,
      })));
    }

    return result;
  }
);

/**
 * selectFilteredData (alias: selectWorkingSet)
 *
 * Returns only categories that are "in focus" (pass filter criteria).
 * This is for backward compatibility with components that expect filtered data.
 *
 * For components that need ALL data with focus status, use selectDataWithFocus instead.
 */
export const selectFilteredData = createSelector(
  [selectDataWithFocus],
  (dataWithFocus) => {
    console.log('[categoryResultsSlice] selectFilteredData running (derived from selectDataWithFocus)');
    return dataWithFocus.filter(row => row.inFocus);
  }
);

/**
 * Helper function to sort data by column and direction.
 * Used by both selectSortedData and selectSortedDataWithFocus.
 *
 * Special handling for clusterId:
 * - Positive cluster IDs (0+) sorted first in ascending order
 * - Cluster ID -1 (unclassified) at the end
 * - Cluster ID -2 (not in reference) at the very end
 */
function sortData<T extends CategoryAnalysisResultDto>(
  data: T[],
  sortColumn: string | null,
  sortDirection: 'asc' | 'desc'
): T[] {
  if (!sortColumn) return data;

  return [...data].sort((a, b) => {
    const aVal = (a as any)[sortColumn];
    const bVal = (b as any)[sortColumn];

    // Special handling for clusterId - always put -1 and -2 at the end
    if (sortColumn === 'clusterId') {
      const aCluster = aVal as number;
      const bCluster = bVal as number;

      // Both are special values (-1 or -2)
      if (aCluster < 0 && bCluster < 0) {
        // -1 before -2 (unclassified before not-in-reference)
        return aCluster > bCluster ? -1 : aCluster < bCluster ? 1 : 0;
      }

      // One is special, one is normal
      if (aCluster < 0) return 1;  // a goes to end
      if (bCluster < 0) return -1; // b goes to end

      // Both are normal cluster IDs (0+)
      return sortDirection === 'asc' ? aCluster - bCluster : bCluster - aCluster;
    }

    // Standard sorting for other columns
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * selectSortedDataWithFocus
 *
 * Returns ALL data (with inFocus status) sorted by the current sort column.
 * Use this for components that need to show all data with display mode styling.
 */
export const selectSortedDataWithFocus = createSelector(
  [selectDataWithFocus, selectSortColumn, selectSortDirection],
  (dataWithFocus, sortColumn, sortDirection) => {
    return sortData(dataWithFocus, sortColumn, sortDirection);
  }
);

/**
 * selectSortedData
 *
 * Returns only in-focus data sorted by the current sort column.
 * For backward compatibility with components that expect filtered data.
 */
export const selectSortedData = createSelector(
  [selectFilteredData, selectSortColumn, selectSortDirection],
  (filtered, sortColumn, sortDirection) => {
    return sortData(filtered, sortColumn, sortDirection);
  }
);

export const selectPaginatedData = createSelector(
  [selectSortedData, selectCurrentPage, selectPageSize],
  (sorted, currentPage, pageSize) => {
    const start = currentPage * pageSize;
    return sorted.slice(start, start + pageSize);
  }
);

// Selector for reactive category selection (integrated selection state)
export const selectCategorySelectedIds = (state: RootState): Set<string> =>
  state.categoryResults.reactiveSelection.category.selectedIds;

// Selector for chart data - returns highlighted categories for visualization
export const selectChartData = createSelector(
  [selectSortedData, selectCategorySelectedIds],
  (allData, selectedIds) => {
    // If categories are selected (from ClusterPicker or table selection), filter to those
    if (selectedIds.size > 0) {
      return allData.filter(row => selectedIds.has(row.categoryId || ''));
    }

    // Default: return all data (no filtering)
    return allData;
  }
);

// Phase 3: Derived selection selectors
export const selectIsAnythingSelected = createSelector(
  [selectCategorySelectedIds],
  (selectedIds) => selectedIds.size > 0
);

export const selectSelectedCount = createSelector(
  [selectCategorySelectedIds],
  (selectedIds) => selectedIds.size
);

export const selectUnselectedCount = createSelector(
  [selectFilteredData, selectSelectedCount],
  (allData, selectedCount) => {
    return allData.length - selectedCount;
  }
);

/**
 * Alias for selectFilteredData.
 * Use this name when you want to emphasize the two-layer architecture:
 * Working Set (hard filter) vs Visibility (visual state).
 */
export const selectWorkingSet = selectFilteredData;
