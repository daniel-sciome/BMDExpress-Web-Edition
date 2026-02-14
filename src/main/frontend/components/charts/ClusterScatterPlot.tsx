/**
 * ClusterScatterPlot Component
 *
 * Scatter plot showing BMD distribution by gene cluster assignment:
 * - X-axis: BMD Median or Mean (log scale, user-selectable)
 * - Y-axis: Gene Cluster ID (with jitter to avoid overlap)
 * - Color: Cluster membership based on gene overlap
 * - Size: Number of genes that passed filters
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 *
 * Helps visualize BMD distribution within each gene-similarity cluster.
 */

import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { Spin, Select, Space, Typography } from 'antd';
import { useGeneClusteringData, LinkageMethod } from './hooks/useGeneClusteringData';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useBmdMetric } from './hooks/useBmdMetric';
import { BmdStatSelector } from './BmdMetricSelector';
import { getClusterIdForCategory, useClusterColors } from './utils/clusterColors';
import { useChartAppearance } from './hooks/useChartAppearance';

const { Text } = Typography;

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

interface ClusterScatterPlotProps {
  /** Initial linkage method */
  initialLinkageMethod?: LinkageMethod;
  /** Chart ID for per-chart appearance overrides */
  chartId?: string;
}

export default function ClusterScatterPlot({
  initialLinkageMethod = 'average',
  chartId,
}: ClusterScatterPlotProps) {
  const [linkageMethod, setLinkageMethod] = useState<LinkageMethod>(initialLinkageMethod);
  const { applyToLayout, getConfig } = useChartAppearance(chartId);
  const clusterColors = useClusterColors();

  // BMD metric selection (base fixed to 'bmd', stat selectable)
  const { stat, setStat, label: metricLabel, getValueWithFallback } = useBmdMetric();

  const {
    clusterAssignments,
    categoryData,
    uniqueClusterIds,
    categoryCount,
    loading,
    error,
  } = useGeneClusteringData({ linkageMethod });

  // Get inFocus state and display mode styling
  const { data: allDataWithFocus, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();

  // Build a map of categoryId -> inFocus state
  const focusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    allDataWithFocus.forEach(cat => {
      if (cat.categoryId) {
        map.set(cat.categoryId, cat.inFocus);
      }
    });
    return map;
  }, [allDataWithFocus]);

  // Build scatter trace (single trace, colored by UMAP cluster)
  const plotData = useMemo(() => {
    if (clusterAssignments.size === 0) return [];

    const xValues: number[] = [];
    const yValues: number[] = [];
    const sizes: number[] = [];
    const texts: string[] = [];
    const markerColors: string[] = [];
    const markerOpacities: number[] = [];
    const markerLineWidths: number[] = [];
    const markerLineColors: string[] = [];

    clusterAssignments.forEach((geneClusterId, categoryId) => {
      const cat = categoryData.get(categoryId);
      if (!cat) return;

      const inFocus = focusMap.get(categoryId) ?? true;

      // Filter based on displayMode (isolate mode hides out-of-focus)
      if (shouldHidePoint(inFocus)) return;

      // Get BMD value using the selected metric (with fallback to median)
      const bmd = getValueWithFallback(cat, 'median');

      if (bmd != null && bmd > 0) {
        xValues.push(bmd);
        // Y-axis is gene cluster ID with small vertical jitter (consistent across re-renders)
        yValues.push(geneClusterId + deterministicJitter(categoryId, geneClusterId) * 0.25);

        // Size based on gene count (clamped)
        const geneCount = cat.genesThatPassedAllFilters || 1;
        sizes.push(Math.min(Math.max(geneCount * 0.5 + 5, 6), 30));

        // Get UMAP cluster ID for coloring (not gene cluster)
        const umapClusterId = getClusterIdForCategory(categoryId);
        const baseColor = clusterColors[umapClusterId] || '#999999';

        // Apply inFocus-based styling
        const style = getPointStyle(inFocus, baseColor);
        markerColors.push(style.color);
        markerOpacities.push(style.opacity);
        markerLineWidths.push(style.lineWidth);
        markerLineColors.push(style.lineColor);

        const pValue = cat.fishersExactTwoTailPValue;
        const pValueStr = pValue != null && pValue > 0
          ? `Fisher p: ${pValue.toExponential(2)}<br>`
          : '';

        texts.push(
          `<b>${cat.categoryDescription || categoryId}</b><br>` +
          `${metricLabel}: ${bmd.toFixed(4)}<br>` +
          pValueStr +
          `Gene Cluster: ${geneClusterId}<br>` +
          `Genes: ${geneCount}`
        );
      }
    });

    if (xValues.length === 0) return [];

    return [{
      type: 'scatter' as const,
      mode: 'markers' as const,
      x: xValues,
      y: yValues,
      marker: {
        size: sizes,
        color: markerColors,
        opacity: markerOpacities,
        line: {
          color: markerLineColors,
          width: markerLineWidths,
        },
      },
      text: texts,
      hovertemplate: '%{text}<extra></extra>',
      showlegend: false,
    }];
  }, [clusterAssignments, categoryData, focusMap, displayMode, getPointStyle, shouldHidePoint, getValueWithFallback, metricLabel, clusterColors]);

  // Calculate Y-axis range to show all clusters with padding
  // Must be before early returns to comply with React hooks rules
  const yAxisRange = useMemo(() => {
    if (uniqueClusterIds.length === 0) return undefined;
    const minCluster = Math.min(...uniqueClusterIds);
    const maxCluster = Math.max(...uniqueClusterIds);
    return [minCluster - 0.8, maxCluster + 0.8];
  }, [uniqueClusterIds]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: '1rem', color: '#666' }}>Computing gene clusters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        {error}
      </div>
    );
  }

  if (plotData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for cluster scatter plot
      </div>
    );
  }

  const layout: any = applyToLayout({
    title: {
      text: `Gene Clusters: BMD by Cluster (${categoryCount} categories, ${uniqueClusterIds.length} clusters)`,
      font: { size: 16 },
    },
    xaxis: {
      title: { text: metricLabel },
      type: 'log',
      autorange: true,
    },
    yaxis: {
      title: { text: 'Gene Cluster ID' },
      tickmode: 'array',
      tickvals: uniqueClusterIds,
      ticktext: uniqueClusterIds.map(id => `Cluster ${id}`),
      range: yAxisRange,
    },
    height: Math.max(400, uniqueClusterIds.length * 80 + 150),
    hovermode: 'closest',
    showlegend: false,
  });

  const config = getConfig('cluster_scatter_plot');

  return (
    <div style={{ width: '100%' }}>
      {/* Controls */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <Space>
          <Text>BMD Statistic:</Text>
          <BmdStatSelector stat={stat} onStatChange={setStat} />
        </Space>
        <Space>
          <Text>Linkage Method:</Text>
          <Select
            value={linkageMethod}
            onChange={setLinkageMethod}
            style={{ width: 120 }}
            options={[
              { value: 'average', label: 'Average' },
              { value: 'complete', label: 'Complete' },
              { value: 'single', label: 'Single' },
              { value: 'ward', label: 'Ward' },
            ]}
          />
        </Space>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', aspectRatio: '2/1' }}>
        <Plot
          data={plotData}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
}
