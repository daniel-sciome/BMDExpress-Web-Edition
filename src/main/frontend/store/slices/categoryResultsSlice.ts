import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import type { RootState } from '../store';
import type { ReactiveSelectionMap, SelectionSource } from 'Frontend/types/reactiveTypes';

// Filters interface
interface Filters {
  bmdMin?: number;
  bmdMax?: number;
  pValueMax?: number;
  minGenesInCategory?: number;
  fisherPValueMax?: number;
  foldChangeMin?: number;
  // Master Filter fields (Phase 1)
  percentageMin?: number;
  genesPassedFiltersMin?: number;
  allGenesMin?: number;
  allGenesMax?: number;
}

// State interface
interface CategoryResultsState {
  // Data
  data: CategoryAnalysisResultDto[];
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

  // Phase 4: Generic reactive selection state
  reactiveSelection: ReactiveSelectionMap;

  // Legacy selection state (kept for backward compatibility during migration)
  // TODO: Phase 9 - remove these after full migration
  selectedCategoryIds: Set<string>;
  selectedUmapGoIds: Set<string>;

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
  loading: false,
  error: null,
  projectId: null,
  resultName: null,
  analysisParameters: [],
  parametersLoading: false,
  analysisType: null,
  filters: {},
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
  // Legacy selection state (backward compatibility)
  selectedCategoryIds: new Set<string>(),
  selectedUmapGoIds: new Set<string>(),
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
      const data = await CategoryResultsService.getCategoryResults(projectId, resultName);
      console.log('[Redux] Received data:', data);
      // Filter out any undefined values that might come from the backend
      const filtered = (data || []).filter((item): item is CategoryAnalysisResultDto => item !== undefined);
      console.log('[Redux] Filtered data:', filtered.length, 'items');
      return filtered;
    } catch (error) {
      console.error('[Redux] Error loading category results:', error);
      throw error;
    }
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

    // Set analysis type (for conditional filter application)
    setAnalysisType: (state, action: PayloadAction<string | null>) => {
      state.analysisType = action.payload;
    },

    // Selection actions (using category IDs)
    // Phase 4: Legacy actions now sync to reactive state for backward compatibility
    setSelectedCategoryIds: (state, action: PayloadAction<string[]>) => {
      state.selectedCategoryIds = new Set(action.payload);
      // Sync to reactive state
      state.reactiveSelection.category.selectedIds = new Set(action.payload);
      state.reactiveSelection.category.source = 'table';
    },

    toggleCategorySelection: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      if (state.selectedCategoryIds.has(categoryId)) {
        state.selectedCategoryIds.delete(categoryId);
      } else {
        state.selectedCategoryIds.add(categoryId);
      }
      // Sync to reactive state
      state.reactiveSelection.category.selectedIds = new Set(state.selectedCategoryIds);
      state.reactiveSelection.category.source = 'table';
    },

    clearSelection: (state) => {
      state.selectedCategoryIds.clear();
      // Sync to reactive state
      state.reactiveSelection.category.selectedIds.clear();
      state.reactiveSelection.category.source = null;
    },

    // Phase 3: Selection helper actions
    // Phase 4: Now sync to reactive state
    toggleMultipleCategoryIds: (state, action: PayloadAction<string[]>) => {
      const categoryIds = action.payload;
      categoryIds.forEach(id => {
        if (state.selectedCategoryIds.has(id)) {
          state.selectedCategoryIds.delete(id);
        } else {
          state.selectedCategoryIds.add(id);
        }
      });
      // Sync to reactive state
      state.reactiveSelection.category.selectedIds = new Set(state.selectedCategoryIds);
      state.reactiveSelection.category.source = 'table';
    },

    selectAllCategories: (state, action: PayloadAction<string[] | undefined>) => {
      // Select all categories (optionally provide specific IDs, otherwise uses all data)
      const idsToSelect = action.payload || state.data.map(cat => cat.categoryId).filter(Boolean) as string[];
      state.selectedCategoryIds = new Set(idsToSelect);
      // Sync to reactive state
      state.reactiveSelection.category.selectedIds = new Set(idsToSelect);
      state.reactiveSelection.category.source = 'table';
    },

    invertSelection: (state, action: PayloadAction<string[] | undefined>) => {
      // Invert selection within a given set of IDs (or all data if not provided)
      const allIds = action.payload || state.data.map(cat => cat.categoryId).filter(Boolean) as string[];
      const newSelection = new Set<string>();

      allIds.forEach(id => {
        if (!state.selectedCategoryIds.has(id)) {
          newSelection.add(id);
        }
      });

      state.selectedCategoryIds = newSelection;
      // Sync to reactive state
      state.reactiveSelection.category.selectedIds = new Set(newSelection);
      state.reactiveSelection.category.source = 'table';
    },

    // Phase 4: Generic reactive selection actions
    setReactiveSelection: (
      state,
      action: PayloadAction<{ type: 'category' | 'cluster'; ids: any[]; source: SelectionSource }>
    ) => {
      const { type, ids, source } = action.payload;
      state.reactiveSelection[type].selectedIds = new Set(ids);
      state.reactiveSelection[type].source = source;

      // Backward compatibility: sync category selection to legacy state
      if (type === 'category') {
        state.selectedCategoryIds = new Set(ids as string[]);
      }
    },

    toggleReactiveSelection: (
      state,
      action: PayloadAction<{ type: 'category' | 'cluster'; id: any }>
    ) => {
      const { type, id } = action.payload;
      const selectedIds = state.reactiveSelection[type].selectedIds;

      if (selectedIds.has(id)) {
        selectedIds.delete(id);
      } else {
        selectedIds.add(id);
      }

      // Backward compatibility: sync category selection to legacy state
      if (type === 'category') {
        state.selectedCategoryIds = new Set(state.reactiveSelection.category.selectedIds as Set<string>);
      }
    },

    clearReactiveSelection: (state, action: PayloadAction<'category' | 'cluster'>) => {
      const type = action.payload;
      state.reactiveSelection[type].selectedIds.clear();
      state.reactiveSelection[type].source = null;

      // Backward compatibility: sync category selection to legacy state
      if (type === 'category') {
        state.selectedCategoryIds.clear();
      }
    },

    // UMAP selection actions (GO IDs selected from UMAP scatter plot)
    setSelectedUmapGoIds: (state, action: PayloadAction<string[]>) => {
      state.selectedUmapGoIds = new Set(action.payload);
    },

    toggleUmapGoIdSelection: (state, action: PayloadAction<string>) => {
      const goId = action.payload;
      if (state.selectedUmapGoIds.has(goId)) {
        state.selectedUmapGoIds.delete(goId);
      } else {
        state.selectedUmapGoIds.add(goId);
      }
    },

    clearUmapSelection: (state) => {
      state.selectedUmapGoIds.clear();
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
        state.data = action.payload;
        state.projectId = action.meta.arg.projectId;
        state.resultName = action.meta.arg.resultName;
        // Clear legacy selection state
        state.selectedCategoryIds.clear();
        state.selectedUmapGoIds.clear();
        // Clear reactive selection state
        state.reactiveSelection.category.selectedIds.clear();
        state.reactiveSelection.category.source = null;
        state.reactiveSelection.cluster.selectedIds.clear();
        state.reactiveSelection.cluster.source = null;
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
  setAnalysisType,
  setSelectedCategoryIds,
  toggleCategorySelection,
  clearSelection,
  toggleMultipleCategoryIds,
  selectAllCategories,
  invertSelection,
  // Phase 4: Reactive selection actions
  setReactiveSelection,
  toggleReactiveSelection,
  clearReactiveSelection,
  setSelectedUmapGoIds,
  toggleUmapGoIdSelection,
  clearUmapSelection,
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
const selectFilters = (state: RootState) => state.categoryResults.filters;
const selectSortColumn = (state: RootState) => state.categoryResults.sortColumn;
const selectSortDirection = (state: RootState) => state.categoryResults.sortDirection;
const selectCurrentPage = (state: RootState) => state.categoryResults.currentPage;
const selectPageSize = (state: RootState) => state.categoryResults.pageSize;

// Memoized selectors
export const selectFilteredData = createSelector(
  [selectData, selectFilters, (state: RootState) => state.categoryResults.analysisType],
  (data, filters, analysisType) => {
    return data.filter(row => {
      if (filters.bmdMin !== undefined && row.bmdMean !== undefined && row.bmdMean < filters.bmdMin) return false;
      if (filters.bmdMax !== undefined && row.bmdMean !== undefined && row.bmdMean > filters.bmdMax) return false;
      if (filters.pValueMax !== undefined && row.fishersExactTwoTailPValue !== undefined && row.fishersExactTwoTailPValue > filters.pValueMax) return false;
      if (filters.minGenesInCategory !== undefined && row.genesThatPassedAllFilters !== undefined && row.genesThatPassedAllFilters < filters.minGenesInCategory) return false;
      if (filters.fisherPValueMax !== undefined && row.fishersExactTwoTailPValue !== undefined && row.fishersExactTwoTailPValue > filters.fisherPValueMax) return false;

      // Master Filter fields (Phase 1) - skip for GENE analyses
      if (analysisType !== 'GENE') {
        if (filters.percentageMin !== undefined && row.percentage !== undefined && row.percentage < filters.percentageMin) return false;
        if (filters.genesPassedFiltersMin !== undefined && row.genesThatPassedAllFilters !== undefined && row.genesThatPassedAllFilters < filters.genesPassedFiltersMin) return false;
        if (filters.allGenesMin !== undefined && row.geneAllCount !== undefined && row.geneAllCount < filters.allGenesMin) return false;
        if (filters.allGenesMax !== undefined && row.geneAllCount !== undefined && row.geneAllCount > filters.allGenesMax) return false;
      }

      return true;
    });
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

// Selector for chart data - returns selected categories based on UMAP or table selection
// Priority: UMAP selection > Table selection > All data
export const selectChartData = createSelector(
  [
    selectSortedData,
    (state: RootState) => state.categoryResults.selectedUmapGoIds,
    (state: RootState) => state.categoryResults.selectedCategoryIds
  ],
  (allData, umapGoIds, categoryIds) => {
    // Priority 1: UMAP selection (if any GO IDs are selected in UMAP scatter plot)
    if (umapGoIds.size > 0) {
      return allData.filter(row => umapGoIds.has(row.categoryId || ''));
    }

    // Priority 2: Table selection (if any categories are selected in table)
    if (categoryIds.size > 0) {
      return allData.filter(row => categoryIds.has(row.categoryId || ''));
    }

    // Default: return all data (no filtering)
    return allData;
  }
);

// Phase 3: Derived selection selectors
export const selectIsAnythingSelected = createSelector(
  [
    (state: RootState) => state.categoryResults.selectedCategoryIds,
    (state: RootState) => state.categoryResults.selectedUmapGoIds
  ],
  (categoryIds, umapGoIds) => {
    return categoryIds.size > 0 || umapGoIds.size > 0;
  }
);

export const selectSelectedCount = createSelector(
  [
    (state: RootState) => state.categoryResults.selectedCategoryIds,
    (state: RootState) => state.categoryResults.selectedUmapGoIds
  ],
  (categoryIds, umapGoIds) => {
    // UMAP selection takes precedence (as per selectChartData logic)
    if (umapGoIds.size > 0) {
      return umapGoIds.size;
    }
    return categoryIds.size;
  }
);

export const selectUnselectedCount = createSelector(
  [selectFilteredData, selectSelectedCount],
  (allData, selectedCount) => {
    return allData.length - selectedCount;
  }
);
