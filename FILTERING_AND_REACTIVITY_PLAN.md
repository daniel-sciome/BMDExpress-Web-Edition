 📋 Master Filter & Reactivity Implementation Plan

  Data Structure Analysis

  Available Filter Fields:
  - bmdFifthPercentileTotalGenes (number) - BMD 5th percentile across all genes
  - percentage (number) - Percentage value (likely % genes in category)
  - genesThatPassedAllFilters (number) - Count of genes passing filters

  UMAP Data:
  - 19,896 lines with ~3,500-4,000 GO terms
  - Structure: { UMAP_1, UMAP_2, go_id, go_term, cluster_id }
  - All terms are GO BP (Biological Process)
  - Join key: categoryId === go_id

  ---
  Phase 1: Master Filter Component

  Goal: Add global filtering UI with 3 numeric range inputs

  Tasks:

  1. Create MasterFilter Component (components/MasterFilter.tsx)
    - Three number range inputs:
        - BMD 5th Percentile (min/max)
      - Percentage (min/max)
      - Genes Passed Filters (min)
    - "Apply Filters" and "Clear Filters" buttons
    - Display active filter count badge
    - Persist to localStorage
  2. Update Redux Slice (categoryResultsSlice.ts)
    - Extend Filters interface:
    interface Filters {
    bmdMin?: number;
    bmdMax?: number;
    pValueMax?: number;
    minGenesInCategory?: number;
    fisherPValueMax?: number;
    foldChangeMin?: number;
    // NEW FILTERS:
    bmd5thPercentileMin?: number;
    bmd5thPercentileMax?: number;
    percentageMin?: number;
    percentageMax?: number;
    genesPassedMin?: number;
  }
    - Update selectFilteredData selector to apply new filters
  3. Integrate into UI (CategoryResultsView.tsx)
    - Add MasterFilter component above CategoryResultsGrid
    - Wire to Redux state

  Deliverable: Working master filter that reduces visible categories in table

  ---
  Phase 2: UMAP Data Integration

  Goal: Join UMAP coordinates with category analysis data

  Tasks:

  1. Create UMAP Integration Module (store/slices/umapIntegration.ts)
    - Import hardcodedReferenceData from data/referenceUmapData.ts
    - Create selector selectCategoryDataWithUmap:
    // Joins category results with UMAP coordinates
  // Returns: CategoryAnalysisResultDto & { umap_x, umap_y, cluster_id }
    - Only include categories that exist in UMAP data (GO BP only)
  2. Add to Redux Store
    - Create memoized selector for performance
    - Cache join results (only recompute when data changes)
  3. Update Types
  export interface CategoryWithUmap extends CategoryAnalysisResultDto {
    umap_x?: number;
    umap_y?: number;
    cluster_id?: number | string;
    hasUmapData: boolean;
  }

  Deliverable: Selector that provides enriched category data with UMAP coordinates

  ---
  Phase 3: Centralized Selection State

  Goal: Single source of truth for selections with bidirectional updates

  Current State (Already Exists):

  // categoryResultsSlice.ts
  selectedCategoryIds: Set<string>        // Table selections
  selectedUmapGoIds: Set<string>          // UMAP selections
  selectChartData: Selector               // Priority: UMAP > Table > All

  Tasks:

  1. Verify Selection Priority Logic
    - ✅ UMAP selection takes precedence
    - ✅ Table selection used when no UMAP selection
    - ✅ Show all data when nothing selected
  2. Add Selection Helper Actions
  // New actions
  toggleMultipleCategoryIds(categoryIds: string[])
  selectAllCategories()
  invertSelection()
  3. Add Derived Selectors
  selectIsAnythingSelected: boolean
  selectSelectedCount: number
  selectUnselectedCount: number

  Deliverable: Robust selection state management

  ---
  Phase 4: Chart Reactivity - Core Infrastructure (REDESIGNED)

  Goal: Generic "reactive-to" abstraction for multi-dimensional selection

  Concept: Components declare what they're "reactive to" (categoryId, clusterId, etc.)
  and automatically update when that selection changes anywhere in the app.

  Tasks:

  1. Define Reactive Types (types/reactiveTypes.ts)
  export type ReactiveType = 'categoryId' | 'clusterId';

  export interface ReactiveState {
    selectedIds: Set<string | number>;
    source: 'table' | 'umap' | 'chart' | null;
  }

  export interface ReactiveSelectionMap {
    category: ReactiveState;
    cluster: ReactiveState;
  }

  2. Extend Redux State (categoryResultsSlice.ts)
  interface CategoryResultsState {
    // Replace existing selection Sets with typed structure
    reactiveSelection: {
      category: {
        selectedIds: Set<string>;
        source: 'table' | 'umap' | 'chart' | null;
      };
      cluster: {
        selectedIds: Set<number>;
        source: 'umap' | null;
      };
    };
    // Keep legacy for backward compatibility during migration
    selectedCategoryIds: Set<string>;  // Alias to reactiveSelection.category.selectedIds
  }

  // Add actions
  setReactiveSelection(type: 'category' | 'cluster', ids: any[], source: string)
  toggleReactiveSelection(type: 'category' | 'cluster', id: any)
  clearReactiveSelection(type: 'category' | 'cluster')

  3. Create useReactiveState Hook (components/charts/hooks/useReactiveState.ts)
  export function useReactiveState(reactTo: 'categoryId' | 'clusterId') {
    const dispatch = useAppDispatch();
    const selectedIds = useAppSelector(state => {
      if (reactTo === 'categoryId') return state.categoryResults.reactiveSelection.category.selectedIds;
      if (reactTo === 'clusterId') return state.categoryResults.reactiveSelection.cluster.selectedIds;
    });

    const isSelected = (id: any) => selectedIds.has(id);
    const isAnythingSelected = selectedIds.size > 0;

    const handleSelect = (id: any, isMultiSelect: boolean, source: string) => {
      const type = reactTo === 'categoryId' ? 'category' : 'cluster';
      if (isMultiSelect) {
        dispatch(toggleReactiveSelection(type, id));
      } else {
        dispatch(setReactiveSelection(type, [id], source));
      }
    };

    const handleMultiSelect = (ids: any[], source: string) => {
      const type = reactTo === 'categoryId' ? 'category' : 'cluster';
      dispatch(setReactiveSelection(type, ids, source));
    };

    return {
      selectedIds,
      isSelected,
      isAnythingSelected,
      handleSelect,
      handleMultiSelect,
      source: reactTo === 'categoryId'
        ? state.categoryResults.reactiveSelection.category.source
        : state.categoryResults.reactiveSelection.cluster.source
    };
  }

  4. Create Generic Reactive Utilities (components/charts/utils/reactiveStyles.ts)
  export function applyReactiveStyles<T>(
    data: T[],
    idField: keyof T,
    selectedIds: Set<any>,
    mode: 'highlight' | 'dim' | 'hide'
  ): Partial<PlotlyStyle>[] {
    return data.map(item => {
      const id = item[idField];
      const isSelected = selectedIds.has(id);
      const hasSelection = selectedIds.size > 0;

      if (!hasSelection) {
        // No selection - all full opacity
        return { opacity: 1.0, line: { width: 0 } };
      }

      if (isSelected) {
        // Selected - highlight
        return { opacity: 1.0, line: { width: 2, color: '#fff' } };
      }

      // Not selected - apply mode
      switch (mode) {
        case 'highlight': return { opacity: 1.0 };
        case 'dim': return { opacity: 0.15 };
        case 'hide': return { opacity: 0 };
      }
    });
  }

  export function getReactiveColor(
    id: any,
    selectedIds: Set<any>,
    baseColor: string,
    highlightColor?: string
  ): string {
    if (selectedIds.size === 0) return baseColor;
    return selectedIds.has(id) ? (highlightColor || baseColor) : baseColor;
  }

  export function getReactiveOpacity(
    id: any,
    selectedIds: Set<any>,
    mode: 'highlight' | 'dim' | 'hide'
  ): number {
    if (selectedIds.size === 0) return 1.0;
    if (selectedIds.has(id)) return 1.0;
    switch (mode) {
      case 'highlight': return 1.0;
      case 'dim': return 0.15;
      case 'hide': return 0;
    }
  }

  5. Create Category-Cluster Bridge Utilities (store/slices/selectionBridge.ts)
  // Utilities to translate between category and cluster selections

  export const selectCategoriesInClusters = createSelector(
    [
      (state: RootState) => state.categoryResults.reactiveSelection.cluster.selectedIds,
      selectCategoryDataWithUmap
    ],
    (clusterIds, categoriesWithUmap) => {
      // Return all categories in the selected clusters
      return categoriesWithUmap
        .filter(cat => cat.cluster_id && clusterIds.has(cat.cluster_id))
        .map(cat => cat.categoryId)
        .filter(Boolean) as string[];
    }
  );

  export const selectClustersOfCategories = createSelector(
    [
      (state: RootState) => state.categoryResults.reactiveSelection.category.selectedIds,
      selectCategoryDataWithUmap
    ],
    (categoryIds, categoriesWithUmap) => {
      // Return clusters containing any selected categories
      const clusters = new Set<number | string>();
      categoriesWithUmap.forEach(cat => {
        if (cat.categoryId && categoryIds.has(cat.categoryId) && cat.cluster_id !== undefined) {
          clusters.add(cat.cluster_id);
        }
      });
      return clusters;
    }
  );

  6. Migration Strategy
  - Keep existing selectedCategoryIds as alias to reactiveSelection.category.selectedIds
  - Keep existing selectedUmapGoIds temporarily for UMAP priority logic
  - Gradually migrate components to useReactiveState
  - Phase out old selection state in Phase 9

  Deliverable: Generic reactive infrastructure supporting multiple selection types

  ---
  Key Design Benefits:

  1. Charts declare intent: "I'm reactive to categoryId" or "I'm reactive to clusterId"
  2. Single abstraction handles all selection types (current and future)
  3. Bridge utilities enable cross-dimension reactivity (cluster → categories, etc.)
  4. Source tracking allows debugging and priority logic
  5. Backward compatible during migration
  6. Extensible to future types (geneId, pathwayId, etc.)

  Example Usage:

  // Chart reactive to individual categories
  const { selectedIds, handleSelect } = useReactiveState('categoryId');

  // UMAP chart reactive to both categories AND clusters
  const categoryState = useReactiveState('categoryId');
  const clusterState = useReactiveState('clusterId');

  // Click category → highlights that category in all charts
  // Click cluster → highlights all categories in that cluster

  ---
  Phase 5: Update Individual Charts

  Goal: Apply reactivity to each chart component

  Chart Priority Order:

  1. UmapScatterPlot (Special - drives other selections)
  2. BMDvsPValueScatter (High usage)
  3. BMDBoxPlot (High usage)
  4. BubbleChart
  5. RangePlot
  6. BarCharts
  7. AccumulationCharts
  8. BestModelsPieChart
  9. VennDiagram (Complex - multi-category)

  For Each Chart:

  1. Use useChartSelection() hook
  2. Use selectChartData selector (filtered + selection-aware)
  3. Apply opacity/color based on selection:
    - Selected: Full opacity (1.0), vibrant colors
    - Unselected when something selected: Dimmed (0.15 opacity) or hidden
    - Nothing selected: All full opacity
  4. Add click handler to update selection
  5. Support Ctrl/Cmd+Click for multi-select

  Deliverable: All charts respond to and update selection state

  ---
  Phase 6: UMAP Scatter Plot - Special Integration

  Goal: UMAP chart shows only categories that match current data + enables selection

  Tasks:

  1. Update UmapScatterPlot Component
    - Use selectCategoryDataWithUmap selector
    - Filter UMAP points to only show categories in current result set
    - Color by cluster_id or selection state
    - Implement click-to-select (updates selectedUmapGoIds)
    - Show tooltip with: GO ID, GO term, BMD values
  2. Visual States:
    - Not in current data: Don't show (or show as gray dots in background)
    - In current data, not selected: Base cluster color, 0.6 opacity
    - In current data, selected: Bright color, 1.0 opacity, larger markers
    - In current data, unselected when others selected: Dim, 0.2 opacity
  3. Interaction:
    - Click → Select single category
    - Ctrl+Click → Toggle category in multi-select
    - Lasso/Box select → Select multiple categories
    - Double-click → Clear all selections

  Deliverable: UMAP chart integrated with category results

  ---
  Phase 7: Table Reactivity Enhancements

  Goal: Table highlights selections and responds to external selections

  Current State (Already Exists):

  - ✅ Row selection with checkboxes
  - ✅ selectedCategoryIds updates on selection
  - ✅ Dimming of unselected rows

  Enhancements:

  1. Visual Feedback
    - Selected rows: Highlighted background (already exists)
    - Dimmed rows when something selected (already exists)
    - Add "Selected: X of Y categories" counter in header
  2. Bulk Selection UI
    - "Select All (on page)" button
    - "Select All (filtered)" button
    - "Clear Selection" button
    - "Invert Selection" button
  3. Listen to External Selections
    - When selectedUmapGoIds or selectedCategoryIds changes from charts
    - Update table row selection state
    - Scroll to first selected row

  Deliverable: Enhanced table with bulk operations

  ---
  Phase 8: Performance Optimization

  Goal: Ensure smooth performance with large datasets

  Tasks:

  1. Memoization
    - Use createSelector for all derived data
    - Memoize UMAP join operation
    - Memoize chart data transformations
  2. Debouncing
    - Debounce filter updates (300ms)
    - Debounce selection updates from rapid clicks
  3. Virtual Rendering
    - Table already uses pagination ✅
    - Consider virtualizing large chart datasets (>1000 points)
  4. Lazy Loading
    - Load UMAP data only when UMAP chart is visible
    - Use React Suspense/lazy for chart components

  Deliverable: Smooth 60fps performance with all features

  ---
  Phase 9: Testing & Polish

  Goal: Ensure all interactions work seamlessly

  Test Scenarios:

  1. Select rows in table → All charts highlight those categories
  2. Click category in scatter plot → Table and other charts update
  3. Apply master filter → Data reduces in all views
  4. Select categories, apply filter → Selection preserved if categories still visible
  5. Clear filters → All data returns, selections maintained
  6. Multi-select in UMAP → Multiple rows selected in table

  Polish:

  1. Add loading states during filter application
  2. Add animation transitions for selection changes
  3. Add keyboard shortcuts (Ctrl+A for select all, Esc for clear)
  4. Add selection summary panel
  5. Add "Export selected categories" button

  ---
  Implementation Order

  Week 1: Foundation
  ├── Phase 1: Master Filter Component (2 days)
  ├── Phase 2: UMAP Data Integration (1 day)
  └── Phase 3: Selection State (1 day)

  Week 2: Reactivity
  ├── Phase 4: Chart Infrastructure (2 days)
  ├── Phase 5: Update Charts 1-5 (2 days)
  └── Phase 6: UMAP Special (1 day)

  Week 3: Polish
  ├── Phase 5: Update Charts 6-9 (2 days)
  ├── Phase 7: Table Enhancements (1 day)
  ├── Phase 8: Performance (1 day)
  └── Phase 9: Testing & Polish (1 day)

  ---
  File Structure

  src/main/frontend/
  ├── components/
  │   ├── MasterFilter.tsx (NEW)
  │   ├── SelectionSummary.tsx (NEW)
  │   └── charts/
  │       ├── utils/
  │       │   └── chartReactivity.ts (NEW)
  │       └── hooks/
  │           └── useChartSelection.ts (NEW)
  ├── store/
  │   └── slices/
  │       ├── categoryResultsSlice.ts (MODIFY)
  │       └── umapIntegration.ts (NEW)
  └── types/
      └── chartTypes.ts (NEW)
