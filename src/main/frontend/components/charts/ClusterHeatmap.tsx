/**
 * ClusterHistogram Component (formerly ClusterHeatmap)
 *
 * Stacked histogram showing BMD distribution by gene cluster:
 * - X-axis: BMD values (log scale)
 * - Y-axis: Count of categories
 * - Bars colored by UMAP cluster (consistent with sidebar ClusterPicker)
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 *
 * This visualization helps identify how BMD values are distributed
 * across different gene-similarity clusters.
 */

import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { Spin, Select, Space, Typography } from 'antd';
import { useGeneClusteringData, LinkageMethod } from './hooks/useGeneClusteringData';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useBmdMetric } from './hooks/useBmdMetric';
import { BmdStatSelector } from './BmdMetricSelector';
import { getClusterIdForCategory, getClusterColor } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

const { Text } = Typography;

interface ClusterHeatmapProps {
  /** Initial linkage method */
  initialLinkageMethod?: LinkageMethod;
}

export default function ClusterHeatmap({
  initialLinkageMethod = 'average',
}: ClusterHeatmapProps) {
  const [linkageMethod, setLinkageMethod] = useState<LinkageMethod>(initialLinkageMethod);

  // BMD metric selection (base fixed to 'bmd', stat selectable)
  const { stat, setStat, label: metricLabel, getValueWithFallback } = useBmdMetric('bmd', 'median');

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

  // Build histogram traces - one trace per gene cluster, but colored by UMAP cluster
  const plotData = useMemo(() => {
    if (clusterAssignments.size === 0) return [];

    // Group BMD values by gene cluster, but track UMAP cluster for coloring
    const geneClusterData = new Map<number, Array<{ bmd: number; umapClusterId: number; categoryId: string }>>();
    uniqueClusterIds.forEach(id => geneClusterData.set(id, []));

    clusterAssignments.forEach((geneClusterId, categoryId) => {
      const cat = categoryData.get(categoryId);
      if (!cat) return;

      const inFocus = focusMap.get(categoryId) ?? true;

      // Filter based on displayMode (isolate mode hides out-of-focus)
      if (shouldHidePoint(inFocus)) return;

      // Get BMD value using the selected metric (with fallback to median)
      const bmd = getValueWithFallback(cat, 'median');

      if (bmd != null && bmd > 0) {
        const data = geneClusterData.get(geneClusterId);
        if (data) {
          // Get UMAP cluster ID for coloring
          const umapClusterId = getClusterIdForCategory(categoryId);
          data.push({ bmd, umapClusterId, categoryId });
        }
      }
    });

    // Create histogram trace for each gene cluster
    const traces: any[] = [];

    uniqueClusterIds.forEach((geneClusterId) => {
      const data = geneClusterData.get(geneClusterId) || [];
      if (data.length === 0) return;

      // Get colors based on UMAP cluster for each point
      const colors = data.map(d => getClusterColor(d.umapClusterId));

      traces.push({
        type: 'histogram',
        x: data.map(d => d.bmd),
        name: `Gene Cluster ${geneClusterId}`,
        marker: {
          color: colors,
          line: {
            color: 'white',
            width: 1,
          },
        },
        opacity: 0.8,
        hovertemplate: `Gene Cluster ${geneClusterId}<br>BMD: %{x}<br>Count: %{y}<extra></extra>`,
        showlegend: false,
      });
    });

    return traces;
  }, [clusterAssignments, categoryData, uniqueClusterIds, focusMap, displayMode, shouldHidePoint, getValueWithFallback]);

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
        No data available for cluster histogram
      </div>
    );
  }

  const layout: any = {
    title: {
      text: `Gene Cluster Distribution (${categoryCount} categories, ${uniqueClusterIds.length} clusters)`,
      font: { size: 16 },
    },
    xaxis: {
      title: { text: metricLabel },
      type: 'log',
      autorange: true,
      gridcolor: DEFAULT_GRID_COLOR,
    },
    yaxis: {
      title: { text: 'Count' },
      gridcolor: DEFAULT_GRID_COLOR,
    },
    barmode: 'stack',
    height: 500,
    margin: { l: 60, r: 50, t: 60, b: 60 },
    hovermode: 'closest',
    ...DEFAULT_LAYOUT_STYLES,
    showlegend: false,
  };

  const config = createPlotlyConfig();

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
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
}
