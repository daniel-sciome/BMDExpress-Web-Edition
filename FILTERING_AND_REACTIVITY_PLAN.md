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
  Phase 4: Chart Reactivity - Core Infrastructure

  Goal: Reusable highlighting/dimming logic for all charts

  Tasks:

  1. Create Chart Utilities (components/charts/utils/chartReactivity.ts)
  export function getTraceOpacity(
    categoryId: string,
    selectedIds: Set<string>,
    mode: 'highlight' | 'dim' | 'hide'
  ): number;

  export function getTraceColor(
    categoryId: string,
    selectedIds: Set<string>,
    baseColor: string
  ): string;

  export function applySelectionStyles(
    plotData: any[],
    selectedIds: Set<string>,
    idField: string
  ): any[];
  2. Create useChartSelection Hook (components/charts/hooks/useChartSelection.ts)
  export function useChartSelection() {
    const selectedIds = useAppSelector(state => state.categoryResults.selectedCategoryIds);
    const dispatch = useAppDispatch();

    const handleClick = (categoryId: string, isMultiSelect: boolean) => {
      if (isMultiSelect) {
        dispatch(toggleCategorySelection(categoryId));
      } else {
        dispatch(setSelectedCategoryIds([categoryId]));
      }
    };

    return { selectedIds, handleClick, isSelected };
  }

  Deliverable: Reusable chart reactivity infrastructure

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
