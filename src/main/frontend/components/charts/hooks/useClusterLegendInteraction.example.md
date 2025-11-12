# useClusterLegendInteraction Hook - Usage Examples

This hook provides plug-and-play cluster-based legend interaction for any Plotly chart that uses cluster-grouped data.

## Basic Usage

```tsx
import { useClusterLegendInteraction, getClusterMarkerStyle } from './hooks/useClusterLegendInteraction';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';

export default function MyClusterChart() {
  const data = useSelector(selectFilteredData);
  const clusterColors = useClusterColors();
  const categoryState = useReactiveState('categoryId');

  // 1. Create base traces grouped by cluster
  const baseTraces = useMemo(() => {
    const traces: any[] = [];
    // Group your data by cluster...
    // Create one trace per cluster...
    return traces;
  }, [data]);

  // 2. Set up cluster legend interaction
  const { handleLegendClick, nonSelectedDisplayMode, hasSelection } = useClusterLegendInteraction({
    traces: baseTraces,
    categoryState,
    allData: data,
    getClusterIdFromCategory: (row) => getClusterIdForCategory(row.categoryId),
    getCategoryId: (row) => row.categoryId,
    sourceName: 'MyClusterChart',
  });

  // 3. Apply reactive styling to traces
  const traces = useMemo(() => {
    return baseTraces.map((trace, index) => {
      const clusterId = /* extract from trace */;
      const isClusterSelected = /* check if any category in cluster is selected */;

      const markerStyle = getClusterMarkerStyle(
        clusterId,
        clusterColors[clusterId],
        isClusterSelected,
        hasSelection,
        nonSelectedDisplayMode
      );

      return {
        ...trace,
        marker: {
          ...trace.marker,
          color: markerStyle.color,
          opacity: markerStyle.opacity,
          line: {
            color: markerStyle.lineColor,
            width: markerStyle.lineWidth,
          }
        }
      };
    });
  }, [baseTraces, hasSelection, categoryState.selectedIds, nonSelectedDisplayMode]);

  // 4. Pass handleLegendClick to Plot
  return (
    <Plot
      data={traces}
      onLegendClick={handleLegendClick}
      ...
    />
  );
}
```

## Advanced: Custom Special Legend Handlers

For charts with special legend items (like UMAP's "Reference Space" or Accumulation's "Outliers"):

```tsx
const [refSpaceVisibility, setRefSpaceVisibility] = useState<'full' | 'dimmed' | 'hidden'>('full');

const { handleLegendClick } = useClusterLegendInteraction({
  traces: baseTraces,
  categoryState,
  allData: data,
  getClusterIdFromCategory: (row) => getClusterIdForCategory(row.categoryId),
  getCategoryId: (row) => row.categoryId,
  sourceName: 'MyChart',
  specialLegendHandlers: {
    'Reference Space': () => {
      setRefSpaceVisibility(current => {
        if (current === 'full') return 'dimmed';
        if (current === 'dimmed') return 'hidden';
        return 'full';
      });
      return false; // Prevent default legend toggle
    },
  },
});
```

## Complete Example: Histogram with Cluster Coloring

```tsx
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Plot from 'react-plotly.js';
import { selectFilteredData } from '../../store/slices/categoryResultsSlice';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterLegendInteraction, getClusterMarkerStyle } from './hooks/useClusterLegendInteraction';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';

export default function ClusteredHistogram() {
  const data = useSelector(selectFilteredData);
  const clusterColors = useClusterColors();
  const categoryState = useReactiveState('categoryId');

  // Group data by cluster
  const clusterData = useMemo(() => {
    const byCluster = new Map<number, number[]>();

    data.forEach(row => {
      const clusterId = getClusterIdForCategory(row.categoryId);
      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push(row.bmdMedian || 0);
    });

    return byCluster;
  }, [data]);

  // Create base traces
  const baseTraces = useMemo(() => {
    return Array.from(clusterData.entries()).map(([clusterId, values]) => ({
      x: values,
      type: 'histogram',
      name: getClusterLabel(clusterId),
      showlegend: true,
      legendgroup: `cluster_${clusterId}`,
    }));
  }, [clusterData]);

  // Set up interaction
  const { handleLegendClick, nonSelectedDisplayMode, hasSelection } = useClusterLegendInteraction({
    traces: baseTraces,
    categoryState,
    allData: data,
    getClusterIdFromCategory: (row) => getClusterIdForCategory(row.categoryId),
    getCategoryId: (row) => row.categoryId,
    sourceName: 'ClusteredHistogram',
  });

  // Apply reactive styling
  const traces = useMemo(() => {
    const clusterIds = Array.from(clusterData.keys());

    return baseTraces.map((trace, index) => {
      const clusterId = clusterIds[index];
      const categoriesInCluster = data
        .filter(row => getClusterIdForCategory(row.categoryId) === clusterId)
        .map(row => row.categoryId!);

      const isClusterSelected = hasSelection &&
        categoriesInCluster.some(catId => categoryState.isSelected(catId));

      const markerStyle = getClusterMarkerStyle(
        clusterId,
        clusterColors[clusterId] || '#999',
        isClusterSelected,
        hasSelection,
        nonSelectedDisplayMode
      );

      return {
        ...trace,
        marker: {
          color: markerStyle.color,
          opacity: markerStyle.opacity,
          line: {
            color: markerStyle.lineColor,
            width: markerStyle.lineWidth,
          }
        }
      };
    });
  }, [baseTraces, clusterData, data, hasSelection, categoryState.selectedIds, nonSelectedDisplayMode, clusterColors]);

  return (
    <Plot
      data={traces}
      layout={{
        title: 'BMD Median Distribution by Cluster',
        barmode: 'overlay',
        showlegend: true,
      }}
      onLegendClick={handleLegendClick}
      config={{ displayModeBar: true }}
      useResizeHandler={true}
    />
  );
}
```

## Behavior

### Legend Click Interactions:

1. **First Click (cluster not selected):**
   - Selects all categories in that cluster
   - Non-selected clusters switch to "outline" mode (transparent fill, colored border)
   - Hold Cmd/Ctrl to add to existing selection

2. **Second Click (cluster selected):**
   - Non-selected clusters switch to "hidden" mode (opacity 0)

3. **Third Click (cluster selected, others hidden):**
   - Deselects the cluster
   - All clusters return to normal visibility
   - Hold Cmd/Ctrl to remove only this cluster from selection

### Display Modes:

- **Full:** Normal appearance (default when nothing selected)
- **Outline:** Transparent fill with colored border (shows structure)
- **Hidden:** Opacity 0 (completely invisible, but legend remains clickable)

## Benefits

- **DRY:** Write legend interaction logic once, use everywhere
- **Consistent UX:** Same behavior across all cluster-based visualizations
- **Type-safe:** Full TypeScript support with generics
- **Flexible:** Works with any data structure via config functions
- **Extensible:** Support for custom special legend handlers
- **Synchronizes:** Integrates with reactive state infrastructure
