# Session 13 Part 5: Fix Component Remounting on Dataset Changes

## Summary
Fixed critical bug where components (UMAP plot, table, charts) were not updating when switching between different category analysis results (organ/sex combinations). Components were being reused by React's reconciliation algorithm instead of properly unmounting and remounting with new data.

## Problem Description
When navigating between different category analysis results (e.g., switching from Liver/Male to Kidney/Female), the UI appeared to not update:
- UMAP plot showed same clusters
- Table showed same categories
- Charts didn't reflect new dataset

Investigation revealed:
- Redux WAS loading different datasets correctly (916 → 950 → 948 → 781 → 948 items)
- Components were NOT remounting - React was reusing the same component instances
- Without proper `key` props, React couldn't distinguish between different data sources

## Root Cause
React component reconciliation algorithm uses component type and position to determine if a component should be reused or remounted. When switching between category analysis results with the same projectId but different resultName, React saw:
- Same component type (CategoryResultsView)
- Same DOM position
- Same component hierarchy

Therefore, React reused the existing component instances instead of creating new ones, preventing proper data refresh.

## Solution
Added `key` props to force React to treat each dataset as a unique component instance:

**Pattern**: `key={${projectId}-${resultName}}`

This combination uniquely identifies each category analysis result, forcing React to:
1. Unmount components when dataset changes
2. Create fresh component instances
3. Trigger all useEffect hooks with new data
4. Reset all component-local state

## Changes Made

### 1. CategoryResultsView - Added Keys to All Child Components
**File: `src/main/frontend/components/CategoryResultsView.tsx`**

Added unique keys to force remounting:
- `<CategoryResultsGrid key={${projectId}-${resultName}} />`
- `<UmapScatterPlot key={${projectId}-${resultName}} />`
- `<BMDvsPValueScatter key={${projectId}-${resultName}-scatter} />`
- `<BMDBoxPlot key={${projectId}-${resultName}-box} />`
- All other chart components with similar pattern

Enhanced debug logging:
```typescript
const { loading, error, data, analysisParameters, filters } = useAppSelector(...);

useEffect(() => {
  console.log('[CategoryResultsView] Component mounted/updated with:', {
    projectId,
    resultName,
    dataLength: data.length,
    masterFilters: filters
  });
  return () => {
    console.log('[CategoryResultsView] Component unmounting');
  };
}, [projectId, resultName, data.length, filters]);
```

### 2. CategoryResultsGrid - Enhanced Diagnostic Logging
**File: `src/main/frontend/components/CategoryResultsGrid.tsx`**

Added detailed logging to track data updates:
```typescript
useEffect(() => {
  console.log('[CategoryResultsGrid] Component mounted/updated with data:', {
    dataLength: allData.length,
    selectedCount: selectedCategoryIds.size,
    firstCategory: allData[0]?.categoryDescription || 'none',
    firstCategoryId: allData[0]?.categoryId || 'none',
    first5Categories: allData.slice(0, 5).map(c => ({
      id: c.categoryId,
      desc: c.categoryDescription?.substring(0, 40)
    }))
  });
  return () => {
    console.log('[CategoryResultsGrid] Component unmounting');
  };
}, [allData.length, selectedCategoryIds.size]);
```

### 3. UmapScatterPlot - Enhanced Diagnostic Logging
**File: `src/main/frontend/components/charts/UmapScatterPlot.tsx`**

Added detailed logging to verify UMAP data updates:
```typescript
React.useEffect(() => {
  console.log('[UmapScatterPlot] Component mounted/updated:', {
    filteredCount: filteredCategories.length,
    selectedCount: categoryState.selectedIds.size,
    firstCategory: filteredCategories[0]?.categoryDescription || 'none',
    firstCategoryId: filteredCategories[0]?.categoryId || 'none',
    first5Categories: filteredCategories.slice(0, 5).map(c => ({
      id: c.categoryId,
      desc: c.categoryDescription?.substring(0, 40)
    }))
  });
  return () => {
    console.log('[UmapScatterPlot] Component unmounting');
  };
}, [filteredCategories.length, categoryState.selectedIds.size]);
```

## Testing Results

### Console Log Evidence
Switching between datasets now shows proper lifecycle:
```
[CategoryResultsView] Loading data for: {projectId: "...", resultName: "..."}
[Redux] Received data: Array(948)
[CategoryResultsGrid] Component unmounting     // OLD instance
[UmapScatterPlot] Component unmounting         // OLD instance
[CategoryResultsGrid] Component mounted/updated // NEW instance
[UmapScatterPlot] Component mounted/updated     // NEW instance
```

### Verified Behaviors
✅ Components unmount when switching datasets
✅ Components remount with fresh state
✅ Redux loads correct data (916, 950, 948, 781, 948, 879 items across different organs/sexes)
✅ UMAP plot updates to show new clusters
✅ Table updates to show new categories
✅ All charts properly refresh with new data
✅ No stale data issues

## Architecture Notes

### React Key Prop Pattern
The `key` prop is React's mechanism to distinguish component instances:
- **Without key**: React reuses component based on type/position
- **With key**: React treats different key values as completely different components
- **Key change triggers**: Full unmount → mount cycle with fresh state

### Key Composition Strategy
Used `${projectId}-${resultName}` pattern:
- **projectId**: Distinguishes between different projects
- **resultName**: Distinguishes between different analysis results within a project
- **Combined**: Creates unique identifier for each dataset

Some components use extended keys (e.g., `-scatter`, `-box`) to distinguish multiple instances of the same chart type in the same parent.

### Debug Logging Strategy
Temporary comprehensive logging left in place for now:
- Tracks component mounting/unmounting
- Logs first 5 categories to verify data changes
- Includes master filter state
- Can be removed once confirmed stable in production

## Known Issues / Notes
- Debug logging is intentionally verbose and should be reduced before production
- Master Filter consistently filters different datasets to similar counts (expected behavior)
- Multiple rapid dataset switches cause many mount/unmount cycles (expected with keys)

## Next Steps
1. Monitor production usage to confirm stability
2. Consider reducing debug logging volume after confidence period
3. Apply same key pattern to any other dataset-dependent views in the application

## Files Changed
- src/main/frontend/components/CategoryResultsView.tsx (MODIFIED)
- src/main/frontend/components/CategoryResultsGrid.tsx (MODIFIED)
- src/main/frontend/components/charts/UmapScatterPlot.tsx (MODIFIED)
