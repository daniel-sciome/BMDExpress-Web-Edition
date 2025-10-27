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

**Before (Original)**:
- Gray background curve (all categories)
- Colored foreground curves (one per cluster, each 0-100%)
- Selected categories appeared at wrong x-positions due to auto-scaling
- Misleading: suggested each cluster had its own distribution

**After (First Fix)**:
- Gray background cumulative curve (all categories, sorted by BMD value)
- Individual colored markers (not connected) positioned exactly on background curve
- Markers colored by cluster membership (same palette as UMAP)
- Fixed axis range ensures perfect alignment with background
- Clear visualization: shows which categories are selected and their cluster membership

**Final (Cluster-Colored Background)**:
- Background layer: Small, semi-transparent markers (size: 4, opacity: 0.4) for ALL categories, colored by cluster
- Foreground layer: Larger, fully opaque markers (size: 10, opacity: 1.0) for SELECTED categories, colored by cluster
- White borders on selected markers (width: 2) to distinguish from background
- Background markers hidden from legend (`showlegend: false`)
- Selected markers shown in legend with "(Selected)" suffix
- Fixed axis range ensures all markers positioned on same cumulative distribution
- Cluster membership visible at all times, not just for selected categories

#### Fix 4: Cluster-Colored Background Markers (Added in Session Continuation Part 3)

**User Request**: "the range plot should be colored by cluster"

**Implementation**:
```typescript
// Group ALL categories by cluster for background traces
const backgroundByCluster = new Map<string | number, Array<{x: number, y: number, categoryId: string}>>();

allValues.forEach((item, index) => {
  const umapItem = umapDataService.getByGoId(item.categoryId || '');
  const clusterId = umapItem?.cluster_id ?? -1;
  const cumulativePercent = ((index + 1) / allValues.length) * 100;

  if (!backgroundByCluster.has(clusterId)) {
    backgroundByCluster.set(clusterId, []);
  }
  backgroundByCluster.get(clusterId)!.push({
    x: item.value,
    y: cumulativePercent,
    categoryId: item.categoryId || ''
  });
});

// Create background traces for each cluster (small markers)
backgroundByCluster.forEach((points, clusterId) => {
  const color = clusterColors[clusterId] || '#999999';

  traces.push({
    type: 'scatter',
    mode: 'markers',
    x: points.map(p => p.x),
    y: points.map(p => p.y),
    marker: {
      color: color,
      size: 4,           // Small background markers
      symbol: 'circle',
      opacity: 0.4,      // Semi-transparent
    },
    name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
    showlegend: false,   // Hide from legend
  });
});
```

**Foreground Enhancement**:
```typescript
// Selected markers - larger and more prominent
marker: {
  color: color,
  size: 10,              // Larger than background (4)
  symbol: 'circle',
  opacity: 1.0,          // Fully opaque (vs 0.4 background)
  line: {
    color: 'white',
    width: 2             // White border for visibility
  }
}
```

**Visual Result**:
- Background shows cluster distribution across all categories
- Selected categories stand out with larger size, full opacity, and white borders
- Consistent color palette with UMAP throughout
- Instant visual feedback on cluster membership for all data

### User Experience Improvements
1. **Visual Consistency** - Now matches UMAP behavior with background/foreground layers colored by cluster
2. **Accurate Positioning** - Markers appear at correct positions on cumulative curve
3. **Clear Interpretation** - No misleading separate cumulative curves per cluster
4. **Cluster Identification** - Easy to see cluster membership via marker colors for ALL categories
5. **Legend Integration** - Shows selected clusters only, avoiding legend clutter
6. **Selection Highlighting** - Larger markers with white borders make selections obvious
7. **Cluster Distribution Visibility** - Background layer reveals cluster patterns in cumulative distribution

### Testing Recommendations
1. Open any category result → Check Accumulation Charts without selecting anything
2. Verify all categories appear as small, semi-transparent colored markers by cluster
3. Select multiple categories from table → Verify larger, bright markers appear
4. Select categories from different clusters → Verify different colored markers with white borders
5. Compare marker colors with UMAP cluster colors → Verify consistency
6. Hover over markers → Verify "SELECTED" label appears for selected categories
7. Check legend → Verify only selected clusters appear, with "(Selected)" suffix

## RangePlot Cluster Coloring (Session Continuation Part 4)

### Overview
Updated RangePlot component to color both markers and confidence interval error bars by cluster membership, maintaining visual consistency with UMAP and AccumulationCharts.

### Problem Statement
RangePlot displayed top 20 most significant pathways with BMD values and confidence intervals (BMDL-BMDU), but used a single blue color (#1890ff) for all markers and error bars. This missed the opportunity to show cluster membership patterns in the most significant pathways.

**User Request**: "ok. now the range plots. they should be colored by cluster"

### Implementation

#### Changes Made (RangePlot.tsx)

1. **Added Imports**:
```typescript
import React, { useEffect, useState, useMemo } from 'react';
import { umapDataService } from 'Frontend/data/umapDataService';
```

2. **Added Cluster Colors Palette**:
```typescript
// Get cluster colors (same as UMAP and AccumulationCharts)
const clusterColors = useMemo(() => {
  const clusters = umapDataService.getAllClusterIds();
  const colors: Record<string | number, string> = {};

  const palette = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    // ... full 40-color palette
  ];

  clusters.forEach((clusterId, index) => {
    if (clusterId === -1) {
      colors[clusterId] = '#999999';
    } else {
      colors[clusterId] = palette[index % palette.length];
    }
  });

  return colors;
}, []);
```

3. **Grouped Data by Cluster**:
```typescript
// Group categories by cluster
const byCluster = new Map<string | number, CategoryAnalysisResultDto[]>();

topCategories.forEach((row: CategoryAnalysisResultDto) => {
  const umapItem = umapDataService.getByGoId(row.categoryId || '');
  const clusterId = umapItem?.cluster_id ?? -1;

  if (!byCluster.has(clusterId)) {
    byCluster.set(clusterId, []);
  }
  byCluster.get(clusterId)!.push(row);
});
```

4. **Created Cluster-Colored Traces**:
```typescript
// Create a trace for each cluster
const traces: any[] = [];

byCluster.forEach((clusterData, clusterId) => {
  const color = clusterColors[clusterId] || '#999999';

  traces.push({
    type: 'scatter',
    mode: 'markers',
    x: bmdValues,
    y: categories,
    error_x: {
      type: 'data',
      symmetric: false,
      array: errorPlus,
      arrayminus: errorMinus,
      color: color,           // Cluster-colored error bars
      thickness: 2,
      width: 4,
    },
    marker: {
      color: color,           // Cluster-colored markers
      size: 8,
      symbol: 'circle',
    },
    name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
    hovertemplate:
      '<b>%{y}</b><br>' +
      `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}<br>` +
      'BMD: %{x:.4f}<br>' +
      'BMDL: %{customdata[0]:.4f}<br>' +
      'BMDU: %{customdata[1]:.4f}<br>' +
      '<extra></extra>',
  });
});
```

5. **Added Legend**:
```typescript
showlegend: true,
legend: {
  x: 1.02,          // Position to right of plot
  xanchor: 'left',
  y: 1,
},
```

### Visual Changes

**Before**:
- All 20 pathways shown in single blue color (#1890ff)
- No cluster identification visible
- Legend not present
- Could not see cluster distribution patterns

**After**:
- Each cluster gets its own color (markers + error bars)
- Multiple traces, one per cluster present in top 20
- Legend shows which clusters are represented
- Hover tooltip displays cluster ID
- Color consistency with UMAP and AccumulationCharts

### Technical Details

**Why Separate Traces per Cluster**:
Plotly's error_x configuration applies to entire trace, not per-point. To color error bars differently, each cluster needs its own trace. This approach ensures:
- Markers and error bars use same color
- Legend automatically shows cluster names
- Hover interactions work correctly per cluster

**Data Flow**:
1. Select top 20 pathways by p-value (most significant)
2. Look up cluster ID for each pathway via umapDataService
3. Group pathways by cluster
4. Create one Plotly trace per cluster
5. Apply cluster color to both markers and error bars

### Visual Benefits

1. **Cluster Distribution Visibility** - See which clusters dominate the most significant pathways
2. **Pattern Recognition** - Identify if certain clusters have consistently lower/higher BMD values
3. **Visual Consistency** - Same color palette across all chart types (UMAP, Accumulation, Range)
4. **Quick Identification** - Color coding enables instant recognition of cluster membership
5. **Legend Integration** - Shows which clusters appear in top 20 pathways

### Files Modified
1. `src/main/frontend/components/charts/RangePlot.tsx` - Added cluster coloring for markers and error bars

### Testing Recommendations
1. Open any category result → Check Range Plot checkbox
2. Verify top 20 pathways appear colored by cluster
3. Verify error bars match marker colors for each pathway
4. Hover over points → Verify cluster ID appears in tooltip
5. Check legend → Verify cluster names and colors match UMAP
6. Compare with UMAP → Verify same color is used for each cluster ID

## BMDBoxPlot Cluster Coloring (Session Continuation Part 5)

### Overview
Redesigned BMDBoxPlot component to display black box-and-whisker plots with cluster-colored, horizontally jittered markers overlaid at the same positions, providing clear visualization of BMD distributions while revealing cluster membership patterns.

### Problem Statement
The BMDBoxPlot used a multi-colored box plot scheme, but the user wanted to:
1. Simplify to black boxes for cleaner visualization
2. Add cluster-colored markers (like other charts)
3. Show markers aligned with boxes but with horizontal jitter to prevent overlap

**User Requests**:
1. "let's do the same for the Default Charts. the boxplot's current color scheme will have to be discarded. just use black, but cluster color for the markers, size 12"
2. "not quite right. the colored markers should be aligned with the box and whisker. make them size 6 instead of 12, and jitter horizontally"

### Implementation

#### Changes Made (BMDBoxPlot.tsx)

1. **Black Box Plots at Numeric Positions**:
```typescript
// Create black box plots (no individual points shown by box)
if (allValues.bmd.length > 0) {
  traces.push({
    x: Array(allValues.bmd.length).fill(0),  // Position at x=0
    y: allValues.bmd,
    type: 'box',
    name: 'BMD Mean',
    marker: { color: 'black' },
    line: { color: 'black' },
    fillcolor: 'rgba(0, 0, 0, 0.1)',
    boxpoints: false,  // Don't show points on box itself
    boxmean: 'sd',
    showlegend: true,
    legendgroup: 'bmd',
    legendgrouptitle: { text: 'Categories' },
  });
}
```

2. **Manual Horizontal Jitter for Cluster Markers**:
```typescript
const addClusterPoints = (items, xPosition, categoryName) => {
  // Group by cluster
  const byCluster = new Map<string | number, DataPoint[]>();

  items.forEach(item => {
    if (item.value === undefined) return;

    const umapItem = umapDataService.getByGoId(item.categoryId || '');
    const clusterId = umapItem?.cluster_id ?? -1;

    if (!byCluster.has(clusterId)) {
      byCluster.set(clusterId, []);
    }
    byCluster.get(clusterId)!.push({
      value: item.value,
      categoryId: item.categoryId,
      x: xPosition
    });
  });

  // Create scatter trace for each cluster with manual jitter
  byCluster.forEach((points, clusterId) => {
    const color = clusterColors[clusterId] || '#999999';

    // Add random jitter to x positions (±0.15 around the box position)
    const jitteredX = points.map(() => xPosition + (Math.random() - 0.5) * 0.3);

    traces.push({
      x: jitteredX,
      y: points.map(p => p.value),
      type: 'scatter',
      mode: 'markers',
      marker: {
        color: color,
        size: 6,
        symbol: 'circle',
        line: {
          color: 'white',
          width: 1
        }
      },
      name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
      hovertemplate: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}<br>Value: %{y:.4f}<extra></extra>`,
      showlegend: false,  // Hide from legend but link to category
      legendgroup: categoryName,  // Link to category box plot
    });
  });
};

// Add scatter points for each box plot category
addClusterPoints(allValuesWithCategories.bmd, 0, 'bmd');   // BMD at x=0
addClusterPoints(allValuesWithCategories.bmdl, 1, 'bmdl'); // BMDL at x=1
addClusterPoints(allValuesWithCategories.bmdu, 2, 'bmdu'); // BMDU at x=2
```

3. **Numeric X-Axis with Category Labels**:
```typescript
xaxis: {
  title: '',
  tickmode: 'array',
  tickvals: [0, 1, 2],
  ticktext: ['BMD Mean', 'BMDL Mean', 'BMDU Mean'],
}
```

4. **Legend Groups for Toggle Control**:
```typescript
// Box plot
legendgroup: 'bmd',

// Associated markers
legendgroup: 'bmd',  // Same group name
showlegend: false,    // Don't show in legend separately
```

Clicking a category legend item (e.g., "BMD Mean") hides both the box and all associated cluster markers.

### Technical Challenges and Solutions

#### Challenge 1: Plotly's Jitter Parameter Didn't Work
**Problem**: Used `jitter: 0.3` parameter which doesn't work for scatter plots

**Solution**: Implemented manual jitter using random offsets:
```typescript
const jitteredX = points.map(() => xPosition + (Math.random() - 0.5) * 0.3);
```

#### Challenge 2: Markers Not Linked to Box Visibility
**Problem**: Clicking category legend item only hid box, not associated markers

**Solution**: Used same `legendgroup` value for box and its markers:
```typescript
// Box gets legendgroup 'bmd'
legendgroup: 'bmd',

// All markers for BMD get same group
legendgroup: 'bmd',
showlegend: false,  // Don't show separately
```

#### Challenge 3: Categorical vs Numeric X-Axis
**Problem**: Initially used categorical x-axis which prevented proper marker alignment

**Solution**: Changed to numeric positions (0, 1, 2) with explicit tick labels

### Visual Behavior

**Before**:
- Multi-colored box plots (BMD, BMDL, BMDU each had different color)
- No cluster information visible
- No individual data points shown

**After**:
- Black box-and-whisker plots for clean visualization
- Cluster-colored markers (size 6) with white borders
- Horizontal jitter (±0.15) prevents marker overlap
- Markers aligned with box plots (same y-values)
- Legend allows toggling category visibility (hides both box and markers)
- Consistent cluster colors with UMAP and other charts

### Files Modified
1. `src/main/frontend/components/charts/BMDBoxPlot.tsx` - Black boxes, cluster markers, jitter, legend groups

## BMDvsPValueScatter Cluster Coloring (Session Continuation Part 6)

### Overview
Updated BMDvsPValueScatter to use UMAP-like layering behavior: always show all points as gray background, with selected points colored by cluster as foreground layer. Also fixed axis rescaling to maintain consistent scale regardless of selection.

### Problem Statement
BMDvsPValueScatter showed only colored points for selected categories, with no context of the full dataset. When selecting/deselecting, the axes would rescale, causing points to jump around.

**User Requests**:
1. "color the other default chart by cluster"
2. "okay. now on the bmdvspvaluescatter, always show all points. when points are of the selected categoryies they're colored. otherwise gray and small, lik the umap"
3. "dont rescale the bmd pvalue plot"

### Implementation

#### Changes Made (BMDvsPValueScatter.tsx)

1. **Two-Layer Rendering System**:

**Layer 1: Unselected Points (Always Shown)**
```typescript
// Layer 1: Unselected points (always shown, gray and small like UMAP)
if (unselectedIndices.length > 0) {
  traces.push({
    x: unselectedIndices.map(i => xData[i]),
    y: unselectedIndices.map(i => yData[i]),
    type: 'scatter',
    mode: 'markers',
    marker: {
      color: 'rgba(128, 128, 128, 0.3)',
      size: 4,
      line: {
        color: 'rgba(128, 128, 128, 0.5)',
        width: 0.5,
      },
    },
    showlegend: false,
  });
}
```

**Layer 2: Selected Points by Cluster**
```typescript
// Layer 2: Selected points grouped by cluster (colored and normal size)
if (hasSelection && selectedIndices.length > 0) {
  const selectedByCluster = new Map<string | number, number[]>();

  selectedIndices.forEach(idx => {
    const row = data[idx];
    const umapItem = umapDataService.getByGoId(row.categoryId || '');
    const clusterId = umapItem?.cluster_id ?? -1;

    if (!selectedByCluster.has(clusterId)) {
      selectedByCluster.set(clusterId, []);
    }
    selectedByCluster.get(clusterId)!.push(idx);
  });

  selectedByCluster.forEach((indices, clusterId) => {
    const color = clusterColors[clusterId] || '#999999';

    traces.push({
      marker: {
        color: color,
        size: 8,
        line: {
          color: 'white',
          width: 1,
        },
      },
      name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
      showlegend: clusterId !== -1,  // Hide outliers from legend
    });
  });
}
```

2. **Fixed Axis Ranges**:
```typescript
// Calculate fixed axis ranges from all data
const xRange = useMemo(() => {
  if (xData.length === 0) return undefined;
  const validX = xData.filter(x => x > 0);
  if (validX.length === 0) return undefined;
  const xMin = Math.min(...validX);
  const xMax = Math.max(...validX);
  return [Math.log10(xMin) - 0.5, Math.log10(xMax) + 0.5];
}, [xData]);

const yRange = useMemo(() => {
  if (yData.length === 0) return undefined;
  const validY = yData.filter(y => y > 0);
  if (validY.length === 0) return undefined;
  const yMin = Math.min(...validY);
  const yMax = Math.max(...validY);
  const padding = (yMax - yMin) * 0.1;
  return [Math.max(0, yMin - padding), yMax + padding];
}, [yData]);

// Apply to layout
xaxis: {
  type: 'log',
  range: xRange,  // Fixed range based on all data
},
yaxis: {
  range: yRange,  // Fixed range based on all data
}
```

3. **Conditional Legend Display**:
```typescript
showlegend: hasSelection,  // Only show legend when there's a selection
```

### Visual Behavior

**Before**:
- Only showed selected points (no context)
- Axes rescaled with each selection/deselection
- Points jumped around on the plot
- No background layer

**After**:
- Always shows all points as gray background (size 4, opacity 0.3)
- Selected points colored by cluster (size 8, full opacity)
- White borders on selected points for visibility
- Fixed axes prevent rescaling - points stay in same positions
- Legend appears only when categories are selected
- Matches UMAP layering pattern exactly

### Files Modified
1. `src/main/frontend/components/charts/BMDvsPValueScatter.tsx` - Background layer, fixed axes, cluster coloring

## BMDBoxPlot Selection-Based Rescaling and Cluster Legend (Session Continuation Part 7)

### Overview
Added dynamic rescaling to BMDBoxPlot that zooms to selected categories when present, plus a display-only cluster color legend showing which colors represent which clusters.

### Problem Statement
User wanted the box plot to automatically zoom in on selected data while still providing context through a cluster color reference legend.

**User Request**: "when i change the category selection, i want to also rescale. i want 2 legends. the second one is for cluster color, but is just for display."

### Implementation

#### Changes Made (BMDBoxPlot.tsx)

1. **Track Selected Categories**:
```typescript
import type { RootState } from '../../store/store';

const selectedCategoryIds = useSelector((state: RootState) => state.categoryResults.selectedCategoryIds);
```

2. **Filter Selected Values for Rescaling**:
```typescript
// Filter for selected categories only (for rescaling)
const hasSelection = selectedCategoryIds.size > 0;
const selectedValuesWithCategories = useMemo(() => {
  if (!hasSelection) return allValuesWithCategories;

  return {
    bmd: allValuesWithCategories.bmd.filter(item => selectedCategoryIds.has(item.categoryId || '')),
    bmdl: allValuesWithCategories.bmdl.filter(item => selectedCategoryIds.has(item.categoryId || '')),
    bmdu: allValuesWithCategories.bmdu.filter(item => selectedCategoryIds.has(item.categoryId || '')),
  };
}, [allValuesWithCategories, selectedCategoryIds, hasSelection]);

const selectedValues = {
  bmd: selectedValuesWithCategories.bmd.map(item => item.value!),
  bmdl: selectedValuesWithCategories.bmdl.map(item => item.value!),
  bmdu: selectedValuesWithCategories.bmdu.map(item => item.value!),
};
```

3. **Dynamic Y-Axis Range Based on Selection**:
```typescript
// Calculate y-axis range - use selected data when available, otherwise all data
const yAxisRange = useMemo(() => {
  const dataToUse = hasSelection ? selectedValues : allValues;
  const allBMDValues = [...dataToUse.bmd, ...dataToUse.bmdl, ...dataToUse.bmdu];
  if (allBMDValues.length === 0) return undefined;
  const yMin = Math.min(...allBMDValues);
  const yMax = Math.max(...allBMDValues);
  const padding = (yMax - yMin) * 0.1;
  return [Math.max(0, yMin - padding), yMax + padding];
}, [allValues, selectedValues, hasSelection]);
```

**Result**: Y-axis automatically zooms to selected data range when categories are selected, showing full range when no selection.

4. **Cluster Color Legend (Display Only)**:
```typescript
// Add cluster color legend (display only, non-interactive)
// Get all unique cluster IDs from the data
const clustersInData = new Set<string | number>();
allValuesWithCategories.bmd.forEach(item => {
  const umapItem = umapDataService.getByGoId(item.categoryId || '');
  const clusterId = umapItem?.cluster_id ?? -1;
  clustersInData.add(clusterId);
});
allValuesWithCategories.bmdl.forEach(item => {
  const umapItem = umapDataService.getByGoId(item.categoryId || '');
  const clusterId = umapItem?.cluster_id ?? -1;
  clustersInData.add(clusterId);
});
allValuesWithCategories.bmdu.forEach(item => {
  const umapItem = umapDataService.getByGoId(item.categoryId || '');
  const clusterId = umapItem?.cluster_id ?? -1;
  clustersInData.add(clusterId);
});

// Sort cluster IDs (outliers last)
const sortedClusters = Array.from(clustersInData).sort((a, b) => {
  if (a === -1) return 1;
  if (b === -1) return -1;
  return Number(a) - Number(b);
});

// Add dummy traces for cluster legend (visible in legend only)
sortedClusters.forEach((clusterId, index) => {
  const color = clusterColors[clusterId] || '#999999';
  const isFirst = index === 0;

  traces.push({
    x: [null],
    y: [null],
    type: 'scatter',
    mode: 'markers',
    marker: {
      color: color,
      size: 8,
      symbol: 'circle',
    },
    name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
    showlegend: true,
    legendgroup: 'clusters',
    legendgrouptitle: isFirst ? { text: 'Cluster Colors' } : undefined,
  });
});
```

### Technical Details

**Dummy Traces for Legend**:
- Use `x: [null], y: [null]` to create traces that don't render any visible markers
- Set `showlegend: true` to appear in legend
- Group under "Cluster Colors" legend section using `legendgroup: 'clusters'`
- Display only - clicking doesn't hide/show anything (no actual data)

**Legend Structure**:
1. **Categories** legend group:
   - BMD Mean (interactive - toggles box + markers)
   - BMDL Mean (interactive)
   - BMDU Mean (interactive)

2. **Cluster Colors** legend group:
   - Cluster 0 (display only)
   - Cluster 1 (display only)
   - ... (all clusters present in data)
   - Cluster Outliers (display only)

### Visual Behavior

**Selection Changes**:
- **No selection**: Y-axis shows full data range (all BMD/BMDL/BMDU values)
- **With selection**: Y-axis automatically zooms to selected categories' range
- Smooth rescaling as categories are selected/deselected

**Legend**:
- Two distinct sections in legend sidebar
- Categories section: Interactive (click to hide/show)
- Cluster Colors section: Display-only reference
- All clusters present in data shown with their colors

### User Experience Benefits

1. **Automatic Focus** - Selecting categories zooms the plot to their range automatically
2. **Clear Reference** - Cluster color legend shows what each color means
3. **No Manual Zoom** - No need to use Plotly zoom controls
4. **Consistent Scaling** - Toggle button still available for fixed/auto scale preference
5. **Visual Clarity** - Two distinct legend sections for different purposes

### Files Modified
1. `src/main/frontend/components/charts/BMDBoxPlot.tsx` - Selection-based rescaling, cluster color legend

## Future Enhancements
- Add more multi-set comparison tools (heatmaps, parallel coordinates, etc.)
- Add statistical comparison metrics across multiple datasets
- Add batch operations on selected datasets
- Consider PDF export option with embedded vector graphics
- Add click-to-select interaction on box plot markers (like UMAP and scatter plot)
