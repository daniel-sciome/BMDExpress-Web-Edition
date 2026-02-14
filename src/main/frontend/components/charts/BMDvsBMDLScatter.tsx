/**
 * BMD vs BMDL Scatter Plot Component
 *
 * Displays a scatter plot comparing BMD (Benchmark Dose) vs BMDL (Lower Confidence Limit)
 * values at the category level. Each point represents one category's aggregated statistics.
 *
 * This visualization helps identify:
 * - Correlation between BMD and BMDL values
 * - Categories with large uncertainty (wide BMD-BMDL intervals)
 * - Overall distribution patterns of dose-response estimates
 *
 * CATEGORY-LEVEL: Each point = one category's median/mean values
 * Uses inFocus-based display mode styling (highlight/dim/isolate)
 */

import React, { useMemo, useState } from 'react';
import { Checkbox, Space, Typography } from 'antd';
import Plot from 'react-plotly.js';
import { useReactiveState } from './hooks/useReactiveState';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useBmdMetricPair } from './hooks/useBmdMetric';
import { BmdStatSelector } from './BmdMetricSelector';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { useChartAppearance } from './hooks/useChartAppearance';

const { Text } = Typography;

export default function BMDvsBMDLScatter({ chartId }: { chartId?: string }) {
  // Get ALL data with inFocus state using shared hook
  const { data, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();
  const { applyToLayout, getConfig } = useChartAppearance(chartId);
  const clusterColors = useClusterColors();
  const categoryState = useReactiveState('categoryId');
  const [useLogX, setUseLogX] = useState(true);
  const [useLogY, setUseLogY] = useState(true);

  // BMD vs BMDL paired metric selection (same stat for both axes)
  const { stat, setStat, metric1: bmdMetric, metric2: bmdlMetric } = useBmdMetricPair('bmd', 'bmdl');

  const hasSelection = categoryState.selectedIds.size > 0;

  // Extract scatter plot data grouped by cluster, including inFocus state
  const scatterData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Group data by cluster
    const byCluster = new Map<number, Array<{
      x: number;
      y: number;
      categoryId: string;
      categoryName: string;
      inFocus: boolean;
    }>>();

    data.forEach(row => {
      // Get X (BMD) and Y (BMDL) values using the selected metric
      const xValue = bmdMetric.getValue(row);
      const yValue = bmdlMetric.getValue(row);

      // Only include valid positive values
      if (xValue !== undefined && yValue !== undefined &&
          xValue > 0 && yValue > 0 &&
          !isNaN(xValue) && !isNaN(yValue) &&
          isFinite(xValue) && isFinite(yValue)) {

        const clusterId = getClusterIdForCategory(row.categoryId);
        if (!byCluster.has(clusterId)) {
          byCluster.set(clusterId, []);
        }

        byCluster.get(clusterId)!.push({
          x: xValue,
          y: yValue,
          categoryId: row.categoryId || '',
          categoryName: row.categoryDescription || row.categoryId || 'Unknown',
          inFocus: row.inFocus
        });
      }
    });

    return byCluster;
  }, [data, bmdMetric, bmdlMetric]);

  // Get label from the stat (e.g., "Median", "Mean", "5th Percentile")
  const statLabel = stat.charAt(0).toUpperCase() + stat.slice(1).replace(/([A-Z])/g, ' $1');

  // Create traces with inFocus-based per-point styling
  // Must be called before early return to satisfy React hooks rules
  const traces = useMemo(() => {
    if (!scatterData || scatterData.size === 0) return [];

    const result: any[] = [];

    // Sort clusters (outliers last)
    const sortedClusters = Array.from(scatterData.keys()).sort((a, b) => {
      if (a === -1) return 1;
      if (b === -1) return -1;
      return a - b;
    });

    sortedClusters.forEach(clusterId => {
      const points = scatterData.get(clusterId)!;
      const baseColor = clusterColors[clusterId] || '#999999';

      // Filter points based on displayMode (isolate mode hides out-of-focus)
      const visiblePoints = points.filter(p => !shouldHidePoint(p.inFocus));

      if (visiblePoints.length === 0) {
        return; // Skip empty cluster traces
      }

      // Per-point styling arrays based on inFocus state
      const markerColors: string[] = [];
      const markerSizes: number[] = [];
      const markerOpacities: number[] = [];
      const markerLineWidths: number[] = [];
      const markerLineColors: string[] = [];

      visiblePoints.forEach(point => {
        const isSelected = categoryState.selectedIds.has(point.categoryId);
        const focusStyle = getPointStyle(point.inFocus, baseColor);

        // Styling priority: selection > focus
        if (isSelected && hasSelection) {
          // Selected: larger, full opacity, white border
          markerColors.push(focusStyle.color);
          markerSizes.push(12);
          markerOpacities.push(1.0);
          markerLineWidths.push(2);
          markerLineColors.push('white');
        } else if (hasSelection) {
          // Not selected but something is: dim this point
          markerColors.push(focusStyle.color);
          markerSizes.push(focusStyle.size);
          markerOpacities.push(0.2);
          markerLineWidths.push(0);
          markerLineColors.push('white');
        } else {
          // No selection at all: use focus-based styling
          markerColors.push(focusStyle.color);
          markerSizes.push(focusStyle.size);
          markerOpacities.push(focusStyle.opacity);
          markerLineWidths.push(focusStyle.lineWidth);
          markerLineColors.push(focusStyle.lineColor);
        }
      });

      result.push({
        x: visiblePoints.map(p => p.x),
        y: visiblePoints.map(p => p.y),
        type: 'scatter',
        mode: 'markers',
        name: getClusterLabel(clusterId),
        marker: {
          color: markerColors,
          size: markerSizes,
          opacity: markerOpacities,
          line: {
            color: markerLineColors,
            width: markerLineWidths
          }
        },
        text: visiblePoints.map(p => p.categoryName),
        hovertemplate:
          '<b>%{text}</b><br>' +
          `${getClusterLabel(clusterId)}<br>` +
          `${bmdMetric.label}: %{x:.4f}<br>` +
          `${bmdlMetric.label}: %{y:.4f}<br>` +
          '<extra></extra>',
        showlegend: false,
      });
    });

    return result;
  }, [scatterData, clusterColors, categoryState.selectedIds, hasSelection, displayMode, getPointStyle, shouldHidePoint, bmdMetric.label, bmdlMetric.label]);

  // Early return after all hooks
  if (!scatterData || scatterData.size === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid BMD vs BMDL data available for scatter plot
      </div>
    );
  }

  // Calculate axis ranges for log scale
  const getAllValues = (byCluster: Map<number, Array<{x: number, y: number, categoryId: string, categoryName: string, inFocus: boolean}>>, axis: 'x' | 'y'): number[] => {
    const values: number[] = [];
    byCluster.forEach(points => {
      points.forEach(point => values.push(point[axis]));
    });
    return values;
  };

  const getAxisConfig = (values: number[], useLog: boolean) => {
    if (values.length === 0) return { type: 'linear' as const };

    if (useLog) {
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const minDecade = Math.floor(Math.log10(minVal));
      const maxDecade = Math.ceil(Math.log10(maxVal));
      return {
        type: 'log' as const,
        range: [minDecade - 0.5, maxDecade + 0.5]
      };
    }
    return {
      type: 'linear' as const
    };
  };

  const allXValues = getAllValues(scatterData, 'x');
  const allYValues = getAllValues(scatterData, 'y');
  const xAxisConfig = getAxisConfig(allXValues, useLogX);
  const yAxisConfig = getAxisConfig(allYValues, useLogY);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Space>
          <Text>BMD Statistic:</Text>
          <BmdStatSelector stat={stat} onStatChange={setStat} />
        </Space>

        <Space>
          <Checkbox checked={useLogX} onChange={(e) => setUseLogX(e.target.checked)}>
            Log X-Axis
          </Checkbox>
          <Checkbox checked={useLogY} onChange={(e) => setUseLogY(e.target.checked)}>
            Log Y-Axis
          </Checkbox>
        </Space>
      </div>

      <div style={{ width: '100%', aspectRatio: '2/1' }}>
        <Plot
          data={traces}
          layout={applyToLayout({
            title: {
              text: `BMD vs BMDL Scatter Plot (${statLabel})`,
              font: { size: 14 }
            },
            xaxis: {
              title: { text: bmdMetric.label },
              type: xAxisConfig.type,
              range: xAxisConfig.range,
              showgrid: true,
            },
            yaxis: {
              title: { text: bmdlMetric.label },
              type: yAxisConfig.type,
              range: yAxisConfig.range,
              showgrid: true,
            },
            height: 600,
            margin: { l: 80, r: 50, t: 80, b: 80 },
            hovermode: 'closest',
            showlegend: false,
          }) as any}
          config={getConfig('bmd_vs_bmdl_scatter') as any}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
        <p><strong>About this scatter plot:</strong></p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Each point represents one category's BMD vs BMDL values</li>
          <li>X-axis: BMD (Benchmark Dose) - the estimated dose at the benchmark response</li>
          <li>Y-axis: BMDL (Lower Confidence Limit) - the statistical lower bound of the BMD estimate</li>
          <li>Points closer to the diagonal indicate tighter confidence intervals (more precise estimates)</li>
          <li>Points farther from the diagonal indicate wider confidence intervals (more uncertain estimates)</li>
          <li>Log scales are typically used since BMD values often span multiple orders of magnitude</li>
          <li>Colors indicate cluster assignments from UMAP semantic space analysis</li>
          <li>In-focus categories (passing Primary Filter) appear at full size; out-of-focus are dimmed/hidden based on display mode</li>
        </ul>
      </div>
    </div>
  );
}
