/**
 * Bubble Chart Component
 *
 * Displays a scatter plot with BMD vs Fisher P-Value where bubble size represents
 * the percentage of genes in each category. Each point is one category.
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 */

import React, { useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterColors, getClusterIdForCategory, getClusterLabel } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function BubbleChart() {
  const { data, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const clusterColors = useClusterColors();
  const hasSelection = categoryState.selectedIds.size > 0;

  // Group data by cluster with inFocus state
  const bubbleData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const byCluster = new Map<number, Array<{
      x: number;
      y: number;
      size: number;
      categoryId: string;
      categoryName: string;
      inFocus: boolean;
    }>>();

    data.forEach(row => {
      if (row.bmdMedian == null || row.bmdMedian <= 0) return;
      if (row.fishersExactTwoTailPValue == null || row.fishersExactTwoTailPValue <= 0) return;
      if (row.percentage == null || row.percentage <= 0) return;

      const clusterId = getClusterIdForCategory(row.categoryId);
      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }

      byCluster.get(clusterId)!.push({
        x: row.bmdMedian,
        y: -Math.log10(row.fishersExactTwoTailPValue),
        size: row.percentage,
        categoryId: row.categoryId || '',
        categoryName: row.categoryDescription || row.categoryId || 'Unknown',
        inFocus: row.inFocus
      });
    });

    return byCluster;
  }, [data]);

  // Calculate max percentage for bubble size scaling
  const maxPercentage = useMemo(() => {
    if (!bubbleData) return 1;
    let max = 0;
    bubbleData.forEach(items => {
      items.forEach(item => {
        if (item.size > max) max = item.size;
      });
    });
    return max || 1;
  }, [bubbleData]);

  // Create traces with inFocus-based per-point styling
  const plotData = useMemo(() => {
    if (!bubbleData) return [];

    const traces: any[] = [];

    // Sort clusters (outliers last)
    const sortedClusters = Array.from(bubbleData.keys()).sort((a, b) => {
      if (a === -1) return 1;
      if (b === -1) return -1;
      return a - b;
    });

    sortedClusters.forEach(clusterId => {
      const items = bubbleData.get(clusterId)!;
      const baseColor = clusterColors[clusterId] || '#999999';

      // Filter points based on displayMode (isolate mode hides out-of-focus)
      const visibleItems = items.filter(item => !shouldHidePoint(item.inFocus));

      if (visibleItems.length === 0) {
        return; // Skip empty cluster traces
      }

      // Per-point styling arrays
      const markerColors: string[] = [];
      const markerOpacities: number[] = [];
      const markerLineWidths: number[] = [];
      const markerLineColors: string[] = [];

      // Calculate bubble sizes (scaled by percentage)
      const bubbleSizes = visibleItems.map(item => {
        // Scale bubble size: min 8, max 40
        const scaledSize = 8 + (item.size / maxPercentage) * 32;
        return scaledSize;
      });

      visibleItems.forEach(item => {
        const isSelected = categoryState.selectedIds.has(item.categoryId);
        const style = getPointStyle(item.inFocus, baseColor);

        if (isSelected && hasSelection) {
          markerColors.push(style.color);
          markerOpacities.push(1.0);
          markerLineWidths.push(2);
          markerLineColors.push('white');
        } else {
          markerColors.push(style.color);
          markerOpacities.push(style.opacity);
          markerLineWidths.push(style.lineWidth);
          markerLineColors.push(style.lineColor);
        }
      });

      traces.push({
        type: 'scatter',
        mode: 'markers',
        x: visibleItems.map(item => item.x),
        y: visibleItems.map(item => item.y),
        customdata: visibleItems.map(item => item.categoryId),
        text: visibleItems.map(item => item.categoryName),
        marker: {
          size: bubbleSizes,
          sizemode: 'diameter',
          color: markerColors,
          opacity: markerOpacities,
          line: {
            color: markerLineColors,
            width: markerLineWidths,
          },
        },
        name: getClusterLabel(clusterId),
        hovertemplate:
          '<b>%{text}</b><br>' +
          `${getClusterLabel(clusterId)}<br>` +
          'BMD: %{x:.4f}<br>' +
          '-log10(p-value): %{y:.2f}<br>' +
          'Percentage: %{marker.size:.1f}%<br>' +
          '<extra></extra>',
        showlegend: false,
      });
    });

    return traces;
  }, [bubbleData, clusterColors, maxPercentage, categoryState.selectedIds, hasSelection, displayMode, getPointStyle, shouldHidePoint]);

  const handlePlotClick = useCallback((event: any) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const categoryId = point.customdata;

      if (categoryId) {
        if (event.event?.ctrlKey || event.event?.metaKey) {
          categoryState.handleSelect(categoryId, true, 'chart');
        } else {
          categoryState.handleMultiSelect([categoryId], 'chart');
        }
      }
    }
  }, [categoryState]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for Bubble Chart
      </div>
    );
  }

  if (plotData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid data available for Bubble Chart
      </div>
    );
  }

  const layout: any = {
    title: {
      text: 'Bubble Chart: BMD vs Fisher P-Value (size = % genes)',
      font: { size: 16 },
    },
    xaxis: {
      title: { text: 'BMD Median' },
      type: 'log',
      autorange: true,
      gridcolor: DEFAULT_GRID_COLOR,
    },
    yaxis: {
      title: { text: '-log10(Fisher Two-Tail P-Value)' },
      autorange: true,
      gridcolor: DEFAULT_GRID_COLOR,
    },
    height: 600,
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
        onClick={handlePlotClick}
      />
    </div>
  );
}
