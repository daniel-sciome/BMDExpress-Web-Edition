# Session 13 Part 4: Phase 4 Chart Reactivity Infrastructure

## Summary
Implemented Phase 4 of the FILTERING_AND_REACTIVITY_PLAN - Generic "reactive-to" abstraction for multi-dimensional selection with bidirectional reactivity between table and UMAP.

## Changes Made

### 1. Created Generic Reactive Type System
**File: `src/main/frontend/types/reactiveTypes.ts`** (NEW)
- Defined `ReactiveType = 'categoryId' | 'clusterId'` - extensible for future types
- Defined `SelectionSource = 'table' | 'umap' | 'chart' | null` - tracks selection origin
- Defined `ReactiveSelectionMap` structure with category and cluster selection state
- Defined `ReactiveStyleMode = 'highlight' | 'dim' | 'hide'` for visual styling
- Defined `ReactiveStyleProps` interface for Plotly marker styles

### 2. Extended Redux State with Reactive Selection
**File: `src/main/frontend/store/slices/categoryResultsSlice.ts`** (MODIFIED)
- Added `reactiveSelection: ReactiveSelectionMap` to state
- Created three new reactive selection actions:
  - `setReactiveSelection` - Set selection for a type (category/cluster) with source tracking
  - `toggleReactiveSelection` - Toggle individual item selection
  - `clearReactiveSelection` - Clear selection for a type
- **Bidirectional sync**: All legacy selection actions now sync to reactive state
  - `setSelectedCategoryIds` → syncs to `reactiveSelection.category`
  - `toggleCategorySelection` → syncs to reactive state
  - `clearSelection` → syncs to reactive state
  - `selectAllCategories` → syncs to reactive state
  - `invertSelection` → syncs to reactive state
  - `toggleMultipleCategoryIds` → syncs to reactive state
- Reactive selection actions sync back to legacy state for backward compatibility
- Clear both reactive and legacy selection on data load

### 3. Created Generic Reactive State Hook
**File: `src/main/frontend/components/charts/hooks/useReactiveState.ts`** (NEW)
- Generic hook: `useReactiveState(reactTo: ReactiveType)`
- Components declare what they're "reactive to" (categoryId, clusterId, etc.)
- Returns:
  - `selectedIds` - Set of selected IDs
  - `source` - Where selection originated
  - `isSelected(id)` - Check if specific ID is selected
  - `isAnythingSelected` - Boolean flag
  - `handleSelect(id, isMultiSelect, source)` - Select handler
  - `handleMultiSelect(ids, source)` - Multi-select handler
  - `handleClear()` - Clear selection handler

### 4. Created Reactive Styling Utilities
**File: `src/main/frontend/components/charts/utils/reactiveStyles.ts`** (NEW)
- `applyReactiveStyles()` - Apply reactive styles to array of chart data
- `getReactiveOpacity()` - Get opacity based on selection state
- `getReactiveColor()` - Get color with optional highlight color
- `getReactiveMarkerSize()` - Get marker size with reactive scaling
- `createReactiveMarker()` - Create complete Plotly marker style object

### 5. Created Selection Bridge Utilities
**File: `src/main/frontend/store/slices/selectionBridge.ts`** (NEW)
- Cross-dimension reactivity utilities:
  - `selectCategoriesInClusters` - Selector for category IDs in selected clusters
  - `selectClustersOfCategories` - Selector for clusters containing selected categories
  - `isCategoryInSelectedCluster()` - Helper function
  - `isClusterContainingSelectedCategory()` - Helper function
  - `isCategorySelected()` - Combined selection check (direct or via cluster)

### 6. Updated UMAP to Use Reactive Infrastructure
**File: `src/main/frontend/components/charts/UmapScatterPlot.tsx`** (MODIFIED)
- Removed legacy imports (`useAppDispatch`, `setSelectedUmapGoIds`, `clearUmapSelection`)
- Added `useReactiveState('categoryId')` hook
- **Reacts to table selections**: Highlights selected category points in UMAP
- **Dispatches reactive actions**: When user selects in UMAP, uses `categoryState.handleMultiSelect(ids, 'umap')`
- **Reactive styling**:
  - Selected points: size 10, opacity 1.0, white border (width 2)
  - Unselected points (when selection exists): opacity 0.15, no border
  - No selection: all points opacity 1.0, normal size
- Updated selection counter to use `categoryState.selectedIds.size`

### 7. Updated Table Row Selection Configuration
**File: `src/main/frontend/components/CategoryResultsGrid.tsx`** (MODIFIED)
- Made `type: 'checkbox'` explicit in rowSelection config
- Added `getCheckboxProps: () => ({ disabled: false })` to ensure checkboxes enabled from start
- **Table now allows row selection immediately on first load** (no need to click "Select All" first)

### 8. Fixed Redux Store Configuration
**File: `src/main/frontend/store/store.ts`** (MODIFIED)
- Extended `serializableCheck.ignoredPaths` to include:
  - `categoryResults.reactiveSelection.category.selectedIds`
  - `categoryResults.reactiveSelection.cluster.selectedIds`
- Extended `serializableCheck.ignoredActions` to include all reactive selection actions
- **Fixed Redux warnings** about non-serializable Sets
- Enables proper state updates for row selection

## Testing Results
✅ Table row checkboxes are available on first load (no need to click "Select All")
✅ Selecting rows in table highlights corresponding points in UMAP
✅ Dimming effect: unselected points fade to 0.15 opacity
✅ Selected points get white border and slightly larger size
✅ No Redux warnings about non-serializable Sets
✅ Bidirectional reactivity working between table and UMAP

## Architecture Notes

### Design Pattern: Reactive-To Abstraction
- Components declare what they're "reactive to" via `useReactiveState(reactTo)`
- Example: `useReactiveState('categoryId')` makes component react to category selections
- Future: Can add `useReactiveState('clusterId')`, `useReactiveState('geneId')`, etc.
- Extensible without changing core infrastructure

### Backward Compatibility Strategy
- Legacy selection state (`selectedCategoryIds`, `selectedUmapGoIds`) maintained
- Legacy actions sync to new reactive state
- Reactive actions sync back to legacy state
- Existing components continue to work during gradual migration
- Phase 9: Remove legacy state after full migration

### Selection Priority
- All selections now unified under `reactiveSelection.category`
- Source tracking enables priority logic if needed
- Table and UMAP selections are now equivalent (no priority)
- Bridge utilities enable cluster ↔ category reactivity (future)

## Next Steps (from FILTERING_AND_REACTIVITY_PLAN)
- **Phase 5**: Update individual charts to use reactive infrastructure
- **Phase 6**: UMAP special integration (cluster selection support)
- **Phase 8**: Performance optimization
- **Phase 9**: Testing & polish, remove legacy state

## Files Changed
- src/main/frontend/types/reactiveTypes.ts (NEW)
- src/main/frontend/components/charts/hooks/useReactiveState.ts (NEW)
- src/main/frontend/components/charts/utils/reactiveStyles.ts (NEW)
- src/main/frontend/store/slices/selectionBridge.ts (NEW)
- src/main/frontend/store/slices/categoryResultsSlice.ts (MODIFIED)
- src/main/frontend/components/charts/UmapScatterPlot.tsx (MODIFIED)
- src/main/frontend/components/CategoryResultsGrid.tsx (MODIFIED)
- src/main/frontend/store/store.ts (MODIFIED)
