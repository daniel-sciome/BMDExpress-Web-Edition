# Reactive Visualization Components: Design & Implementation Guide

**Version**: 1.0 (November 2025)
**Audience**: Engineers implementing interactive data visualizations
**Purpose**: Comprehensive guide to building reactive chart components in BMDExpress-3 Web

---

## Table of Contents

1. [Reactive Visualization Concept](#1-reactive-visualization-concept)
2. [Core Principles](#2-core-principles)
3. [Standard Component Architecture](#3-standard-component-architecture)
4. [Visualization Patterns](#4-visualization-patterns)
5. [Plotly Integration](#5-plotly-integration)
6. [Selection Mechanisms](#6-selection-mechanisms)
7. [Visual Feedback Strategies](#7-visual-feedback-strategies)
8. [Cluster Coloring System](#8-cluster-coloring-system)
9. [Performance Optimization](#9-performance-optimization)
10. [Implementation Examples](#10-implementation-examples)
11. [Testing Reactive Charts](#11-testing-reactive-charts)
12. [Common Pitfalls](#12-common-pitfalls)

---

## 1. Reactive Visualization Concept

### What is a Reactive Visualization?

A **reactive visualization** automatically responds to changes in application state, particularly user selections, without requiring explicit coordination code. In BMDExpress-3 Web, all charts are reactive participants in a unified selection system.

### Key Characteristics

```typescript
// ✅ Reactive Visualization
function ReactiveChart() {
  // Declares reactive dependency
  const categoryState = useReactiveState('categoryId');

  // Automatically receives selection updates
  useEffect(() => {
    // Re-render when selection changes
  }, [categoryState.selectedIds]);

  // Can update selection
  const handleClick = (id) => {
    categoryState.handleSelect(id, isMulti, 'chart-name');
  };
}

// ❌ Non-Reactive Visualization
function NonReactiveChart({ selectedIds, onSelect }) {
  // Props-based, requires manual wiring from parent
  // Parent must subscribe to Redux and pass down
  // Breaks encapsulation
}
```

### Benefits

1. **Bidirectional Synchronization**: Chart → Selection → Other Charts (automatic)
2. **Decoupled Architecture**: Charts don't know about each other
3. **Consistent Behavior**: All charts follow same interaction patterns
4. **Easy Extension**: Add new charts without modifying existing ones
5. **Source Tracking**: Know which component triggered selection (debugging)

---

## 2. Core Principles

### Principle 1: Single Source of Truth

**All selection state lives in Redux** (`state.categoryResults.reactiveSelection`).

```typescript
// ✅ Good: Read from reactive state
const categoryState = useReactiveState('categoryId');
const isSelected = categoryState.isSelected(categoryId);

// ❌ Bad: Local selection state
const [selectedIds, setSelectedIds] = useState(new Set());
```

### Principle 2: Declare Reactive Dependencies

**Charts declare what they react to** using `useReactiveState(type)`.

```typescript
// React to category selection
const categoryState = useReactiveState('categoryId');

// React to cluster selection
const clusterState = useReactiveState('clusterId');

// React to both (if chart shows both dimensions)
const categoryState = useReactiveState('categoryId');
const clusterState = useReactiveState('clusterId');
```

### Principle 3: Context Preservation

**Always show all data, highlight selections** (two-layer pattern).

```typescript
// ✅ Good: Users see context
const traces = [
  backgroundTrace,  // All data (gray, small)
  foregroundTrace   // Selected data (colored, large)
];

// ❌ Bad: Users lose context
const traces = [
  selectedOnlyTrace  // Only selected data
];
```

### Principle 4: Progressive Disclosure

**Gradually reduce visual complexity** based on user interaction.

```typescript
// State progression: Normal → Outlined → Hidden → Normal
// Implemented via 3-way toggle on legend clicks
handleLegendClick() {
  const nextState = (currentState + 1) % 3;
  // 0: Normal, 1: Outlined, 2: Hidden
}
```

### Principle 5: Consistent Visual Language

**Use cluster colors consistently** across all visualizations.

```typescript
// ✅ Good: Single color source
const clusterColors = useClusterColors();
marker.color = clusterColors.get(category.cluster);

// ❌ Bad: Different colors per chart
marker.color = generateRandomColor(category.cluster);
```

---

## 3. Standard Component Architecture

### Canonical Structure

Every reactive visualization follows this template:

```typescript
import React, { useMemo, useCallback, useEffect } from 'react';
import Plot from 'react-plotly.js';
import type { PlotMouseEvent } from 'plotly.js';
import { useAppSelector } from '../../store/hooks';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterColors } from './hooks/useClusterColors';

export default function MyReactiveChart() {
  // ============================================================
  // 1. REACTIVE STATE (Selection Management)
  // ============================================================
  const categoryState = useReactiveState('categoryId');
  const clusterState = useReactiveState('clusterId');

  // ============================================================
  // 2. DATA SOURCES (Redux Selectors)
  // ============================================================
  const categoriesWithUmap = useAppSelector(selectCategoryDataWithUmap);
  const analysisType = useAppSelector((state) =>
    state.categoryResults.analysisType
  );

  // ============================================================
  // 3. VISUAL CONFIGURATION (Colors, Styles)
  // ============================================================
  const clusterColors = useClusterColors();

  // ============================================================
  // 4. DATA PREPARATION (Memoized Computations)
  // ============================================================
  const { allData, selectedData } = useMemo(() => {
    // Separate all data from selected data
    const selected = categoriesWithUmap.filter(cat =>
      categoryState.isSelected(cat.categoryId || '')
    );

    return {
      allData: categoriesWithUmap,
      selectedData: selected
    };
  }, [categoriesWithUmap, categoryState.selectedIds]);

  // ============================================================
  // 5. TRACE GENERATION (Plotly Data Structures)
  // ============================================================
  const traces = useMemo(() => {
    // Background trace (context layer)
    const bgTrace = {
      x: allData.map(d => d.xValue),
      y: allData.map(d => d.yValue),
      mode: 'markers',
      marker: {
        color: 'rgba(128, 128, 128, 0.3)',
        size: 4
      },
      showlegend: false,
      hoverinfo: 'skip',
      type: 'scatter'
    };

    // Foreground trace (selection layer)
    const fgTrace = {
      x: selectedData.map(d => d.xValue),
      y: selectedData.map(d => d.yValue),
      mode: 'markers',
      marker: {
        color: selectedData.map(d =>
          clusterColors.get(d.cluster || -1) || '#666'
        ),
        size: 8,
        opacity: 1.0,
        line: { color: 'white', width: 1 }
      },
      customdata: selectedData.map(d => d.categoryId),
      text: selectedData.map(d => d.categoryDescription),
      hovertemplate: '<b>%{text}</b><br>X: %{x}<br>Y: %{y}<extra></extra>',
      showlegend: true,
      type: 'scatter'
    };

    return [bgTrace, fgTrace];
  }, [allData, selectedData, clusterColors]);

  // ============================================================
  // 6. LAYOUT CONFIGURATION (Plotly Layout)
  // ============================================================
  const layout = useMemo(() => ({
    title: 'My Reactive Chart',
    xaxis: {
      title: 'X Axis Label',
      zeroline: false
    },
    yaxis: {
      title: 'Y Axis Label',
      zeroline: false
    },
    hovermode: 'closest',
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.2
    }
  }), []);

  // ============================================================
  // 7. INTERACTION HANDLERS (Click, Hover, etc.)
  // ============================================================
  const handleClick = useCallback((event: PlotMouseEvent) => {
    if (!event.points || event.points.length === 0) return;

    const categoryId = event.points[0].customdata as string;
    const isMultiSelect = event.event.ctrlKey || event.event.metaKey;

    categoryState.handleSelect(categoryId, isMultiSelect, 'mychart');
  }, [categoryState]);

  const handleDoubleClick = useCallback(() => {
    // Clear selection on double-click
    categoryState.handleClear();
  }, [categoryState]);

  // ============================================================
  // 8. SIDE EFFECTS (Auto-load data, sync external state)
  // ============================================================
  useEffect(() => {
    // Example: Load additional data when selection changes
    if (categoryState.selectedIds.size > 0) {
      console.log('[MyChart] Selection changed:',
        Array.from(categoryState.selectedIds)
      );
    }
  }, [categoryState.selectedIds]);

  // ============================================================
  // 9. RENDER (Plotly Component)
  // ============================================================
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Plot
        data={traces}
        layout={layout}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d']
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
```

### Key Sections Explained

#### 1. Reactive State
- **Purpose**: Connect to unified selection system
- **Pattern**: Always use `useReactiveState(type)`
- **Never**: Create local selection state

#### 2. Data Sources
- **Purpose**: Get data from Redux
- **Pattern**: Use memoized selectors
- **Never**: Store large datasets in component state

#### 3. Visual Configuration
- **Purpose**: Get consistent styling (colors, sizes)
- **Pattern**: Use shared hooks (useClusterColors)
- **Never**: Hard-code colors or styles

#### 4. Data Preparation
- **Purpose**: Transform data for visualization
- **Pattern**: Use useMemo with proper dependencies
- **Never**: Compute in render function

#### 5. Trace Generation
- **Purpose**: Create Plotly data structures
- **Pattern**: Separate background and foreground traces
- **Never**: Mix all data in single trace

#### 6. Layout Configuration
- **Purpose**: Define chart appearance
- **Pattern**: Use useMemo for stable references
- **Never**: Create new objects on every render

#### 7. Interaction Handlers
- **Purpose**: Respond to user actions
- **Pattern**: Use useCallback, update reactive state
- **Never**: Bypass reactive state system

#### 8. Side Effects
- **Purpose**: React to state changes
- **Pattern**: Use useEffect with proper dependencies
- **Never**: Modify state inside render

#### 9. Render
- **Purpose**: Display the visualization
- **Pattern**: Plotly component with config
- **Never**: Return null or conditionally render

---

## 4. Visualization Patterns

### Pattern 1: Two-Layer Rendering

**Problem**: Users lose context when only selected items are shown.

**Solution**: Render all data as background, selected data as foreground.

```typescript
const traces = useMemo(() => {
  // Layer 1: Background (ALL data, gray, small, no hover, no legend)
  const backgroundTrace: Plotly.Data = {
    x: allData.map(d => d.xValue),
    y: allData.map(d => d.yValue),
    mode: 'markers',
    marker: {
      color: 'rgba(128, 128, 128, 0.3)',  // Gray, 30% opacity
      size: 4,                              // Small
      opacity: 0.3
    },
    showlegend: false,                      // Don't clutter legend
    hoverinfo: 'skip',                      // Disable hover
    type: 'scatter',
    name: 'All Data'
  };

  // Layer 2: Foreground (SELECTED data, colored by cluster, large, interactive)
  const foregroundTrace: Plotly.Data = {
    x: selectedData.map(d => d.xValue),
    y: selectedData.map(d => d.yValue),
    mode: 'markers',
    marker: {
      color: selectedData.map(d => getClusterColor(d.cluster)),
      size: 8,                              // Larger
      opacity: 1.0,                         // Fully opaque
      line: { color: 'white', width: 1 }   // White border for visibility
    },
    customdata: selectedData.map(d => d.categoryId),
    text: selectedData.map(d => d.categoryDescription),
    hovertemplate: '<b>%{text}</b><br>X: %{x}<br>Y: %{y}<extra></extra>',
    showlegend: true,
    type: 'scatter',
    name: 'Selected'
  };

  return [backgroundTrace, foregroundTrace];
}, [allData, selectedData]);
```

**When to Use**:
- Scatter plots (UMAP, BMD vs P-Value)
- Line charts (Accumulation)
- Any chart where context is important

**When NOT to Use**:
- Box plots (boxes already provide context)
- Bar charts (bars show full distribution)

### Pattern 2: Cluster-Grouped Traces

**Problem**: Plotly's styling applies per-trace, not per-point. Can't have different error bar styles for different clusters in same trace.

**Solution**: Create one trace per cluster.

```typescript
const traces = useMemo(() => {
  const tracesByCluster: Plotly.Data[] = [];

  // Group data by cluster
  const clusters = new Set(selectedData.map(d => d.cluster).filter(c => c !== null));

  clusters.forEach(clusterId => {
    const clusterData = selectedData.filter(d => d.cluster === clusterId);
    const clusterColor = clusterColors.get(clusterId) || '#666';

    const trace: Plotly.Data = {
      x: clusterData.map(d => d.xValue),
      y: clusterData.map(d => d.yValue),
      error_x: {
        type: 'data',
        array: clusterData.map(d => d.errorBar),
        color: clusterColor,  // Error bars match markers
        thickness: 2,
        width: 4
      },
      mode: 'markers',
      marker: {
        color: clusterColor,
        size: 10,
        line: { color: 'white', width: 1 }
      },
      type: 'scatter',
      name: `Cluster ${clusterId}`,
      legendgroup: `cluster-${clusterId}`,
      showlegend: true
    };

    tracesByCluster.push(trace);
  });

  return tracesByCluster;
}, [selectedData, clusterColors]);
```

**When to Use**:
- Charts with error bars (RangePlot)
- Charts where per-cluster styling is critical
- When legend should group by cluster

**Trade-offs**:
- More traces = larger Plotly config
- Legend can become crowded (40+ clusters)
- Slightly slower rendering

### Pattern 3: Progressive Disclosure (3-Way Toggle)

**Problem**: Too many visual elements (40+ clusters) overwhelm users.

**Solution**: Allow hiding non-selected elements in stages.

```typescript
function useProgressiveDisclosure() {
  // State: 0=normal, 1=outlined, 2=hidden
  const [clusterVisibility, setClusterVisibility] = useState<Map<number, number>>(
    new Map()
  );

  const handleLegendClick = useCallback((clusterId: number, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      // Multi-select mode: toggle selection, don't change visibility
      clusterState.handleSelect(clusterId, true, 'legend');
    } else {
      // Single-select mode: cycle through states
      const currentState = clusterVisibility.get(clusterId) || 0;
      const nextState = (currentState + 1) % 3;

      if (nextState === 0) {
        // Returning to normal → deselect
        clusterState.handleClear();
        setClusterVisibility(new Map());
      } else {
        // Progressing to outlined/hidden → select
        clusterState.handleSelect(clusterId, false, 'legend');
        setClusterVisibility(new Map([[clusterId, nextState]]));
      }
    }
  }, [clusterState, clusterVisibility]);

  const getMarkerStyle = useCallback((clusterId: number) => {
    const state = clusterVisibility.get(clusterId) || 0;
    const isSelected = clusterState.isSelected(clusterId);

    // Selected cluster: always visible
    if (isSelected) {
      return {
        opacity: 1.0,
        line: { color: 'white', width: 2 }
      };
    }

    // Non-selected clusters: apply visibility state
    switch (state) {
      case 0:  // Normal
        return { opacity: 1.0, line: { color: 'transparent', width: 0 } };
      case 1:  // Outlined (selected cluster is hidden, non-selected outlined)
        return { opacity: 1.0, line: { color: 'white', width: 2 } };
      case 2:  // Hidden
        return { opacity: 0.0, line: { color: 'transparent', width: 0 } };
      default:
        return { opacity: 1.0, line: { color: 'transparent', width: 0 } };
    }
  }, [clusterVisibility, clusterState.selectedIds]);

  return {
    clusterVisibility,
    handleLegendClick,
    getMarkerStyle
  };
}
```

**Usage in Component**:

```typescript
const { handleLegendClick, getMarkerStyle } = useProgressiveDisclosure();

// Apply to traces
clusters.forEach(clusterId => {
  const style = getMarkerStyle(clusterId);
  const trace = {
    // ... data
    marker: {
      color: clusterColors.get(clusterId),
      ...style  // Apply dynamic styling
    }
  };
});

// Attach to legend click
const handleClick = (event: PlotMouseEvent) => {
  if (event.event.target.classList.contains('legend')) {
    handleLegendClick(clusterId, event.event.ctrlKey);
  }
};
```

**Interaction Flow**:
1. **First Click**: Select cluster → others become outlined
2. **Second Click**: Others hidden (opacity 0)
3. **Third Click**: Deselect → all return to normal

### Pattern 4: Fixed Axes (Prevent Rescaling)

**Problem**: Chart axes rescale when selection changes, causing points to "jump" around.

**Solution**: Calculate fixed axis ranges from ALL data upfront.

```typescript
const axisRanges = useMemo(() => {
  const xValues = allData.map(d => d.xValue);
  const yValues = allData.map(d => d.yValue);

  return {
    xMin: Math.min(...xValues),
    xMax: Math.max(...xValues),
    yMin: Math.min(...yValues),
    yMax: Math.max(...yValues)
  };
}, [allData]);  // Only depends on ALL data, not selection

const layout = useMemo(() => ({
  xaxis: {
    range: [axisRanges.xMin * 0.95, axisRanges.xMax * 1.05],  // 5% padding
    fixedrange: false  // Allow manual zoom
  },
  yaxis: {
    range: [axisRanges.yMin * 0.95, axisRanges.yMax * 1.05],
    fixedrange: false
  }
}), [axisRanges]);
```

**Exception: Dynamic Rescaling for Box Plots**

Box plots benefit from rescaling to focus on selected categories:

```typescript
const layout = useMemo(() => {
  if (selectedData.length > 0) {
    // Rescale to selected data
    const yValues = selectedData.flatMap(d => d.values);
    return {
      yaxis: {
        range: [Math.min(...yValues), Math.max(...yValues)]
      }
    };
  } else {
    // Show all data
    const yValues = allData.flatMap(d => d.values);
    return {
      yaxis: {
        range: [Math.min(...yValues), Math.max(...yValues)]
      }
    };
  }
}, [allData, selectedData]);
```

### Pattern 5: Jittered Markers

**Problem**: Overlapping markers at same x-position are hidden.

**Solution**: Add random horizontal jitter.

```typescript
function addJitter(value: number, range: number = 0.15): number {
  return value + (Math.random() - 0.5) * range;
}

const trace = {
  x: data.map((d, i) => addJitter(d.categoryIndex)),  // Jitter x
  y: data.map(d => d.yValue),                         // Keep y accurate
  mode: 'markers',
  // ...
};
```

**When to Use**:
- Box plots with overlaid markers
- Categorical x-axes with many points per category
- Strip plots

**Trade-offs**:
- Jitter is random (changes on re-render unless seeded)
- Can't click exact position (need to use customdata)

---

## 5. Plotly Integration

### Plotly Component Configuration

```typescript
<Plot
  data={traces}
  layout={layout}
  frames={frames}         // For animations (optional)
  config={config}
  onClick={handleClick}
  onDoubleClick={handleDoubleClick}
  onHover={handleHover}
  onUnhover={handleUnhover}
  onSelected={handleSelected}
  onRelayout={handleRelayout}
  onUpdate={handleUpdate}
  style={{ width: '100%', height: '100%' }}
  useResizeHandler={true}
  divId="my-chart"
/>
```

### Essential Config Options

```typescript
const config: Partial<Plotly.Config> = {
  // Display
  responsive: true,              // Auto-resize on window resize
  displayModeBar: true,          // Show toolbar on hover
  displaylogo: false,            // Hide Plotly logo

  // Toolbar Buttons
  modeBarButtonsToRemove: [
    'lasso2d',                   // Remove lasso select
    'select2d',                  // Remove box select
    'pan2d',                     // Remove pan (if not needed)
    'zoomIn2d',                  // Remove zoom buttons (can use scroll)
    'zoomOut2d',
    'autoScale2d',               // Remove autoscale
    'resetScale2d'               // Remove reset (we handle with double-click)
  ],
  modeBarButtonsToAdd: [
    // Custom buttons if needed
  ],

  // Interaction
  scrollZoom: true,              // Enable scroll to zoom
  doubleClick: false,            // Disable default double-click (we handle it)

  // Export
  toImageButtonOptions: {
    format: 'png',               // Export format
    filename: 'chart',
    height: 1200,
    width: 1600,
    scale: 2                     // 2x resolution
  }
};
```

### Layout Best Practices

```typescript
const layout: Partial<Plotly.Layout> = {
  // Title
  title: {
    text: 'Chart Title',
    font: { size: 18, family: 'Roboto, sans-serif' }
  },

  // Axes
  xaxis: {
    title: { text: 'X Axis Label', font: { size: 14 } },
    zeroline: false,             // Hide zero line
    gridcolor: '#e5e5e5',        // Light grid
    showgrid: true
  },
  yaxis: {
    title: { text: 'Y Axis Label', font: { size: 14 } },
    zeroline: false,
    gridcolor: '#e5e5e5',
    showgrid: true
  },

  // Legend
  showlegend: true,
  legend: {
    orientation: 'h',            // Horizontal legend
    yanchor: 'top',
    y: -0.2,                     // Below chart
    xanchor: 'center',
    x: 0.5,
    font: { size: 12 }
  },

  // Interaction
  hovermode: 'closest',          // Snap to nearest point
  clickmode: 'event+select',     // Both click and select events

  // Size
  autosize: true,
  margin: { l: 60, r: 40, t: 60, b: 80 },

  // Background
  plot_bgcolor: '#ffffff',
  paper_bgcolor: '#ffffff'
};
```

### Trace Types Quick Reference

#### Scatter

```typescript
const scatterTrace: Plotly.Data = {
  type: 'scatter',
  mode: 'markers',                    // 'markers', 'lines', 'markers+lines'
  x: [1, 2, 3],
  y: [4, 5, 6],
  marker: {
    size: 8,
    color: '#1f77b4',                 // Single color or array
    opacity: 1.0,
    line: { color: 'white', width: 1 }
  },
  customdata: ['id1', 'id2', 'id3'],  // For click handling
  text: ['Label 1', 'Label 2', 'Label 3'],
  hovertemplate: '<b>%{text}</b><br>X: %{x}<br>Y: %{y}<extra></extra>',
  showlegend: true,
  name: 'Series 1'
};
```

#### Box Plot

```typescript
const boxTrace: Plotly.Data = {
  type: 'box',
  y: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  x: ['Category A', 'Category A', 'Category A', ...],  // Grouping
  name: 'Box Plot',
  boxmean: 'sd',                      // Show mean and std dev
  marker: { color: '#000000' },       // Box color
  line: { color: '#000000', width: 1 }
};
```

#### Line Chart

```typescript
const lineTrace: Plotly.Data = {
  type: 'scatter',
  mode: 'lines',
  x: [0, 1, 2, 3, 4],
  y: [0, 1, 4, 9, 16],
  line: {
    color: '#1f77b4',
    width: 2,
    shape: 'spline',                  // 'linear', 'spline', 'hv', 'vh', 'hvh', 'vhv'
    smoothing: 1.3
  },
  fill: 'tozeroy',                    // Optional area fill
  name: 'Line'
};
```

#### Error Bars

```typescript
const errorTrace: Plotly.Data = {
  type: 'scatter',
  mode: 'markers',
  x: [1, 2, 3],
  y: [2, 3, 4],
  error_y: {
    type: 'data',
    array: [0.5, 1.0, 0.7],           // Error bar sizes
    visible: true,
    color: '#1f77b4',
    thickness: 2,
    width: 4
  },
  error_x: {
    type: 'data',
    array: [0.2, 0.3, 0.4],
    visible: true,
    color: '#1f77b4',
    thickness: 2,
    width: 4
  }
};
```

---

## 6. Selection Mechanisms

### Click-to-Select

```typescript
const handleClick = useCallback((event: PlotMouseEvent) => {
  // Guard: Ensure points exist
  if (!event.points || event.points.length === 0) return;

  // Extract category ID from customdata
  const categoryId = event.points[0].customdata as string;

  // Check for multi-select modifier
  const isMultiSelect = event.event.ctrlKey || event.event.metaKey;

  // Update reactive state
  categoryState.handleSelect(categoryId, isMultiSelect, 'chart-name');
}, [categoryState]);
```

**Important**: Always pass unique `source` identifier (third parameter). This helps with debugging and can be used for priority logic.

### Click-and-Drag Select (Box/Lasso)

```typescript
const handleSelected = useCallback((event: Plotly.PlotSelectionEvent) => {
  if (!event || !event.points) return;

  // Extract all selected IDs
  const selectedIds = event.points
    .map(pt => pt.customdata as string)
    .filter(id => id !== undefined);

  // Bulk select
  categoryState.handleMultiSelect(selectedIds, 'chart-name-box-select');
}, [categoryState]);

// Enable in Plotly config
const config = {
  modeBarButtonsToAdd: ['lasso2d', 'select2d']
};
```

**Trade-off**: Box/lasso select can be confusing with click-select. Consider disabling or providing clear UI indication of mode.

### Legend Click-to-Select

```typescript
const handleClick = useCallback((event: PlotMouseEvent) => {
  // Check if click was on legend
  const target = event.event.target as HTMLElement;
  const isLegendClick = target.closest('.legend') !== null;

  if (isLegendClick) {
    // Extract cluster ID from legend item
    const clusterId = extractClusterIdFromLegend(target);
    const isMultiSelect = event.event.ctrlKey || event.event.metaKey;

    clusterState.handleSelect(clusterId, isMultiSelect, 'chart-name-legend');

    // Prevent default legend toggle
    event.event.stopPropagation();
    event.event.preventDefault();
    return false;
  }

  // Regular point click
  // ...
}, [clusterState]);
```

### Double-Click to Clear

```typescript
const handleDoubleClick = useCallback(() => {
  // Clear all selections
  categoryState.handleClear();
  clusterState.handleClear();
}, [categoryState, clusterState]);
```

**Pattern**: Double-click anywhere on chart to reset. Consistent across all visualizations.

### Hover Preview

```typescript
const [hoveredId, setHoveredId] = useState<string | null>(null);

const handleHover = useCallback((event: Plotly.PlotHoverEvent) => {
  if (event.points && event.points.length > 0) {
    const categoryId = event.points[0].customdata as string;
    setHoveredId(categoryId);
  }
}, []);

const handleUnhover = useCallback(() => {
  setHoveredId(null);
}, []);

// Optionally: Show different styling for hovered item
const getMarkerSize = (categoryId: string) => {
  if (hoveredId === categoryId) return 12;  // Larger on hover
  if (categoryState.isSelected(categoryId)) return 8;
  return 4;  // Default
};
```

**Use Case**: Temporary highlight before clicking. Helps users preview selection.

---

## 7. Visual Feedback Strategies

### Selection Highlighting

#### Strategy 1: Size Change

```typescript
marker: {
  size: selectedData.map(d =>
    categoryState.isSelected(d.categoryId) ? 10 : 4
  )
}
```

**Pros**: Clear visual distinction
**Cons**: Can obscure nearby points

#### Strategy 2: Opacity Change

```typescript
marker: {
  opacity: selectedData.map(d =>
    categoryState.isSelected(d.categoryId) ? 1.0 : 0.3
  )
}
```

**Pros**: Subtle, doesn't change layout
**Cons**: Less noticeable

#### Strategy 3: Color Change

```typescript
marker: {
  color: selectedData.map(d =>
    categoryState.isSelected(d.categoryId)
      ? clusterColors.get(d.cluster)
      : 'rgba(128, 128, 128, 0.3)'
  )
}
```

**Pros**: Dramatic, shows cluster membership
**Cons**: Loses color information for unselected

#### Strategy 4: Border Addition (Recommended)

```typescript
marker: {
  color: selectedData.map(d => clusterColors.get(d.cluster)),
  line: {
    color: selectedData.map(d =>
      categoryState.isSelected(d.categoryId) ? 'white' : 'transparent'
    ),
    width: 2
  }
}
```

**Pros**: Clear, preserves color, doesn't obscure
**Cons**: Subtle on light backgrounds

#### Strategy 5: Two-Layer (Best)

```typescript
// Background: All data, gray, small
const bgTrace = {
  marker: { color: 'rgba(128, 128, 128, 0.3)', size: 4 }
};

// Foreground: Selected only, colored, larger, bordered
const fgTrace = {
  marker: {
    color: selectedData.map(d => clusterColors.get(d.cluster)),
    size: 8,
    line: { color: 'white', width: 1 }
  }
};
```

**Pros**: Best of all strategies, preserves context
**Cons**: Two traces = slightly more computation

### Cluster Color Feedback

```typescript
// Always use consistent cluster colors
const clusterColors = useClusterColors();

// Show cluster in hover
hovertemplate: '<b>%{text}</b><br>Cluster: %{marker.color}<extra></extra>'

// Show cluster in legend (one trace per cluster)
name: `Cluster ${clusterId}`

// Color legend items
legendgrouptitle: { text: `<span style="color:${color}">●</span> Cluster ${id}` }
```

### Loading State

```typescript
const [isLoading, setIsLoading] = useState(false);

if (isLoading) {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <Spin size="large" />
      <p>Loading visualization...</p>
    </div>
  );
}

return <Plot data={traces} layout={layout} />;
```

### Empty State

```typescript
if (data.length === 0) {
  return (
    <Empty
      description="No data available for this view"
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  );
}
```

### Selection Counter

```typescript
{categoryState.selectedIds.size > 0 && (
  <Tag color="blue" style={{ marginBottom: '10px' }}>
    Selected: {categoryState.selectedIds.size} / {allData.length}
  </Tag>
)}
```

---

## 8. Cluster Coloring System

### Color Palette

BMDExpress-3 uses a carefully selected 40-color palette for cluster visualization:

```typescript
const CLUSTER_COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
  '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
  '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080',
  '#ffffff', '#000000', '#ff6b6b', '#4ecdc4', '#45b7d1',
  '#96ceb4', '#ffeaa7', '#dfe6e9', '#74b9ff', '#a29bfe',
  '#fd79a8', '#fdcb6e', '#6c5ce7', '#00b894', '#00cec9',
  '#0984e3', '#b2bec3', '#636e72', '#d63031', '#e17055'
];
```

### useClusterColors Hook

```typescript
export function useClusterColors(): Map<number, string> {
  const umapDataService = useMemo(() => getUmapDataService(), []);

  return useMemo(() => {
    const clusterIds = umapDataService.getAllClusterIds();
    const colorMap = new Map<number, string>();

    clusterIds.forEach((clusterId, index) => {
      colorMap.set(clusterId, CLUSTER_COLORS[index % CLUSTER_COLORS.length]);
    });

    return colorMap;
  }, [umapDataService]);
}
```

**Usage**:

```typescript
const clusterColors = useClusterColors();

// In trace
marker: {
  color: data.map(d => clusterColors.get(d.cluster || -1) || '#666')
}
```

### Fallback Color

Always provide a fallback for:
- Null clusters
- Clusters not in UMAP data
- Invalid cluster IDs

```typescript
const color = clusterColors.get(category.cluster || -1) || '#666666';
```

### Color Consistency Rules

1. **Same cluster = same color** across all charts
2. **Use clusterColors Map** from useClusterColors hook
3. **Never generate colors** dynamically per-chart
4. **Fallback to gray (#666)** for unknown clusters
5. **Test with all 40 clusters** to ensure no color collisions

---

## 9. Performance Optimization

### Memoization

```typescript
// ✅ Good: Memoized traces
const traces = useMemo(() => {
  return createTraces(data);
}, [data]);  // Only recompute when data changes

// ❌ Bad: Recomputed every render
const traces = createTraces(data);
```

### useMemo Dependencies

```typescript
// Only recompute when relevant state changes
const traces = useMemo(() => {
  // ...
}, [
  categoriesWithUmap,      // Data source
  categoryState.selectedIds, // Selection
  clusterColors            // Colors
]);

// Don't include stable references
// ❌ Bad: categoryState (object changes on every call)
// ✅ Good: categoryState.selectedIds (Set is memoized)
```

### useCallback for Handlers

```typescript
// ✅ Good: Stable function reference
const handleClick = useCallback((event) => {
  // ...
}, [categoryState]);  // Only recreate if categoryState changes

// ❌ Bad: New function every render
const handleClick = (event) => {
  // ...
};
```

### Avoid Re-renders

```typescript
// Prevent unnecessary re-renders with React.memo
export default React.memo(MyChart, (prevProps, nextProps) => {
  // Only re-render if key prop changes
  return prevProps.key === nextProps.key;
});
```

### Large Datasets

For datasets > 1000 points:

```typescript
// Downsample for visualization
const sampledData = useMemo(() => {
  if (allData.length > 1000) {
    // Show every Nth point for background
    return allData.filter((_, i) => i % Math.ceil(allData.length / 1000) === 0);
  }
  return allData;
}, [allData]);

// Always show ALL selected data
const foregroundData = selectedData;  // No sampling
```

### Debounce Expensive Operations

```typescript
import { debounce } from 'lodash';

const updateChart = useMemo(() =>
  debounce((newData) => {
    setTraces(createTraces(newData));
  }, 300),  // Wait 300ms after last change
[]);

useEffect(() => {
  updateChart(data);
}, [data, updateChart]);
```

---

## 10. Implementation Examples

### Example 1: Simple Scatter Plot

```typescript
import React, { useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { useAppSelector } from '../../store/hooks';
import { selectCategoryDataWithUmap } from '../../store/slices/umapIntegration';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterColors } from './hooks/useClusterColors';

export default function SimpleScatterPlot() {
  const categoryState = useReactiveState('categoryId');
  const categoriesWithUmap = useAppSelector(selectCategoryDataWithUmap);
  const clusterColors = useClusterColors();

  const { allData, selectedData } = useMemo(() => ({
    allData: categoriesWithUmap,
    selectedData: categoriesWithUmap.filter(cat =>
      categoryState.isSelected(cat.categoryId || '')
    )
  }), [categoriesWithUmap, categoryState.selectedIds]);

  const traces = useMemo(() => {
    const bgTrace = {
      x: allData.map(d => d.bmdMean),
      y: allData.map(d => d.percentage),
      mode: 'markers',
      marker: { color: 'rgba(128, 128, 128, 0.3)', size: 4 },
      showlegend: false,
      hoverinfo: 'skip',
      type: 'scatter'
    };

    const fgTrace = {
      x: selectedData.map(d => d.bmdMean),
      y: selectedData.map(d => d.percentage),
      mode: 'markers',
      marker: {
        color: selectedData.map(d => clusterColors.get(d.cluster || -1) || '#666'),
        size: 8,
        line: { color: 'white', width: 1 }
      },
      customdata: selectedData.map(d => d.categoryId),
      text: selectedData.map(d => d.categoryDescription),
      hovertemplate: '<b>%{text}</b><br>BMD: %{x}<br>%: %{y}<extra></extra>',
      type: 'scatter'
    };

    return [bgTrace, fgTrace];
  }, [allData, selectedData, clusterColors]);

  const layout = useMemo(() => ({
    title: 'BMD vs Percentage',
    xaxis: { title: 'BMD Mean' },
    yaxis: { title: 'Percentage' },
    hovermode: 'closest'
  }), []);

  const handleClick = useCallback((event) => {
    if (!event.points || event.points.length === 0) return;
    const id = event.points[0].customdata;
    const isMulti = event.event.ctrlKey || event.event.metaKey;
    categoryState.handleSelect(id, isMulti, 'scatter');
  }, [categoryState]);

  return (
    <Plot
      data={traces}
      layout={layout}
      onClick={handleClick}
      onDoubleClick={() => categoryState.handleClear()}
      config={{ responsive: true }}
      style={{ width: '100%', height: '600px' }}
    />
  );
}
```

### Example 2: Box Plot with Cluster Markers

```typescript
import React, { useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { useAppSelector } from '../../store/hooks';
import { selectCategoryDataWithUmap } from '../../store/slices/umapIntegration';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterColors } from './hooks/useClusterColors';

function addJitter(value: number, range: number = 0.15): number {
  return value + (Math.random() - 0.5) * range;
}

export default function ClusteredBoxPlot() {
  const categoryState = useReactiveState('categoryId');
  const categoriesWithUmap = useAppSelector(selectCategoryDataWithUmap);
  const clusterColors = useClusterColors();

  const selectedData = useMemo(() =>
    categoriesWithUmap.filter(cat => categoryState.isSelected(cat.categoryId || '')),
    [categoriesWithUmap, categoryState.selectedIds]
  );

  const traces = useMemo(() => {
    const traces = [];

    // Box plots (one per category)
    selectedData.forEach((category, index) => {
      const boxTrace = {
        type: 'box',
        y: category.bmdValues || [],
        x: Array(category.bmdValues?.length || 0).fill(index),
        name: category.categoryId,
        marker: { color: '#000000' },
        line: { color: '#000000', width: 1 },
        showlegend: false
      };
      traces.push(boxTrace);
    });

    // Overlaid markers (colored by cluster, jittered)
    const markerTrace = {
      type: 'scatter',
      mode: 'markers',
      x: selectedData.flatMap((cat, catIndex) =>
        (cat.bmdValues || []).map(() => addJitter(catIndex))
      ),
      y: selectedData.flatMap(cat => cat.bmdValues || []),
      marker: {
        color: selectedData.flatMap(cat =>
          (cat.bmdValues || []).map(() =>
            clusterColors.get(cat.cluster || -1) || '#666'
          )
        ),
        size: 6,
        line: { color: 'white', width: 1 }
      },
      customdata: selectedData.flatMap(cat =>
        (cat.bmdValues || []).map(() => cat.categoryId)
      ),
      showlegend: false,
      hoverinfo: 'y'
    };
    traces.push(markerTrace);

    return traces;
  }, [selectedData, clusterColors]);

  const layout = useMemo(() => ({
    title: 'BMD Distribution by Category',
    yaxis: { title: 'BMD Value' },
    xaxis: { title: 'Category', tickvals: [] },
    showlegend: false
  }), []);

  const handleClick = useCallback((event) => {
    if (!event.points || event.points.length === 0) return;
    const id = event.points[0].customdata;
    const isMulti = event.event.ctrlKey || event.event.metaKey;
    categoryState.handleSelect(id, isMulti, 'boxplot');
  }, [categoryState]);

  return (
    <Plot
      data={traces}
      layout={layout}
      onClick={handleClick}
      config={{ responsive: true }}
      style={{ width: '100%', height: '600px' }}
    />
  );
}
```

### Example 3: Multi-Trace Cluster Chart

```typescript
import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useAppSelector } from '../../store/hooks';
import { selectCategoryDataWithUmap } from '../../store/slices/umapIntegration';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterColors } from './hooks/useClusterColors';

export default function ClusterTraceChart() {
  const categoryState = useReactiveState('categoryId');
  const categoriesWithUmap = useAppSelector(selectCategoryDataWithUmap);
  const clusterColors = useClusterColors();

  const selectedData = useMemo(() =>
    categoriesWithUmap.filter(cat => categoryState.isSelected(cat.categoryId || '')),
    [categoriesWithUmap, categoryState.selectedIds]
  );

  const traces = useMemo(() => {
    // Group by cluster
    const clusters = new Set(selectedData.map(d => d.cluster).filter(c => c !== null));

    return Array.from(clusters).map(clusterId => {
      const clusterData = selectedData.filter(d => d.cluster === clusterId);
      const color = clusterColors.get(clusterId) || '#666';

      return {
        x: clusterData.map(d => d.xValue),
        y: clusterData.map(d => d.yValue),
        error_x: {
          type: 'data',
          array: clusterData.map(d => d.errorX),
          color: color
        },
        mode: 'markers',
        marker: {
          color: color,
          size: 10,
          line: { color: 'white', width: 1 }
        },
        type: 'scatter',
        name: `Cluster ${clusterId}`,
        legendgroup: `cluster-${clusterId}`
      };
    });
  }, [selectedData, clusterColors]);

  const layout = useMemo(() => ({
    title: 'Data by Cluster',
    xaxis: { title: 'X Value' },
    yaxis: { title: 'Y Value' },
    showlegend: true
  }), []);

  return (
    <Plot
      data={traces}
      layout={layout}
      config={{ responsive: true }}
      style={{ width: '100%', height: '600px' }}
    />
  );
}
```

---

## 11. Testing Reactive Charts

### Manual Testing Checklist

For each new chart, verify:

- [ ] **Click single point** → Row highlights in table
- [ ] **Cmd/Ctrl+Click multiple points** → Multiple rows selected
- [ ] **Click table row** → Chart point highlights
- [ ] **Double-click chart** → Selection clears
- [ ] **Click "Clear Selection"** → Chart returns to normal
- [ ] **Select All in table** → All chart points highlight
- [ ] **Invert Selection** → Chart highlighting inverts
- [ ] **Apply filter** → Chart shows only filtered data
- [ ] **Change dataset** → Chart remounts with new data
- [ ] **Hover point** → Tooltip shows correct info
- [ ] **Resize window** → Chart responds (responsive: true)
- [ ] **Zoom in/out** → Chart zooms correctly
- [ ] **Export as PNG** → Image captures current view

### Unit Testing (Example with Jest)

```typescript
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useReactiveState } from './useReactiveState';
import categoryResultsReducer from '../../store/slices/categoryResultsSlice';

describe('useReactiveState', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        categoryResults: categoryResultsReducer
      }
    });
  });

  it('should select category', () => {
    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useReactiveState('categoryId'), { wrapper });

    // Initially nothing selected
    expect(result.current.selectedIds.size).toBe(0);

    // Select category
    result.current.handleSelect('GO:0001', false, 'test');

    // Check selection
    expect(result.current.selectedIds.has('GO:0001')).toBe(true);
    expect(result.current.source).toBe('test');
  });

  it('should multi-select categories', () => {
    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useReactiveState('categoryId'), { wrapper });

    result.current.handleSelect('GO:0001', false, 'test');
    result.current.handleSelect('GO:0002', true, 'test');

    expect(result.current.selectedIds.size).toBe(2);
    expect(result.current.selectedIds.has('GO:0001')).toBe(true);
    expect(result.current.selectedIds.has('GO:0002')).toBe(true);
  });
});
```

### Integration Testing (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('chart selection syncs with table', async ({ page }) => {
  await page.goto('http://localhost:8080/category-results');

  // Click chart point
  await page.locator('#scatter-plot').click({ position: { x: 100, y: 100 } });

  // Verify table row is highlighted
  const highlightedRow = page.locator('.ant-table-row-selected');
  await expect(highlightedRow).toBeVisible();

  // Click table row
  await page.locator('.ant-table-row').first().click();

  // Verify chart point is highlighted (check for foreground trace)
  const foregroundTrace = page.locator('.scatterlayer .trace.scatter');
  await expect(foregroundTrace).toBeVisible();
});
```

---

## 12. Common Pitfalls

### Pitfall 1: Not Using useReactiveState

**Problem**:
```typescript
// ❌ Bad: Managing selection locally
const [selectedIds, setSelectedIds] = useState(new Set());
```

**Solution**:
```typescript
// ✅ Good: Use reactive state
const categoryState = useReactiveState('categoryId');
```

### Pitfall 2: Incorrect Dependencies in useMemo

**Problem**:
```typescript
// ❌ Bad: categoryState as dependency (object changes every call)
const traces = useMemo(() => {
  // ...
}, [data, categoryState]);
```

**Solution**:
```typescript
// ✅ Good: Use stable primitive/Set
const traces = useMemo(() => {
  // ...
}, [data, categoryState.selectedIds]);
```

### Pitfall 3: Forgetting customdata for Click Handling

**Problem**:
```typescript
// ❌ Bad: No way to identify clicked point
const trace = {
  x: data.map(d => d.x),
  y: data.map(d => d.y)
};

const handleClick = (event) => {
  // Can't determine which category was clicked!
};
```

**Solution**:
```typescript
// ✅ Good: Store ID in customdata
const trace = {
  x: data.map(d => d.x),
  y: data.map(d => d.y),
  customdata: data.map(d => d.categoryId)
};

const handleClick = (event) => {
  const categoryId = event.points[0].customdata;
};
```

### Pitfall 4: Recomputing Traces on Every Render

**Problem**:
```typescript
// ❌ Bad: Creates new traces every render
const traces = createTraces(data);

return <Plot data={traces} />;
```

**Solution**:
```typescript
// ✅ Good: Memoize traces
const traces = useMemo(() => createTraces(data), [data]);

return <Plot data={traces} />;
```

### Pitfall 5: Not Providing Unique Component Keys

**Problem**:
```typescript
// ❌ Bad: Component instance reused when data changes
<MyChart />
```

**Solution**:
```typescript
// ✅ Good: Force remount on data change
<MyChart key={`${projectId}-${resultName}`} />
```

### Pitfall 6: Inconsistent Cluster Colors

**Problem**:
```typescript
// ❌ Bad: Different colors per chart
const getColor = (cluster) => `#${Math.random().toString(16).slice(2, 8)}`;
```

**Solution**:
```typescript
// ✅ Good: Use shared color hook
const clusterColors = useClusterColors();
const color = clusterColors.get(cluster);
```

### Pitfall 7: Axes Rescaling on Selection

**Problem**:
```typescript
// ❌ Bad: Axes change when selection changes
const layout = {
  xaxis: { range: [Math.min(...selectedData.map(d => d.x)), ...] }
};
```

**Solution**:
```typescript
// ✅ Good: Fix axes to all data (or make rescaling intentional)
const axisRanges = useMemo(() => ({
  xMin: Math.min(...allData.map(d => d.x)),
  xMax: Math.max(...allData.map(d => d.x))
}), [allData]);  // Only depends on all data

const layout = {
  xaxis: { range: [axisRanges.xMin, axisRanges.xMax] }
};
```

### Pitfall 8: Missing Source Parameter

**Problem**:
```typescript
// ❌ Bad: No source tracking
categoryState.handleSelect(id, isMulti);  // Missing 3rd param
```

**Solution**:
```typescript
// ✅ Good: Always provide source
categoryState.handleSelect(id, isMulti, 'mychart');
```

**Why**: Source tracking helps with debugging ("Which component triggered this?") and can be used for priority logic.

### Pitfall 9: Not Handling Empty States

**Problem**:
```typescript
// ❌ Bad: Chart breaks when no data
const trace = {
  x: data.map(d => d.x),  // Fails if data is empty
  y: data.map(d => d.y)
};
```

**Solution**:
```typescript
// ✅ Good: Guard against empty data
if (data.length === 0) {
  return <Empty description="No data available" />;
}

const trace = {
  x: data.map(d => d.x),
  y: data.map(d => d.y)
};
```

### Pitfall 10: Over-Complicated Click Logic

**Problem**:
```typescript
// ❌ Bad: Manual click logic
const handleClick = (id, event) => {
  if (event.ctrlKey) {
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
    } else {
      selectedIds.add(id);
    }
  } else {
    selectedIds.clear();
    selectedIds.add(id);
  }
  setSelectedIds(new Set(selectedIds));
};
```

**Solution**:
```typescript
// ✅ Good: Let reactive state handle it
const handleClick = (id, event) => {
  const isMulti = event.ctrlKey || event.metaKey;
  categoryState.handleSelect(id, isMulti, 'chart');
};
```

---

## Quick Reference: Reactive Chart Checklist

When creating a new reactive chart, ensure:

- [ ] Uses `useReactiveState(type)` for selection
- [ ] Uses `useAppSelector` for data
- [ ] Uses `useClusterColors()` for consistent colors
- [ ] Implements two-layer rendering (background + foreground)
- [ ] Includes `customdata` in traces for click handling
- [ ] Memoizes `traces` with `useMemo`
- [ ] Memoizes `layout` with `useMemo`
- [ ] Uses `useCallback` for event handlers
- [ ] Provides `source` parameter in `handleSelect`
- [ ] Handles empty data gracefully
- [ ] Has unique `key` prop when rendered in parent
- [ ] Supports Cmd/Ctrl+Click for multi-select
- [ ] Clears selection on double-click
- [ ] Shows hover tooltips with useful info
- [ ] Configures Plotly with `responsive: true`
- [ ] Removes unnecessary toolbar buttons
- [ ] Uses consistent axis labels and titles
- [ ] Provides loading state if data is async
- [ ] Tests bidirectional sync with table
- [ ] Documents any non-standard patterns

---

## Conclusion

Reactive visualization components in BMDExpress-3 Web follow a consistent, well-tested architecture. By adhering to these patterns, new charts automatically integrate with the unified selection system, providing users with seamless cross-component interactions.

**Key Takeaways**:

1. **Always use `useReactiveState`** - Don't manage selection locally
2. **Two-layer rendering** - Show context + selection
3. **Consistent cluster colors** - Use `useClusterColors` hook
4. **Memoize everything** - Traces, layout, callbacks
5. **Include customdata** - For click handling
6. **Source tracking** - Always provide source parameter
7. **Test bidirectionally** - Chart ↔ Table synchronization

For implementation examples, see:
- `src/main/frontend/components/charts/UmapScatterPlot.tsx`
- `src/main/frontend/components/charts/BMDvsPValueScatter.tsx`
- `src/main/frontend/components/charts/BMDBoxPlot.tsx`

For more details on the reactive system, see **ENGINEERING_DESIGN_GUIDE.md**.
