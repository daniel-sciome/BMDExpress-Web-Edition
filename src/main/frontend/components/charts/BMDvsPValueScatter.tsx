import React, { useMemo, useCallback, useState } from 'react';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import { selectChartData } from '../../store/slices/categoryResultsSlice';
import { useReactiveState } from 'Frontend/components/charts/hooks/useReactiveState';
import { useClusterLegendInteraction, getClusterMarkerStyle } from './hooks/useClusterLegendInteraction';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { createPlotlyConfigWithExport, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function BMDvsPValueScatter() {
  // Use reactive state hook to sync with UMAP
  const categoryState = useReactiveState('categoryId');
  const data = useSelector(selectChartData);

  // Background visibility state: 'full' -> 'dimmed' -> 'hidden' -> 'full'
  const [backdropVisibility, setBackdropVisibility] = useState<'full' | 'dimmed' | 'hidden'>('full');

  // Get cluster colors using shared utility
  const clusterColors = useClusterColors();

  // Prepare data for plotting
  const xData = data.map(row => row.bmdMean || 0);
  const yData = data.map(row => {
    const pValue = row.fishersExactTwoTailPValue;
    if (pValue === undefined || pValue === null || pValue === 0) return 0;
    return -Math.log10(pValue);
  });
  const textData = data.map(row => row.categoryDescription || row.categoryId || 'Unknown');
  const categoryIds = data.map(row => row.categoryId || '');

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

  // Group data by cluster for base traces
  const clusterData = useMemo(() => {
    const byCluster = new Map<string | number, Array<{
      index: number;
      categoryId: string;
    }>>();

    data.forEach((row, idx) => {
      const clusterId = getClusterIdForCategory(row.categoryId);
      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push({
        index: idx,
        categoryId: row.categoryId || '',
      });
    });

    return byCluster;
  }, [data]);

  // Create base traces (without reactive styling)
  const baseTraces = useMemo(() => {
    const result: any[] = [];

    // Layer 1: Backdrop - ALL points in gray (like UMAP Reference Space)
    result.push({
      x: xData,
      y: yData,
      text: textData,
      mode: 'markers',
      type: 'scatter',
      name: 'Background',
      marker: {}, // Filled in later with reactive styling
      hovertemplate: '<b>%{text}</b><br>BMD Mean: %{x:.4f}<br>-log10(p): %{y:.4f}<extra></extra>',
      showlegend: true,
    });

    // Layer 2: Cluster traces (base structure)
    clusterData.forEach((items, clusterId) => {
      result.push({
        x: items.map(item => xData[item.index]),
        y: items.map(item => yData[item.index]),
        text: items.map(item => textData[item.index]),
        customdata: items.map(item => categoryIds[item.index]),
        type: 'scatter',
        mode: 'markers',
        marker: {}, // Filled in later with reactive styling
        hovertemplate: `<b>%{text}</b><br>${getClusterLabel(clusterId)}<br>BMD Mean: %{x:.4f}<br>-log10(p): %{y:.4f}<extra></extra>`,
        name: getClusterLabel(clusterId),
        showlegend: true,
        legendgroup: `cluster_${clusterId}`,
      });
    });

    return result;
  }, [data, xData, yData, textData, categoryIds, clusterData]);

  // Set up cluster legend interaction with special handler for Background
  const { handleLegendClick, nonSelectedDisplayMode, hasSelection } = useClusterLegendInteraction({
    traces: baseTraces,
    categoryState,
    allData: data,
    getClusterIdFromCategory: (row) => getClusterIdForCategory(row.categoryId),
    getCategoryId: (row) => row.categoryId,
    sourceName: 'BMDvsPValueScatter',
    specialLegendHandlers: {
      'Background': () => {
        setBackdropVisibility(current => {
          if (current === 'full') {
            console.log('[BMDvsPValueScatter] Background: full -> dimmed');
            return 'dimmed';
          } else if (current === 'dimmed') {
            console.log('[BMDvsPValueScatter] Background: dimmed -> hidden');
            return 'hidden';
          } else {
            console.log('[BMDvsPValueScatter] Background: hidden -> full');
            return 'full';
          }
        });
        return false; // Prevent default legend toggle
      },
    },
  });

  // Apply reactive styling to traces
  const traces = useMemo(() => {
    const result: any[] = [];

    // Apply backdrop styling
    const backdropOpacity = backdropVisibility === 'full' ? 0.4 : backdropVisibility === 'dimmed' ? 0.1 : 0;
    const isBackdropHidden = backdropVisibility !== 'full';

    result.push({
      ...baseTraces[0],
      marker: {
        size: 3,
        color: isBackdropHidden ? 'rgba(0,0,0,0)' : '#666666',
        opacity: backdropOpacity,
        line: {
          width: isBackdropHidden ? 1 : 0,
          color: '#666666'
        },
      },
    });

    // Apply cluster styling using getClusterMarkerStyle
    const sortedClusters = Array.from(clusterData.keys()).sort((a, b) => {
      if (a === -1) return 1;
      if (b === -1) return -1;
      return Number(a) - Number(b);
    });

    sortedClusters.forEach((clusterId, index) => {
      const items = clusterData.get(clusterId)!;
      const baseColor = clusterColors[clusterId] || '#999999';

      // Check if ANY category from this cluster is selected
      const isClusterSelected = hasSelection && items.some(item => categoryState.isSelected(item.categoryId));

      // Get reactive marker styling
      const markerStyle = getClusterMarkerStyle(
        clusterId,
        baseColor,
        isClusterSelected,
        hasSelection,
        nonSelectedDisplayMode
      );

      result.push({
        ...baseTraces[index + 1], // +1 because Background is at index 0
        marker: {
          color: markerStyle.color,
          size: 8,
          opacity: markerStyle.opacity,
          line: {
            color: markerStyle.lineColor,
            width: markerStyle.lineWidth || 1,
          },
        },
      });
    });

    return result;
  }, [baseTraces, clusterData, clusterColors, hasSelection, categoryState.selectedIds, nonSelectedDisplayMode, backdropVisibility]);

  const handlePlotClick = useCallback((event: any) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const categoryId = point.customdata;

      if (categoryId) {
        // Check if Ctrl/Cmd key is pressed for multi-select
        if (event.event?.ctrlKey || event.event?.metaKey) {
          categoryState.handleSelect(categoryId, true, 'chart');
        } else {
          // Single select - replace selection
          categoryState.handleMultiSelect([categoryId], 'chart');
        }
      }
    }
  }, [categoryState]);

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Plot
        data={traces}
        layout={{
          title: 'BMD vs Fisher Exact P-Value (Colored by Cluster)',
          xaxis: {
            title: 'BMD Mean',
            type: 'log',
            range: xRange, // Fixed range based on all data
            gridcolor: DEFAULT_GRID_COLOR,
          },
          yaxis: {
            title: '-log10(Fisher Exact P-Value)',
            range: yRange, // Fixed range based on all data
            gridcolor: DEFAULT_GRID_COLOR,
          },
          hovermode: 'closest',
          ...DEFAULT_LAYOUT_STYLES,
          margin: { l: 60, r: 30, t: 50, b: 60 },
          showlegend: true, // Always show legend for visibility toggle
          legend: {
            x: 1.02,
            y: 1,
            xanchor: 'left',
            yanchor: 'top',
          },
        } as any}
        config={createPlotlyConfigWithExport('bmd_vs_pvalue_scatter')}
        onClick={handlePlotClick}
        onLegendClick={handleLegendClick}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
