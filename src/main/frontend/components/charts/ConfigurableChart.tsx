/**
 * Configurable Chart Component
 *
 * A generic chart renderer that interprets ChartConfiguration objects to render
 * Plotly charts. Supports scatter, bubble, histogram, and bar chart types.
 *
 * For complex specialized charts (heatmaps, violin plots, curve overlays),
 * use the dedicated components instead.
 */

import React, { useMemo, useCallback, useState } from 'react';
import { Checkbox, Space, Typography, Select } from 'antd';
import Plot from 'react-plotly.js';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';
import type { ChartConfiguration, ChartKey, ChartTransform } from 'Frontend/types/chartConfiguration';
import { applyTransform, getTransformLabel } from 'Frontend/types/chartConfiguration';
import { getFieldLabel } from 'Frontend/utils/chartFields';

const { Text } = Typography;

interface ConfigurableChartProps {
  /** The chart configuration to render */
  config: ChartConfiguration;
  /** Optional callback when user modifies chart options */
  onOptionsChange?: (options: Partial<ChartConfiguration['options']>) => void;
  /** Optional callback when user modifies chart keys */
  onKeysChange?: (keys: Partial<ChartConfiguration['keys']>) => void;
  /** Whether to show configuration controls */
  showControls?: boolean;
}

/**
 * Extract a value from a data row based on ChartKey configuration.
 */
function extractValue(
  row: Record<string, any>,
  key: ChartKey | undefined
): number | null {
  if (!key) return null;

  const rawValue = row[key.field];
  if (rawValue == null || typeof rawValue !== 'number') return null;

  const transform = key.transform || 'none';
  return applyTransform(rawValue, transform);
}

/**
 * Get axis label for a ChartKey.
 */
function getAxisLabel(key: ChartKey | undefined): string {
  if (!key) return '';

  const fieldLabel = getFieldLabel(key.field);
  const transform = key.transform || 'none';

  if (transform === 'none') {
    return fieldLabel;
  }

  return `${getTransformLabel(transform)}(${fieldLabel})`;
}

/**
 * ConfigurableChart - Generic chart renderer based on configuration.
 */
export default function ConfigurableChart({
  config,
  onOptionsChange,
  onKeysChange,
  showControls = false,
}: ConfigurableChartProps) {
  // Get data and styling from shared hooks
  const { data, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();
  const clusterColors = useClusterColors();
  const categoryState = useReactiveState('categoryId');

  // Local state for log scale toggles (can be overridden by config)
  const [localXLogScale, setLocalXLogScale] = useState(config.options.xLogScale ?? false);
  const [localYLogScale, setLocalYLogScale] = useState(config.options.yLogScale ?? false);

  const hasSelection = categoryState.selectedIds.size > 0;

  // Effective log scale settings
  const useXLogScale = onOptionsChange ? localXLogScale : (config.options.xLogScale ?? false);
  const useYLogScale = onOptionsChange ? localYLogScale : (config.options.yLogScale ?? false);

  // Handle log scale toggle
  const handleXLogChange = useCallback((checked: boolean) => {
    setLocalXLogScale(checked);
    onOptionsChange?.({ xLogScale: checked });
  }, [onOptionsChange]);

  const handleYLogChange = useCallback((checked: boolean) => {
    setLocalYLogScale(checked);
    onOptionsChange?.({ yLogScale: checked });
  }, [onOptionsChange]);

  // Build chart data based on chart type
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const { chartType, keys } = config;

    // For scatter and bubble charts
    if (chartType === 'scatter' || chartType === 'bubble') {
      return buildScatterData(data, keys, config, shouldHidePoint);
    }

    // For histogram
    if (chartType === 'histogram') {
      return buildHistogramData(data, keys, shouldHidePoint);
    }

    // For bar chart
    if (chartType === 'bar') {
      return buildBarData(data, keys, config, shouldHidePoint);
    }

    return null;
  }, [data, config, shouldHidePoint]);

  // Build Plotly traces with styling
  const traces = useMemo(() => {
    if (!chartData) return [];

    const { chartType, keys } = config;

    if (chartType === 'scatter' || chartType === 'bubble') {
      return buildScatterTraces(
        chartData as ScatterDataByCluster,
        clusterColors,
        categoryState.selectedIds,
        hasSelection,
        getPointStyle,
        keys,
        chartType === 'bubble'
      );
    }

    if (chartType === 'histogram') {
      return buildHistogramTraces(chartData as HistogramData, keys);
    }

    if (chartType === 'bar') {
      return buildBarTraces(chartData as BarData, clusterColors, keys);
    }

    return [];
  }, [chartData, config, clusterColors, categoryState.selectedIds, hasSelection, getPointStyle]);

  // Handle click for scatter/bubble charts
  const handlePlotClick = useCallback((event: any) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const categoryId = point.customdata?.categoryId;

      if (categoryId) {
        if (event.event?.ctrlKey || event.event?.metaKey) {
          categoryState.handleSelect(categoryId, true, 'chart');
        } else {
          categoryState.handleMultiSelect([categoryId], 'chart');
        }
      }
    }
  }, [categoryState]);

  // Early return if no data
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for {config.name}
      </div>
    );
  }

  if (traces.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid data for {config.name}
      </div>
    );
  }

  // Build layout based on chart type
  const layout = buildLayout(config, useXLogScale, useYLogScale);

  return (
    <div style={{ width: '100%' }}>
      {/* Controls */}
      {showControls && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {(config.chartType === 'scatter' || config.chartType === 'bubble') && (
            <Space>
              <Checkbox checked={useXLogScale} onChange={(e) => handleXLogChange(e.target.checked)}>
                Log X-Axis
              </Checkbox>
              <Checkbox checked={useYLogScale} onChange={(e) => handleYLogChange(e.target.checked)}>
                Log Y-Axis
              </Checkbox>
            </Space>
          )}
        </div>
      )}

      {/* Chart */}
      <Plot
        data={traces}
        layout={layout}
        config={createPlotlyConfig()}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
        onClick={handlePlotClick}
      />
    </div>
  );
}

// ==================== Data Building Functions ====================

interface ScatterPoint {
  x: number;
  y: number;
  size?: number;
  categoryId: string;
  categoryName: string;
  inFocus: boolean;
}

type ScatterDataByCluster = Map<number, ScatterPoint[]>;

function buildScatterData(
  data: any[],
  keys: ChartConfiguration['keys'],
  config: ChartConfiguration,
  shouldHidePoint: (inFocus: boolean) => boolean
): ScatterDataByCluster | null {
  if (!keys.x || !keys.y) return null;

  const byCluster = new Map<number, ScatterPoint[]>();

  data.forEach(row => {
    // Skip hidden points in isolate mode
    if (shouldHidePoint(row.inFocus)) return;

    const xValue = extractValue(row, keys.x);
    const yValue = extractValue(row, keys.y);

    if (xValue == null || yValue == null) return;
    if (!isFinite(xValue) || !isFinite(yValue)) return;

    // For bubble charts, also need size
    let sizeValue: number | undefined;
    if (config.chartType === 'bubble' && keys.size) {
      const rawSize = extractValue(row, keys.size);
      if (rawSize != null && rawSize > 0) {
        sizeValue = rawSize;
      } else {
        return; // Skip if no valid size for bubble chart
      }
    }

    const clusterId = getClusterIdForCategory(row.categoryId);
    if (!byCluster.has(clusterId)) {
      byCluster.set(clusterId, []);
    }

    byCluster.get(clusterId)!.push({
      x: xValue,
      y: yValue,
      size: sizeValue,
      categoryId: row.categoryId || '',
      categoryName: row.categoryDescription || row.categoryId || 'Unknown',
      inFocus: row.inFocus,
    });
  });

  return byCluster;
}

function buildScatterTraces(
  dataByCluster: ScatterDataByCluster,
  clusterColors: Record<number, string>,
  selectedIds: Set<string | number>,
  hasSelection: boolean,
  getPointStyle: (inFocus: boolean, baseColor: string) => any,
  keys: ChartConfiguration['keys'],
  isBubble: boolean
): any[] {
  const traces: any[] = [];

  // Calculate max size for bubble scaling
  let maxSize = 1;
  if (isBubble) {
    dataByCluster.forEach(points => {
      points.forEach(p => {
        if (p.size && p.size > maxSize) maxSize = p.size;
      });
    });
  }

  // Sort clusters (outliers last)
  const sortedClusters = Array.from(dataByCluster.keys()).sort((a, b) => {
    if (a === -1) return 1;
    if (b === -1) return -1;
    return a - b;
  });

  sortedClusters.forEach(clusterId => {
    const points = dataByCluster.get(clusterId)!;
    if (points.length === 0) return;

    const baseColor = clusterColors[clusterId] || '#999999';

    // Per-point styling arrays
    const markerColors: string[] = [];
    const markerOpacities: number[] = [];
    const markerSizes: number[] = [];
    const markerLineWidths: number[] = [];
    const markerLineColors: string[] = [];

    points.forEach(point => {
      const isSelected = selectedIds.has(point.categoryId);
      const focusStyle = getPointStyle(point.inFocus, baseColor);

      // Bubble size calculation
      let pointSize = focusStyle.size;
      if (isBubble && point.size != null) {
        // Scale bubble size: min 8, max 40
        pointSize = 8 + (point.size / maxSize) * 32;
      }

      // Styling priority: selection > focus
      if (isSelected && hasSelection) {
        markerColors.push(focusStyle.color);
        markerOpacities.push(1.0);
        markerSizes.push(isBubble ? pointSize : 12);
        markerLineWidths.push(2);
        markerLineColors.push('white');
      } else if (hasSelection) {
        markerColors.push(focusStyle.color);
        markerOpacities.push(0.2);
        markerSizes.push(pointSize);
        markerLineWidths.push(0);
        markerLineColors.push('white');
      } else {
        markerColors.push(focusStyle.color);
        markerOpacities.push(focusStyle.opacity);
        markerSizes.push(pointSize);
        markerLineWidths.push(focusStyle.lineWidth);
        markerLineColors.push(focusStyle.lineColor);
      }
    });

    const xLabel = getAxisLabel(keys.x);
    const yLabel = getAxisLabel(keys.y);

    traces.push({
      type: 'scatter',
      mode: 'markers',
      x: points.map(p => p.x),
      y: points.map(p => p.y),
      customdata: points.map(p => ({
        categoryId: p.categoryId,
        size: p.size,
      })),
      text: points.map(p => p.categoryName),
      marker: {
        size: markerSizes,
        sizemode: isBubble ? 'diameter' : undefined,
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
        `${xLabel}: %{x:.4f}<br>` +
        `${yLabel}: %{y:.2f}<br>` +
        (isBubble && keys.size ? `${getAxisLabel(keys.size)}: %{customdata.size:.1f}%<br>` : '') +
        '<extra></extra>',
      showlegend: false,
    });
  });

  return traces;
}

// ==================== Histogram ====================

interface HistogramData {
  values: number[];
}

function buildHistogramData(
  data: any[],
  keys: ChartConfiguration['keys'],
  shouldHidePoint: (inFocus: boolean) => boolean
): HistogramData | null {
  if (!keys.x) return null;

  const values: number[] = [];

  data.forEach(row => {
    if (shouldHidePoint(row.inFocus)) return;

    const value = extractValue(row, keys.x);
    if (value != null && isFinite(value)) {
      values.push(value);
    }
  });

  return { values };
}

function buildHistogramTraces(histData: HistogramData, keys: ChartConfiguration['keys']): any[] {
  if (histData.values.length === 0) return [];

  const xLabel = getAxisLabel(keys.x);

  return [{
    type: 'histogram',
    x: histData.values,
    marker: {
      color: 'steelblue',
      line: {
        color: 'white',
        width: 1,
      },
    },
    name: xLabel,
    hovertemplate: `${xLabel}: %{x}<br>Count: %{y}<extra></extra>`,
  }];
}

// ==================== Bar Chart ====================

interface BarData {
  labels: string[];
  values: number[];
  categoryIds: string[];
  clusterIds: number[];
}

function buildBarData(
  data: any[],
  keys: ChartConfiguration['keys'],
  config: ChartConfiguration,
  shouldHidePoint: (inFocus: boolean) => boolean
): BarData | null {
  if (!keys.y) return null;

  const items: { label: string; value: number; categoryId: string; clusterId: number }[] = [];

  data.forEach(row => {
    if (shouldHidePoint(row.inFocus)) return;

    const value = extractValue(row, keys.y);
    if (value == null || !isFinite(value)) return;

    const label = row.categoryDescription || row.categoryId || 'Unknown';
    const clusterId = getClusterIdForCategory(row.categoryId);

    items.push({
      label,
      value,
      categoryId: row.categoryId || '',
      clusterId,
    });
  });

  // Sort by value descending and take top N
  items.sort((a, b) => b.value - a.value);
  const topN = config.options.topN === 'All' ? items.length : (config.options.topN ?? 20);
  const topItems = items.slice(0, topN);

  return {
    labels: topItems.map(i => i.label),
    values: topItems.map(i => i.value),
    categoryIds: topItems.map(i => i.categoryId),
    clusterIds: topItems.map(i => i.clusterId),
  };
}

function buildBarTraces(
  barData: BarData,
  clusterColors: Record<number, string>,
  keys: ChartConfiguration['keys']
): any[] {
  if (barData.values.length === 0) return [];

  const yLabel = getAxisLabel(keys.y);

  // Color bars by cluster
  const colors = barData.clusterIds.map(id => clusterColors[id] || '#999999');

  return [{
    type: 'bar',
    x: barData.labels,
    y: barData.values,
    marker: {
      color: colors,
    },
    hovertemplate: '<b>%{x}</b><br>' + `${yLabel}: %{y}<extra></extra>`,
  }];
}

// ==================== Layout Building ====================

function buildLayout(
  config: ChartConfiguration,
  useXLogScale: boolean,
  useYLogScale: boolean
): any {
  const { chartType, keys, name } = config;

  const baseLayout = {
    ...DEFAULT_LAYOUT_STYLES,
    title: {
      text: name,
      font: { size: 16 },
    },
    height: 600,
    hovermode: 'closest' as const,
    showlegend: false,
  };

  if (chartType === 'scatter' || chartType === 'bubble') {
    return {
      ...baseLayout,
      xaxis: {
        title: { text: getAxisLabel(keys.x) },
        type: useXLogScale ? 'log' : 'linear',
        autorange: true,
        gridcolor: DEFAULT_GRID_COLOR,
      },
      yaxis: {
        title: { text: getAxisLabel(keys.y) },
        type: useYLogScale ? 'log' : 'linear',
        autorange: true,
        gridcolor: DEFAULT_GRID_COLOR,
      },
    };
  }

  if (chartType === 'histogram') {
    return {
      ...baseLayout,
      xaxis: {
        title: { text: getAxisLabel(keys.x) },
        gridcolor: DEFAULT_GRID_COLOR,
      },
      yaxis: {
        title: { text: 'Count' },
        gridcolor: DEFAULT_GRID_COLOR,
      },
      bargap: 0.1,
    };
  }

  if (chartType === 'bar') {
    return {
      ...baseLayout,
      xaxis: {
        title: { text: 'Category' },
        tickangle: -45,
        automargin: true,
      },
      yaxis: {
        title: { text: getAxisLabel(keys.y) },
        gridcolor: DEFAULT_GRID_COLOR,
      },
      margin: { l: 80, r: 50, t: 80, b: 150 },
    };
  }

  return baseLayout;
}
