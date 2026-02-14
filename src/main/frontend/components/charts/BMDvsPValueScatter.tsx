/**
 * BMD vs P-Value Scatter Plot Component
 *
 * Displays a scatter plot comparing BMD Mean vs Fisher's Exact P-Value.
 * Each point represents one category, colored by UMAP cluster assignment.
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 */

import React, { useMemo, useCallback, useState } from 'react';
import { Checkbox, Space, Typography } from 'antd';
import Plot from 'react-plotly.js';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useBmdMetric } from './hooks/useBmdMetric';
import { BmdStatSelector } from './BmdMetricSelector';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { useChartAppearance } from './hooks/useChartAppearance';
import ExportDropdown from './ExportDropdown';
import type { BmdStatType } from './utils/bmdMetricConfig';

const { Text } = Typography;

interface BMDvsPValueScatterProps {
  /** Externally controlled stat (when used in BMD Overview) */
  stat?: BmdStatType;
  /** Hide the controls (when controlled by parent) */
  hideControls?: boolean;
  /** Chart ID for per-chart appearance overrides */
  chartId?: string;
  /** Parent chart ID for subplot appearance cascade */
  parentChartId?: string;
  /** Subplot key for subplot appearance cascade */
  subplotKey?: string;
}

export default function BMDvsPValueScatter({ stat: externalStat, hideControls = false, chartId, parentChartId, subplotKey }: BMDvsPValueScatterProps) {
  const { data, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const clusterColors = useClusterColors();
  const hasSelection = categoryState.selectedIds.size > 0;
  const [useLogScale, setUseLogScale] = useState(true);
  const { applyToLayout, getConfig, plotRef } = useChartAppearance(
    chartId ?? 'bmd-vs-pvalue-scatter',
    parentChartId && subplotKey ? { parentId: parentChartId, key: subplotKey } : undefined
  );

  // BMD metric selection (base fixed to 'bmd', stat selectable or externally controlled)
  // Pass externalStat as controlled value - hook will use it when provided
  const { stat, setStat, label: metricLabel, getValue } = useBmdMetric(undefined, undefined, externalStat);

  // Prepare data for plotting
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
      const xValue = getValue(row);
      const pValue = row.fishersExactTwoTailPValue;

      if (xValue === undefined || xValue === null || xValue <= 0) return;
      if (pValue === undefined || pValue === null || pValue <= 0) return;

      const yValue = -Math.log10(pValue);
      if (!isFinite(yValue)) return;

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
    });

    return byCluster;
  }, [data, getValue]);

  // Calculate axis ranges
  const { xRange, yRange } = useMemo(() => {
    if (!scatterData) return { xRange: undefined, yRange: undefined };

    const allX: number[] = [];
    const allY: number[] = [];

    scatterData.forEach(points => {
      points.forEach(p => {
        allX.push(p.x);
        allY.push(p.y);
      });
    });

    if (allX.length === 0) return { xRange: undefined, yRange: undefined };

    const xMin = Math.min(...allX);
    const xMax = Math.max(...allX);
    const yMin = Math.min(...allY);
    const yMax = Math.max(...allY);

    return {
      xRange: [Math.log10(xMin) - 0.5, Math.log10(xMax) + 0.5],
      yRange: [Math.max(0, yMin - (yMax - yMin) * 0.1), yMax + (yMax - yMin) * 0.1]
    };
  }, [scatterData]);

  // Create traces with inFocus-based per-point styling
  const traces = useMemo(() => {
    if (!scatterData) return [];

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
        customdata: visiblePoints.map(p => p.categoryId),
        text: visiblePoints.map(p => p.categoryName),
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
        hovertemplate:
          '<b>%{text}</b><br>' +
          `${getClusterLabel(clusterId)}<br>` +
          `${metricLabel}: %{x:.4f}<br>` +
          '-log10(p): %{y:.4f}<extra></extra>',
        showlegend: false,
      });
    });

    return result;
  }, [scatterData, clusterColors, categoryState.selectedIds, hasSelection, displayMode, getPointStyle, shouldHidePoint, metricLabel]);

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

  if (!scatterData || scatterData.size === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid BMD vs P-Value data available for scatter plot
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Controls */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        {!hideControls && (
          <Space>
            <Text>BMD Statistic:</Text>
            <BmdStatSelector stat={stat} onStatChange={setStat} />
          </Space>
        )}
        <Checkbox checked={useLogScale} onChange={(e) => setUseLogScale(e.target.checked)}>
          Log₁₀ Scale (Dose)
        </Checkbox>
        <ExportDropdown plotRef={plotRef} filename="bmd_vs_pvalue_scatter" />
      </div>

      {/* Chart */}
      <div ref={plotRef} style={{ width: '100%', aspectRatio: '2/1' }}>
        <Plot
          data={traces}
          layout={applyToLayout({
            title: `${metricLabel} vs Fisher Exact P-Value (Colored by Cluster)`,
            xaxis: {
              title: { text: metricLabel },
              type: useLogScale ? 'log' : 'linear',
              ...(useLogScale ? { range: xRange } : { autorange: true }),
            },
            yaxis: {
              title: { text: '-log₁₀(Fisher Exact P-Value)' },
              range: yRange,
            },
            hovermode: 'closest',
            margin: { l: 60, r: 30, t: 50, b: 60 },
            showlegend: false,
          }) as any}
          config={getConfig('bmd_vs_pvalue_scatter')}
          onClick={handlePlotClick}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
