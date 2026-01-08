import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import type ExperimentDescriptionDto from 'Frontend/generated/com/sciome/dto/ExperimentDescriptionDto';
import type { RootState, AppDispatch } from '../store';
import type { ReactiveSelectionMap, SelectionSource } from 'Frontend/types/reactiveTypes';
import { initializeCategories, upsertCategorySet } from './renderStateSlice';
import { createClusterSets, createPrimaryFilterSet } from '../utils/initializeRenderState';
import { highlightCategories, selectHighlightedIds } from './visibilitySlice';
import { applyFilterGroups } from '../../utils/filterEvaluation';
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
  // Cluster filter
  excludeUnclassified?: boolean;  // Filter out cluster_id === -1 (unclassified categories)
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
  sortColumn: null,
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
  excludeUnclassified: true,  // Exclude cluster_id === -1 (unclassified) by default
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

    // Cluster filter: exclude unclassified categories if enabled
    // Note: This uses the enriched clusterId from CategoryAnalysisResultWithCluster
    const rowWithCluster = row as CategoryAnalysisResultWithCluster;
    if (filters.excludeUnclassified && rowWithCluster.clusterId === CLUSTER_UNCLASSIFIED) return false;

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

      console.log('[Redux] Initializing filtered categories as highlighted:', filteredCategoryIds.length);

      // Dispatch to visibilitySlice (for row highlighting and table checkbox state)
      dispatch(highlightCategories({ categoryIds: filteredCategoryIds, exclusive: true }));

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
    // Note: Table/ClusterPicker use visibilitySlice.highlightCategories instead
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
 * selectFilteredData (alias: selectWorkingSet)
 *
 * This is the "Hard Filter" in the two-layer filtering architecture:
 * 1. Hard Filter (this selector) → defines the Working Set (what data is available)
 * 2. Visibility (visibilitySlice) → per-category visual state (how data is displayed)
 *
 * Categories excluded by the hard filter are completely removed from the data pipeline.
 * Categories in the working set can have different visibility states (highlighted, normal, dimmed, hidden).
 */
export const selectFilteredData = createSelector(
  [selectData, selectFilters, (state: RootState) => state.categoryResults.analysisType, selectEnabledFilterGroups],
  (data, filters, analysisType, filterGroups) => {
    console.log('[categoryResultsSlice] selectFilteredData running:');
    console.log('[categoryResultsSlice] Filter groups count:', filterGroups.length);
    console.log('[categoryResultsSlice] Filter groups:', filterGroups.map(g => ({ id: g.id, name: g.name, enabled: g.enabled, filterCount: g.filters.length, enabledFilters: g.filters.filter(f => f.enabled).length })));
    // Apply master filters
    let filtered = data.filter(row => {
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

      // Cluster filter: exclude unclassified categories if enabled
      if (filters.excludeUnclassified && row.clusterId === CLUSTER_UNCLASSIFIED) return false;

      return true;
    });

    // Apply filter groups (custom master filters) with AND logic
    if (filterGroups.length > 0) {
      filtered = applyFilterGroups(filtered, filterGroups);
    }

    return filtered;
  }
);

export const selectSortedData = createSelector(
  [selectFilteredData, selectSortColumn, selectSortDirection],
  (filtered, sortColumn, sortDirection) => {
    if (!sortColumn) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = a[sortColumn as keyof CategoryAnalysisResultDto];
      const bVal = b[sortColumn as keyof CategoryAnalysisResultDto];

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
);

export const selectPaginatedData = createSelector(
  [selectSortedData, selectCurrentPage, selectPageSize],
  (sorted, currentPage, pageSize) => {
    const start = currentPage * pageSize;
    return sorted.slice(start, start + pageSize);
  }
);

// Selector for chart data - returns highlighted categories for visualization
export const selectChartData = createSelector(
  [selectSortedData, selectHighlightedIds],
  (allData, highlightedIds) => {
    // If categories are highlighted (from ClusterPicker or table selection), filter to those
    if (highlightedIds.size > 0) {
      return allData.filter(row => highlightedIds.has(row.categoryId || ''));
    }

    // Default: return all data (no filtering)
    return allData;
  }
);

// Phase 3: Derived selection selectors
export const selectIsAnythingSelected = createSelector(
  [selectHighlightedIds],
  (highlightedIds) => highlightedIds.size > 0
);

export const selectSelectedCount = createSelector(
  [selectHighlightedIds],
  (highlightedIds) => highlightedIds.size
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
