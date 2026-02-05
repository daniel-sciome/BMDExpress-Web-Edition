/**
 * BMD Box Plot Component
 *
 * Displays box plots showing the distribution of BMD, BMDL, and BMDU values
 * across all categories. Individual points are colored by UMAP cluster assignment.
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 */

import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { Button, Space, Typography } from 'antd';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useBmdMetricTriple } from './hooks/useBmdMetric';
import { BmdStatSelector } from './BmdMetricSelector';
import { useClusterColors, getClusterIdForCategory, getClusterLabel } from './utils/clusterColors';
import { createPlotlyConfigWithExport, DEFAULT_LAYOUT_STYLES } from './utils/plotlyConfig';
import type { BmdStatType } from './utils/bmdMetricConfig';

const { Text } = Typography;

interface BMDBoxPlotProps {
  /** Externally controlled stat (when used in BMD Overview) */
  stat?: BmdStatType;
  /** Hide the stat selector (when controlled by parent) */
  hideControls?: boolean;
}

/**
 * Generate deterministic jitter based on a string key.
 * Returns a value between -0.5 and 0.5 that is consistent for the same input.
 */
function deterministicJitter(key: string, salt: number = 0): number {
  let hash = salt;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Use Math.abs to handle negative hash values, normalize to [-0.5, 0.5]
  return (Math.abs(hash % 1000) / 1000) - 0.5;
}

export default function BMDBoxPlot({ stat: externalStat, hideControls = false }: BMDBoxPlotProps) {
  const { data, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const [useFixedScale, setUseFixedScale] = useState(true);
  const clusterColors = useClusterColors();
  const hasSelection = categoryState.selectedIds.size > 0;

  // BMD metric selection (all three bases share the same stat, or externally controlled)
  // Pass externalStat as controlled value - hook will use it when provided
  const { stat, setStat, bmd, bmdl, bmdu } = useBmdMetricTriple('median', externalStat);

  // Build traces with inFocus-based styling
  const { traces, yAxisRange, bmdStats } = useMemo(() => {
    const result: any[] = [];

    // Collect all values for box plots and scatter points
    const allValues = {
      bmd: [] as { value: number; categoryId: string; inFocus: boolean }[],
      bmdl: [] as { value: number; categoryId: string; inFocus: boolean }[],
      bmdu: [] as { value: number; categoryId: string; inFocus: boolean }[],
    };

    data.forEach(row => {
      const bmdVal = bmd.getValue(row);
      const bmdlVal = bmdl.getValue(row);
      const bmduVal = bmdu.getValue(row);

      if (bmdVal !== undefined && bmdVal !== null && !isNaN(bmdVal)) {
        allValues.bmd.push({ value: bmdVal, categoryId: row.categoryId || '', inFocus: row.inFocus });
      }
      if (bmdlVal !== undefined && bmdlVal !== null && !isNaN(bmdlVal)) {
        allValues.bmdl.push({ value: bmdlVal, categoryId: row.categoryId || '', inFocus: row.inFocus });
      }
      if (bmduVal !== undefined && bmduVal !== null && !isNaN(bmduVal)) {
        allValues.bmdu.push({ value: bmduVal, categoryId: row.categoryId || '', inFocus: row.inFocus });
      }
    });

    // Create black box plots (showing all data for context)
    if (allValues.bmd.length > 0) {
      result.push({
        x: Array(allValues.bmd.length).fill(0),
        y: allValues.bmd.map(v => v.value),
        type: 'box',
        name: bmd.label,
        marker: { color: 'black' },
        line: { color: 'black' },
        fillcolor: 'rgba(0, 0, 0, 0.1)',
        boxpoints: false,
        boxmean: 'sd',
        showlegend: true,
        legendgroup: 'bmd',
        legendgrouptitle: { text: 'Categories' },
      });
    }
    if (allValues.bmdl.length > 0) {
      result.push({
        x: Array(allValues.bmdl.length).fill(1),
        y: allValues.bmdl.map(v => v.value),
        type: 'box',
        name: bmdl.label,
        marker: { color: 'black' },
        line: { color: 'black' },
        fillcolor: 'rgba(0, 0, 0, 0.1)',
        boxpoints: false,
        boxmean: 'sd',
        showlegend: true,
        legendgroup: 'bmdl',
      });
    }
    if (allValues.bmdu.length > 0) {
      result.push({
        x: Array(allValues.bmdu.length).fill(2),
        y: allValues.bmdu.map(v => v.value),
        type: 'box',
        name: bmdu.label,
        marker: { color: 'black' },
        line: { color: 'black' },
        fillcolor: 'rgba(0, 0, 0, 0.1)',
        boxpoints: false,
        boxmean: 'sd',
        showlegend: true,
        legendgroup: 'bmdu',
      });
    }

    // Add cluster-colored scatter points with inFocus-based styling
    const addClusterPoints = (
      items: { value: number; categoryId: string; inFocus: boolean }[],
      xPosition: number
    ) => {
      // Group by cluster
      const byCluster = new Map<number, typeof items>();

      items.forEach(item => {
        const clusterId = getClusterIdForCategory(item.categoryId);
        if (!byCluster.has(clusterId)) {
          byCluster.set(clusterId, []);
        }
        byCluster.get(clusterId)!.push(item);
      });

      // Sort clusters (outliers last)
      const sortedClusters = Array.from(byCluster.keys()).sort((a, b) => {
        if (a === -1) return 1;
        if (b === -1) return -1;
        return a - b;
      });

      // Create scatter trace for each cluster with per-point styling
      sortedClusters.forEach(clusterId => {
        const clusterItems = byCluster.get(clusterId)!;
        const baseColor = clusterColors[clusterId] || '#999999';

        // Filter based on displayMode (isolate mode hides out-of-focus)
        const visibleItems = clusterItems.filter(item => !shouldHidePoint(item.inFocus));

        if (visibleItems.length === 0) return;

        // Per-point styling arrays
        const markerColors: string[] = [];
        const markerSizes: number[] = [];
        const markerOpacities: number[] = [];
        const markerLineWidths: number[] = [];
        const markerLineColors: string[] = [];

        visibleItems.forEach(item => {
          const isSelected = categoryState.selectedIds.has(item.categoryId);
          const focusStyle = getPointStyle(item.inFocus, baseColor);

          // Styling priority: selection > focus
          if (isSelected && hasSelection) {
            // Selected: larger, full opacity, white border
            markerColors.push(focusStyle.color);
            markerSizes.push(10);
            markerOpacities.push(1.0);
            markerLineWidths.push(2);
            markerLineColors.push('white');
          } else if (hasSelection) {
            // Not selected but something is: dim this point
            markerColors.push(focusStyle.color);
            markerSizes.push(6);
            markerOpacities.push(0.2);
            markerLineWidths.push(0);
            markerLineColors.push('white');
          } else {
            // No selection at all: use focus-based styling
            markerColors.push(focusStyle.color);
            markerSizes.push(6);
            markerOpacities.push(focusStyle.opacity);
            markerLineWidths.push(focusStyle.lineWidth);
            markerLineColors.push(focusStyle.lineColor);
          }
        });

        // Add deterministic jitter to x positions (consistent across re-renders)
        const jitteredX = visibleItems.map(item =>
          xPosition + deterministicJitter(item.categoryId, xPosition) * 0.3
        );

        result.push({
          x: jitteredX,
          y: visibleItems.map(item => item.value),
          type: 'scatter',
          mode: 'markers',
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
          hovertemplate: `${getClusterLabel(clusterId)}<br>Value: %{y:.4f}<extra></extra>`,
          showlegend: false,
        });
      });
    };

    // Add scatter points for each box plot category
    addClusterPoints(allValues.bmd, 0);
    addClusterPoints(allValues.bmdl, 1);
    addClusterPoints(allValues.bmdu, 2);

    // Calculate y-axis range
    const allBMDValues = [
      ...allValues.bmd.map(v => v.value),
      ...allValues.bmdl.map(v => v.value),
      ...allValues.bmdu.map(v => v.value),
    ];

    let yRange: [number, number] | undefined;
    if (allBMDValues.length > 0) {
      const yMin = Math.min(...allBMDValues);
      const yMax = Math.max(...allBMDValues);
      const padding = (yMax - yMin) * 0.1;
      yRange = [Math.max(0, yMin - padding), yMax + padding];
    }

    // Calculate statistics
    let stats = null;
    if (allValues.bmd.length > 0) {
      const values = allValues.bmd.map(v => v.value);
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      stats = { median, mean, count: values.length };
    }

    return { traces: result, yAxisRange: yRange, bmdStats: stats };
  }, [data, clusterColors, displayMode, getPointStyle, shouldHidePoint, categoryState.selectedIds, hasSelection, bmd, bmdl, bmdu]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for Box Plot
      </div>
    );
  }

  const subtitle = bmdStats
    ? `BMD Statistics: Median=${bmdStats.median.toFixed(3)}, Mean=${bmdStats.mean.toFixed(3)}, N=${bmdStats.count}`
    : '';

  return (
    <div style={{ width: '100%' }}>
      {/* Controls */}
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        {!hideControls && (
          <Space>
            <Text>BMD Statistic:</Text>
            <BmdStatSelector stat={stat} onStatChange={setStat} />
          </Space>
        )}
        <Button
          size="small"
          onClick={() => setUseFixedScale(!useFixedScale)}
        >
          {useFixedScale ? 'Auto Scale' : 'Fixed Scale'}
        </Button>
      </div>
      <div style={{ width: '100%', height: '500px' }}>
        <Plot
          data={traces}
          layout={{
            title: `BMD Distribution (Colored by Cluster)<br><sub>${subtitle}</sub>`,
            yaxis: {
              title: { text: 'Dose Value' },
              gridcolor: '#e0e0e0',
              ...(useFixedScale && yAxisRange ? { range: yAxisRange } : { autorange: true }),
            },
            xaxis: {
              title: '',
              tickmode: 'array',
              tickvals: [0, 1, 2],
              ticktext: [bmd.label, bmdl.label, bmdu.label],
            },
            ...DEFAULT_LAYOUT_STYLES,
            margin: { l: 60, r: 30, t: 80, b: 60 },
            showlegend: false,
            boxmode: 'overlay',
          } as any}
          config={createPlotlyConfigWithExport('bmd_box_plot')}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
