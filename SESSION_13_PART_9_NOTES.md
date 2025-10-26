# Session 13 Part 9: Venn Diagram Relocation to Multi-Set View

## Overview
Relocated the Venn diagram feature from CategoryResultsView (single dataset view) to CategoryAnalysisMultisetView (multi-set comparison view), fixing a conceptual architecture issue where a multi-dataset comparison tool was embedded in a single-dataset analysis context.

## Problem Statement
The Venn diagram component was originally located in CategoryResultsView, which displays analysis results for a single category dataset. However, Venn diagrams inherently compare multiple datasets, creating a conceptual mismatch. The correct location is a dedicated multi-set view that provides proper context for cross-dataset comparisons.

## Architecture Changes

### Navigation Hierarchy
Implemented three-level navigation hierarchy:
1. **Project Level** - Container for all analysis results (expand only, not selectable)
2. **Analysis Type Level** - Groups results by type (e.g., "GO Biological Process") → Multi-set view
3. **Individual Result Level** - Single dataset → Single-dataset view

### State Management (navigationSlice.ts)
Added `selectedAnalysisType` to Redux state with mutual exclusivity pattern:
- Only one of `selectedAnalysisType` or `selectedCategoryResult` can be set at a time
- Selecting an analysis type clears individual result selection
- Selecting an individual result clears analysis type selection

**Critical Bug Fix**: Fixed logic error where condition was always false:
```typescript
// BEFORE (BUGGY):
state.selectedAnalysisType = action.payload;
if (state.selectedAnalysisType !== action.payload) {  // Always false!
  state.selectedCategoryResult = null;
}

// AFTER (FIXED):
state.selectedAnalysisType = action.payload;
if (action.payload !== null) {
  state.selectedCategoryResult = null;
}
```

## New Component: CategoryAnalysisMultisetView.tsx

Purpose: Display comparison tools for multiple category analysis results of the same type.

Key Features:
- Filters category results by analysis type
- Displays available results summary
- Contains VennDiagram component
- Provides context for future multi-set comparison features

Navigation Path:
Sidebar → Project (expand) → Analysis Type Group (select) → CategoryAnalysisMultisetView → Venn Diagram

## Component Updates

### ProjectTreeSidebar.tsx
1. **Made project nodes non-selectable** - Users can only expand projects, not select them
2. **Added type node selection** - Analysis type groups (e.g., "GO Biological Process") are now selectable
3. **Updated selection sync** - Tree selection state syncs with Redux state including `selectedAnalysisType`

Key pattern for tree keys:
- Project: `{projectId}` (non-selectable)
- Analysis Type: `{projectId}::type::{analysisType}` (selectable)
- Individual Result: `{projectId}::{resultName}` (selectable)

### LibraryView.tsx
1. **Added routing for multi-set view** - When `selectedAnalysisType` is set, render CategoryAnalysisMultisetView
2. **Removed auto-selection logic** - No longer automatically selects first result, requiring explicit user clicks
3. **Added instruction screen** - Helpful message explaining the difference between analysis type groups and individual results

### CategoryResultsView.tsx
Removed Venn diagram completely:
- Removed import
- Removed state variables
- Removed checkbox option
- Removed collapse panel
- Removed loading logic

### VennDiagram.tsx
1. **Added comprehensive documentation** explaining location, rationale, and navigation path
2. **Fixed data transformation bug** - Backend provides intersection counts, but @ant-design/charts Venn library expects total set sizes

**Data Transformation Fix**:
```typescript
// Backend format: {"A": 0, "B": 2, "A,B": 948}
// A unique: 0, B unique: 2, overlap: 948

// Calculate totals by summing all intersections containing each set
// A total: 0 + 948 = 948
// B total: 2 + 948 = 950

const setTotals = new Map<string, number>();
setLabels.forEach(label => {
  let total = 0;
  Object.entries(overlaps).forEach(([key, count]) => {
    const sets = key.split(',');
    if (sets.includes(label)) {
      total += count as number;
    }
  });
  setTotals.set(label, total);
});
```

## Files Modified
1. `src/main/frontend/store/slices/navigationSlice.ts` - Added selectedAnalysisType state, fixed bug
2. `src/main/frontend/views/CategoryAnalysisMultisetView.tsx` - NEW FILE for multi-set comparisons
3. `src/main/frontend/components/ProjectTreeSidebar.tsx` - Type node selection, non-selectable projects
4. `src/main/frontend/views/LibraryView.tsx` - Routing logic, removed auto-selection
5. `src/main/frontend/components/CategoryResultsView.tsx` - Removed Venn diagram
6. `src/main/frontend/components/charts/VennDiagram.tsx` - Documentation, data transformation fix

## Issues Resolved

### Issue 1: Multi-Set View Inaccessible After Clicking Individual Result
**Symptom**: Clicking analysis type group after selecting individual result didn't show multi-set view

**Root Cause**: ProjectTreeSidebar's useEffect didn't track `selectedAnalysisType`, so tree selection wasn't updating

**Fix**: Added `selectedAnalysisType` to useEffect dependencies and logic

### Issue 2: Sidebar Instability
**Symptom**: Clicking project name to expand triggered navigation to first result

**Root Causes**:
1. Project nodes were selectable
2. Auto-selection in LibraryView immediately selected first result

**Fixes**:
1. Made project nodes `selectable: false`
2. Removed all auto-selection logic

### Issue 3: Redux State Bug
**Symptom**: Console showed "Type node selected" but "Setting selectedKeys to individual result"

**Root Cause**: Logic error in setSelectedAnalysisType - condition always false after assignment

**Fix**: Changed condition from `state.selectedAnalysisType !== action.payload` to `action.payload !== null`

### Issue 4: Venn Diagram Not Rendering
**Symptom**: Table rendered but diagram threw "Cannot read properties of undefined (reading 'size')"

**Root Cause**: Backend provides intersection counts (unique portions) but Venn library expects total set sizes

**Fix**: Calculate totals by summing all intersections containing each set

## User Experience Improvements
1. **Clear Navigation Model** - Three-level hierarchy with distinct purposes at each level
2. **No Unintended Navigation** - Removed auto-selection and made projects non-selectable
3. **Helpful Instructions** - Added instruction screen explaining analysis type groups vs individual results
4. **Proper Context** - Venn diagram now appears in multi-set view with list of available results
5. **Stable Sidebar** - Project expansion no longer triggers unwanted navigation

## Testing Recommendations
1. Navigate to project → analysis type group → verify multi-set view appears
2. Select 2-5 category results → Generate Venn diagram → verify circles sized correctly
3. Click individual result → verify single-dataset view appears
4. Switch between type groups and individual results → verify selection state updates correctly
5. Expand/collapse projects → verify no unintended navigation occurs

## Excel Export Feature (Added in Session Continuation)

### Overview
Implemented comprehensive Excel export functionality for Venn diagram data with embedded PNG image and detailed instructions.

### Implementation Details

**Libraries Used**:
- `exceljs` - Full-featured Excel workbook creation with image embedding support
- `html2canvas` - Captures rendered Venn diagram as PNG image

**Export File Structure**:
1. **Summary Sheet** - Project metadata, embedded Venn diagram image, set label legend
2. **Instructions Sheet** - Four methods for creating native Venn diagrams in Excel
3. **Overlaps Sheet** - Formatted table with all set combinations and counts
4. **Detail Sheets** - One sheet per overlap (A, B, A_B, etc.) with complete category lists

### Technical Challenges and Solutions

#### Challenge 1: Image Embedding Not Working
**Problem**: Initial implementation used `xlsx` library which lacks image embedding support

**Solution**: Switched to `exceljs` library with full image support
```typescript
const imageId = workbook.addImage({
  base64: base64Data,
  extension: 'png',
});

summarySheet.addImage(imageId, {
  tl: { col: 0, row: 6 },
  ext: { width: imageWidth, height: imageHeight },
  editAs: 'oneCell'
});
```

#### Challenge 2: Image Squished Horizontally
**Problem**: Excel was compressing image horizontally to fit narrow column widths

**Root Cause**: Hardcoded 800x500 dimensions didn't match actual canvas size

**Solutions Applied**:
1. Set wider column widths (30 units) before adding image
2. Use `editAs: 'oneCell'` to prevent cell-based resizing
3. Capture actual canvas dimensions and use them for image size
4. Account for `scale: 2` by dividing captured dimensions by 2

```typescript
// Capture at 2x scale for quality
const canvas = await html2canvas(vennDiagramRef.current, {
  backgroundColor: '#ffffff',
  scale: 2,
});

// Use actual dimensions divided by scale factor
imageWidth = canvas.width / 2;
imageHeight = canvas.height / 2;
```

#### Challenge 3: Asymmetric Background
**Problem**: Captured image had irregular whitespace around diagram

**Root Cause**: html2canvas captured entire div with extra padding from chart library

**Solution**: Constrain div to exact dimensions matching Venn chart
```typescript
<div ref={vennDiagramRef} style={{
  marginBottom: '2rem',
  display: 'inline-block',
  width: '800px',
  height: '500px',
  overflow: 'hidden'
}}>
  <Venn
    data={vennChartData}
    setsField="sets"
    sizeField="size"
    width={800}
    height={500}
  />
</div>
```

### Excel Export Contents

**Summary Sheet**:
- Project name and timestamp
- Embedded PNG of Venn diagram (proper aspect ratio, high quality)
- Legend mapping set labels (A, B, C...) to analysis result names

**Instructions Sheet**:
Four methods for creating native Excel Venn diagrams:
1. **Excel Add-ins** (Recommended) - Lucidchart, ChartExpo, Power-user
2. **Manual Drawing** - Using Excel shapes with transparency
3. **Online Tools** - venndiagram.app, bioinformatics tools, meta-chart
4. **SmartArt** - Limited circular relationship diagrams

**Overlaps Sheet**:
- Set combination labels (A, B, A,B, etc.)
- Full analysis result names
- Category counts
- Descriptions (unique vs shared)
- Formatted with bold headers and colored backgrounds

**Detail Sheets** (one per overlap):
- Sheet name based on set combination (A, B, A_B, etc.)
- Complete list of all category IDs
- Metadata (set labels, analysis names, counts)
- Formatted with headers and styling

### Export Workflow

1. User generates Venn diagram in web interface
2. Clicks "Export to Excel" button
3. System captures diagram as high-quality PNG (2x scale)
4. Creates Excel workbook with multiple sheets
5. Embeds PNG image in Summary sheet at correct dimensions
6. Populates all data sheets with formatting
7. Downloads .xlsx file with timestamp in filename

### User Experience

- **Single button click** - All data and visualization exported together
- **Embedded image** - Diagram visible immediately in Summary sheet
- **Complete data** - All overlap combinations and category lists included
- **Helpful instructions** - Four methods to create editable diagrams
- **Professional formatting** - Bold headers, colored backgrounds, proper column widths
- **Timestamped filenames** - Easy to track multiple exports

## Accumulation Charts Refactor (Session Continuation Part 2)

### Overview
Fixed critical issues with AccumulationCharts component to properly display background and foreground layers with correct axis scaling, matching the UMAP scatter plot behavior.

### Problem Statement
The accumulation charts had two major issues:
1. **Axis Auto-Scaling**: Selected categories appeared in different positions than on the background curve because Plotly auto-scaled axes independently for each trace
2. **Connected Lines**: Selected categories were being drawn as connected cumulative curves by cluster, creating separate lines instead of individual markers on the background curve

### Root Causes

**Issue 1: Axis Scaling Misalignment**
- The xaxis configuration only specified `type: 'log'` without a fixed range
- Plotly auto-scaled each trace independently based on its data
- When selected categories had a different value range than all categories, they appeared at different x-positions
- User feedback: "the selected categories should be markers coincident with the markers on the background curve. instead, they're in different places"

**Issue 2: Inappropriate Cumulative Curves**
- Selected categories were grouped by cluster and each cluster got its own cumulative distribution curve
- This created misleading visualizations where each cluster had separate 0-100% curves
- Should have been individual markers positioned on the background curve
- User feedback: "the markers are being connected by cluster. they should not"

### Solutions Implemented

#### Fix 1: Fixed Axis Range Based on Background Data (AccumulationCharts.tsx:120-136, 217)

**Code Changes**:
```typescript
// Calculate x-axis range from background data (for fixed axis scaling)
let xAxisRange: [number, number] | undefined;

if (allValues.length > 0) {
  const allX: number[] = [];
  const allY: number[] = [];
  const totalCount = allValues.length;

  allValues.forEach((item, index) => {
    allX.push(item.value);
    allY.push(((index + 1) / totalCount) * 100);
  });

  // Calculate fixed x-axis range in log space
  const xMin = Math.min(...allX);
  const xMax = Math.max(...allX);
  xAxisRange = [Math.log10(xMin), Math.log10(xMax)];

  traces.push({
    // ... background trace
  });
}

// Later in layout:
xaxis: {
  title: { text: 'BMD Value' },
  type: 'log',
  range: xAxisRange, // Fixed range based on background data
  gridcolor: '#e0e0e0',
}
```

**Result**: All traces now share the same fixed x-axis scale derived from the complete dataset, ensuring markers align with background curve positions.

#### Fix 2: Individual Markers Instead of Connected Lines (AccumulationCharts.tsx:154-204)

**Before**: Created cumulative curves for each cluster
```typescript
// WRONG APPROACH - separate cumulative curves per cluster
byCluster.forEach((clusterData, clusterId) => {
  const clusterValues = clusterData
    .map(row => (row as any)[config.field])
    .filter(v => v != null && v > 0)
    .sort((a: number, b: number) => a - b);

  if (clusterValues.length > 0) {
    const clusterX: number[] = [];
    const clusterY: number[] = [];
    const clusterTotal = clusterValues.length;

    clusterValues.forEach((value, index) => {
      clusterX.push(value);
      clusterY.push(((index + 1) / clusterTotal) * 100);
    });

    traces.push({
      type: 'scatter',
      mode: 'lines', // WRONG - connects points
      // ...
    });
  }
});
```

**After**: Position each marker at its location on the background curve
```typescript
// CORRECT APPROACH - individual markers at background positions
selectedData.forEach(row => {
  const value = (row as any)[config.field];
  if (value == null || value <= 0) return;

  // Find position on background cumulative curve
  const index = allValues.findIndex(item => item.categoryId === row.categoryId);
  if (index === -1) return;

  const cumulativePercent = ((index + 1) / allValues.length) * 100;

  const umapItem = umapDataService.getByGoId(row.categoryId || '');
  const clusterId = umapItem?.cluster_id ?? -1;

  if (!byCluster.has(clusterId)) {
    byCluster.set(clusterId, []);
  }
  byCluster.get(clusterId)!.push({
    x: value,
    y: cumulativePercent,
    categoryId: row.categoryId || ''
  });
});

// Create a marker trace for each cluster (no lines)
byCluster.forEach((points, clusterId) => {
  const color = clusterColors[clusterId] || '#999999';

  traces.push({
    type: 'scatter',
    mode: 'markers', // CORRECT - no connecting lines
    x: points.map(p => p.x),
    y: points.map(p => p.y),
    marker: {
      color: color,
      size: 8,
      symbol: 'circle',
      line: {
        color: 'white',
        width: 1
      }
    },
    name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
    // ...
  });
});
```

**Key Changes**:
1. Find each selected category's index in the sorted background data
2. Calculate its cumulative percentage using the same formula as background: `((index + 1) / allValues.length) * 100`
3. Use `mode: 'markers'` instead of `mode: 'lines'` - no connecting lines
4. Group by cluster only for color coding, not for separate cumulative curves

#### Fix 3: TypeScript Type Correction

**Issue**: TypeScript errors for cluster_id type mismatch
```
Argument of type 'string | number' is not assignable to parameter of type 'number'.
```

**Fix**: Changed Map type to accept both string and number cluster IDs
```typescript
// BEFORE:
const byCluster = new Map<number, Array<{x: number, y: number, categoryId: string}>>();

// AFTER:
const byCluster = new Map<string | number, Array<{x: number, y: number, categoryId: string}>>();
```

This matches the type used for `clusterColors` and reflects that cluster_id can be either string or number.

### Files Modified
1. `src/main/frontend/components/charts/AccumulationCharts.tsx` - Fixed axis scaling and marker display

### Visual Behavior Changes

**Before**:
- Gray background curve (all categories)
- Colored foreground curves (one per cluster, each 0-100%)
- Selected categories appeared at wrong x-positions due to auto-scaling
- Misleading: suggested each cluster had its own distribution

**After**:
- Gray background cumulative curve (all categories, sorted by BMD value)
- Individual colored markers (not connected) positioned exactly on background curve
- Markers colored by cluster membership (same palette as UMAP)
- Fixed axis range ensures perfect alignment with background
- Clear visualization: shows which categories are selected and their cluster membership

### User Experience Improvements
1. **Visual Consistency** - Now matches UMAP behavior with background/foreground layers
2. **Accurate Positioning** - Markers appear at correct positions on cumulative curve
3. **Clear Interpretation** - No misleading separate cumulative curves per cluster
4. **Cluster Identification** - Easy to see cluster membership via marker colors
5. **Legend Integration** - Shows cluster colors matching UMAP visualization

### Testing Recommendations
1. Open any category result → Select multiple categories from table → Check Accumulation Charts
2. Verify gray background curve appears immediately (all categories)
3. Verify colored markers appear at exact positions on background curve
4. Select categories from different clusters → Verify different colored markers
5. Compare marker colors with UMAP cluster colors → Verify consistency

## Future Enhancements
- Add more multi-set comparison tools (heatmaps, parallel coordinates, etc.)
- Add statistical comparison metrics across multiple datasets
- Add batch operations on selected datasets
- Consider PDF export option with embedded vector graphics
