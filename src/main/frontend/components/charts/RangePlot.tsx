/**
 * Range Plot Component
 *
 * Displays BMD with confidence intervals (BMDL-BMDU) for top 20 categories.
 * Each point shows the BMD median with error bars extending to BMDL and BMDU.
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 */

import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { Checkbox, Select, Space, Typography } from 'antd';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useBmdMetricTriple } from './hooks/useBmdMetric';
import { BmdStatSelector } from './BmdMetricSelector';
import { useClusterColors, getClusterIdForCategory, getClusterLabel } from './utils/clusterColors';
import { useChartAppearance } from './hooks/useChartAppearance';
import { hexToRgba } from './utils/displayModeStyles';
import { computeTopNRanked } from './utils/topNFilter';
import { wrapTextWithSuffix } from './utils/categoryLabelUtils';

const { Text } = Typography;

const TOP_N_OPTIONS = [10, 20, 50, 100, 200, 'All'] as const;

export default function RangePlot() {
  const { data, displayMode, getPointStyle } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const clusterColors = useClusterColors();
  const { applyToLayout, getConfig } = useChartAppearance();
  const hasSelection = categoryState.selectedIds.size > 0;
  const [topN, setTopN] = useState<number | 'All'>(20);
  const [useLogScale, setUseLogScale] = useState(true);

  // BMD metric selection (all three bases share the same stat)
  const { stat, setStat, bmd, bmdl, bmdu } = useBmdMetricTriple();

  // Filter to categories with valid BMD/BMDL/BMDU (required for range plot)
  const validData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(row => {
      const bmdVal = bmd.getValue(row);
      const bmdlVal = bmdl.getValue(row);
      const bmduVal = bmdu.getValue(row);
      return bmdVal != null && bmdlVal != null && bmduVal != null &&
             bmdVal > 0 && bmdlVal > 0 && bmduVal > 0;
    });
  }, [data, bmd, bmdl, bmdu]);

  // Compute Top N with BMD rank (display-mode aware)
  // Rank 1 = smallest BMD (most sensitive pathway)
  const topCategories = useMemo(() => {
    return computeTopNRanked(validData, displayMode, bmd.getValue, topN);
  }, [validData, displayMode, bmd, topN]);


  // Group categories by cluster with inFocus state
  // Use numeric y positions for Plotly (matching annotation positions)
  // topCategories is already filtered for isolate mode via getTopNSourceData
  const clusterData = useMemo(() => {
    const byCluster = new Map<number, Array<{
      categoryId: string;
      categoryName: string;
      yPosition: number;
      bmd: number;
      bmdl: number;
      bmdu: number;
      inFocus: boolean;
      bmdRank: number;
    }>>();

    topCategories.forEach((row, idx) => {
      const clusterId = getClusterIdForCategory(row.categoryId);
      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      const baseName = row.categoryDescription || row.categoryId || 'Unknown';

      byCluster.get(clusterId)!.push({
        categoryId: row.categoryId || '',
        categoryName: baseName,
        yPosition: idx, // Numeric position for Plotly (same as BMD rank - 1)
        bmd: bmd.getValue(row)!,
        bmdl: bmdl.getValue(row)!,
        bmdu: bmdu.getValue(row)!,
        inFocus: row.inFocus,
        bmdRank: row.bmdRank
      });
    });

    return byCluster;
  }, [topCategories, bmd, bmdl, bmdu]);

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

      if (items.length === 0) {
        return; // Skip empty cluster traces
      }

      // Per-point styling arrays - use RGBA colors with opacity embedded
      const markerColors: string[] = [];
      const markerSizes: number[] = [];
      const markerLineWidths: number[] = [];
      const markerLineColors: string[] = [];
      const errorBarColors: string[] = [];

      items.forEach(item => {
        const isSelected = categoryState.selectedIds.has(item.categoryId);
        const focusStyle = getPointStyle(item.inFocus, baseColor);

        // Styling priority: selection > focus
        if (isSelected && hasSelection) {
          // Selected: full opacity with white border
          markerColors.push(baseColor);
          markerSizes.push(12);
          markerLineWidths.push(2);
          markerLineColors.push('white');
          errorBarColors.push(baseColor);
        } else if (hasSelection) {
          // Not selected but something is: dim this point
          markerColors.push(hexToRgba(baseColor, 0.2));
          markerSizes.push(focusStyle.size);
          markerLineWidths.push(0);
          markerLineColors.push('white');
          errorBarColors.push(hexToRgba(baseColor, 0.2));
        } else {
          // No selection at all: use focus-based styling
          markerColors.push(hexToRgba(baseColor, focusStyle.opacity));
          markerSizes.push(focusStyle.size);
          markerLineWidths.push(focusStyle.lineWidth);
          markerLineColors.push(focusStyle.lineColor);
          errorBarColors.push(hexToRgba(baseColor, focusStyle.opacity));
        }
      });

      // Calculate error bar extents
      const errorMinus = items.map(item => item.bmd - item.bmdl);
      const errorPlus = items.map(item => item.bmdu - item.bmd);

      // Create individual traces per point to support per-point error bar colors
      items.forEach((item, idx) => {
        traces.push({
          type: 'scatter',
          mode: 'markers',
          x: [item.bmd],
          y: [item.yPosition], // Use numeric y position
          error_x: {
            type: 'data',
            symmetric: false,
            array: [errorPlus[idx]],
            arrayminus: [errorMinus[idx]],
            thickness: 2,
            width: 4,
            color: errorBarColors[idx],
          },
          marker: {
            color: markerColors[idx],
            size: markerSizes[idx],
            symbol: 'circle',
            line: {
              color: markerLineColors[idx],
              width: markerLineWidths[idx],
            },
          },
          name: getClusterLabel(clusterId),
          hovertemplate:
            `<b>${item.categoryName}</b><br>` +
            `${getClusterLabel(clusterId)}<br>` +
            `BMD Rank: #${item.bmdRank}<br>` +
            `${bmd.label}: %{x:.4f}<br>` +
            `${bmdl.label}: ${item.bmdl.toFixed(4)}<br>` +
            `${bmdu.label}: ${item.bmdu.toFixed(4)}<br>` +
            '<extra></extra>',
          showlegend: false,
        });
      });
    });

    return traces;
  }, [clusterData, clusterColors, categoryState.selectedIds, hasSelection, displayMode, getPointStyle, bmd.label, bmdl.label, bmdu.label]);

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

  // Calculate height based on visible categories - more vertical space for word-wrapped labels
  const visibleCount = topCategories.length;
  const rowHeight = 50; // Increased from 22 to accommodate word-wrapped labels
  const plotHeight = Math.max(300, visibleCount * rowHeight + 140);

  const titleText = topN === 'All'
    ? `Range Plot: ${bmd.label} with Confidence Intervals (All Pathways)`
    : `Range Plot: ${bmd.label} with Confidence Intervals (Top ${topN} Pathways)`;

  // Create annotations for y-axis labels with word wrapping (like ViolinPlotPerCategory)
  const yAxisAnnotations = topCategories.map((row, idx) => {
    const baseName = row.categoryDescription || row.categoryId || 'Unknown';
    const suffix = `(BMD Rank: ${row.bmdRank})`;
    return {
      x: 0,
      y: idx,
      xref: 'paper' as const,
      yref: 'y' as const,
      text: wrapTextWithSuffix(baseName, suffix, 35),
      showarrow: false,
      xanchor: 'center' as const,
      yanchor: 'middle' as const,
      align: 'center' as const,
      font: { size: 11 },
      xshift: -140, // Center in the margin area
    };
  });

  const layout: any = applyToLayout({
    title: {
      text: titleText,
      font: { size: 14 },
    },
    xaxis: {
      title: { text: bmd.label },
      type: useLogScale ? 'log' : 'linear',
      autorange: true,
      showline: true,
      linecolor: '#000',
      linewidth: 1,
    },
    yaxis: {
      title: '',
      showticklabels: false,
      ticklen: 0,
      range: [visibleCount - 0.5, -0.5],
      zeroline: false,
      showline: false,
    },
    annotations: yAxisAnnotations,
    height: plotHeight,
    margin: { l: 280, r: 50, t: 80, b: 60 },
    hovermode: 'closest',
    showlegend: false,
  });

  return (
    <div style={{ width: '100%' }}>
      {/* Controls */}
      <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <Space>
          <Text>BMD Statistic:</Text>
          <BmdStatSelector stat={stat} onStatChange={setStat} />
        </Space>
        <Checkbox checked={useLogScale} onChange={(e) => setUseLogScale(e.target.checked)}>
          Log₁₀ Scale
        </Checkbox>
        <Space>
          <Text>Show:</Text>
          <Select
            value={topN}
            onChange={setTopN}
            style={{ width: 100 }}
            size="small"
            options={TOP_N_OPTIONS.map(opt => ({
              value: opt,
              label: opt === 'All' ? 'All' : `Top ${opt}`,
            }))}
          />
        </Space>
      </div>
      <Plot
        data={plotData}
        layout={layout}
        config={getConfig('range_plot')}
        style={{ width: '100%', height: plotHeight }}
        useResizeHandler={true}
      />
    </div>
  );
}
