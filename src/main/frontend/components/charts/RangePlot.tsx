/**
 * Range Plot Component
 *
 * Displays BMD with confidence intervals (BMDL-BMDU) for top 20 categories.
 * Each point shows the BMD median with error bars extending to BMDL and BMDU.
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 */

import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterColors, getClusterIdForCategory, getClusterLabel } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function RangePlot() {
  const { data, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const clusterColors = useClusterColors();
  const hasSelection = categoryState.selectedIds.size > 0;

  // Filter and sort top 20 categories by p-value
  const topCategories = useMemo(() => {
    if (!data || data.length === 0) return [];

    const validData = data.filter(row =>
      row.bmdMedian != null &&
      row.bmdlMedian != null &&
      row.bmduMedian != null &&
      row.bmdMedian > 0 &&
      row.bmdlMedian > 0 &&
      row.bmduMedian > 0
    );

    return validData
      .sort((a, b) => {
        const pA = a.fishersExactTwoTailPValue ?? 1;
        const pB = b.fishersExactTwoTailPValue ?? 1;
        return pA - pB;
      })
      .slice(0, 20);
  }, [data]);

  // Group categories by cluster with inFocus state
  const clusterData = useMemo(() => {
    const byCluster = new Map<number, Array<{
      categoryId: string;
      categoryName: string;
      bmd: number;
      bmdl: number;
      bmdu: number;
      inFocus: boolean;
    }>>();

    topCategories.forEach(row => {
      const clusterId = getClusterIdForCategory(row.categoryId);
      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push({
        categoryId: row.categoryId || '',
        categoryName: row.categoryDescription || row.categoryId || 'Unknown',
        bmd: row.bmdMedian!,
        bmdl: row.bmdlMedian!,
        bmdu: row.bmduMedian!,
        inFocus: row.inFocus
      });
    });

    return byCluster;
  }, [topCategories]);

  // Create traces with inFocus-based per-point styling
  const plotData = useMemo(() => {
    const traces: any[] = [];

    // Sort clusters (outliers last)
    const sortedClusters = Array.from(clusterData.keys()).sort((a, b) => {
      if (a === -1) return 1;
      if (b === -1) return -1;
      return a - b;
    });

    sortedClusters.forEach(clusterId => {
      const items = clusterData.get(clusterId)!;
      const baseColor = clusterColors[clusterId] || '#999999';

      // Filter points based on displayMode (isolate mode hides out-of-focus)
      const visibleItems = items.filter(item => !shouldHidePoint(item.inFocus));

      if (visibleItems.length === 0) {
        return; // Skip empty cluster traces
      }

      // Per-point styling arrays
      const markerColors: string[] = [];
      const markerSizes: number[] = [];
      const markerOpacities: number[] = [];
      const markerLineWidths: number[] = [];
      const markerLineColors: string[] = [];

      visibleItems.forEach(item => {
        const isSelected = categoryState.selectedIds.has(item.categoryId);
        const style = getPointStyle(item.inFocus, baseColor);

        if (isSelected && hasSelection) {
          markerColors.push(style.color);
          markerSizes.push(12);
          markerOpacities.push(1.0);
          markerLineWidths.push(2);
          markerLineColors.push('white');
        } else {
          markerColors.push(style.color);
          markerSizes.push(style.size);
          markerOpacities.push(style.opacity);
          markerLineWidths.push(style.lineWidth);
          markerLineColors.push(style.lineColor);
        }
      });

      // Calculate error bar extents
      const errorMinus = visibleItems.map(item => item.bmd - item.bmdl);
      const errorPlus = visibleItems.map(item => item.bmdu - item.bmd);

      traces.push({
        type: 'scatter',
        mode: 'markers',
        x: visibleItems.map(item => item.bmd),
        y: visibleItems.map(item => item.categoryName),
        error_x: {
          type: 'data',
          symmetric: false,
          array: errorPlus,
          arrayminus: errorMinus,
          thickness: 2,
          width: 4,
          color: baseColor, // Use cluster color for error bars
        },
        marker: {
          color: markerColors,
          size: markerSizes,
          symbol: 'circle',
          opacity: markerOpacities,
          line: {
            color: markerLineColors,
            width: markerLineWidths,
          },
        },
        name: getClusterLabel(clusterId),
        hovertemplate:
          '<b>%{y}</b><br>' +
          `${getClusterLabel(clusterId)}<br>` +
          'BMD: %{x:.4f}<br>' +
          'BMDL: %{customdata[0]:.4f}<br>' +
          'BMDU: %{customdata[1]:.4f}<br>' +
          '<extra></extra>',
        customdata: visibleItems.map(item => [item.bmdl, item.bmdu]),
        showlegend: false,
      });
    });

    return traces;
  }, [clusterData, clusterColors, categoryState.selectedIds, hasSelection, displayMode, getPointStyle, shouldHidePoint]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for Range Plot
      </div>
    );
  }

  if (plotData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid BMD/BMDL/BMDU data available
      </div>
    );
  }

  // Calculate height based on number of items
  const totalItems = Array.from(clusterData.values()).reduce((sum, items) => sum + items.length, 0);
  const plotHeight = Math.max(500, totalItems * 25);

  const layout: any = {
    title: {
      text: 'Range Plot: BMD with Confidence Intervals (Top 20 Pathways)',
      font: { size: 16 },
    },
    xaxis: {
      title: { text: 'BMD Value' },
      type: 'log',
      autorange: true,
      gridcolor: DEFAULT_GRID_COLOR,
    },
    yaxis: {
      title: { text: 'Pathway/Category' },
      autorange: 'reversed', // Most significant at top
      gridcolor: DEFAULT_GRID_COLOR,
      tickfont: { size: 10 },
    },
    height: plotHeight,
    margin: { l: 300, r: 50, t: 80, b: 80 },
    hovermode: 'closest',
    ...DEFAULT_LAYOUT_STYLES,
    showlegend: false,
  };

  return (
    <div style={{ width: '100%' }}>
      <Plot
        data={plotData}
        layout={layout}
        config={createPlotlyConfig()}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
}
