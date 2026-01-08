/**
 * ClusterHistogram Component (formerly ClusterHeatmap)
 *
 * Stacked histogram showing BMD distribution by gene cluster:
 * - X-axis: BMD values (log scale)
 * - Y-axis: Count of categories
 * - Stacked bars colored by cluster membership
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
import { CLUSTER_COLOR_PALETTE, OUTLIER_COLOR } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

const { Text } = Typography;

interface ClusterHeatmapProps {
  /** Initial linkage method */
  initialLinkageMethod?: LinkageMethod;
}

type BmdMetric = 'median' | 'mean';

export default function ClusterHeatmap({
  initialLinkageMethod = 'average',
}: ClusterHeatmapProps) {
  const [linkageMethod, setLinkageMethod] = useState<LinkageMethod>(initialLinkageMethod);
  const [bmdMetric, setBmdMetric] = useState<BmdMetric>('median');
  const [hiddenClusters, setHiddenClusters] = useState<Set<number>>(new Set());

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

  // Build histogram traces (one per cluster, stacked)
  const plotData = useMemo(() => {
    if (clusterAssignments.size === 0) return [];

    // Group BMD values by cluster
    const clusterBmdValues = new Map<number, number[]>();
    uniqueClusterIds.forEach(id => clusterBmdValues.set(id, []));

    clusterAssignments.forEach((clusterId, categoryId) => {
      const cat = categoryData.get(categoryId);
      if (!cat) return;

      const inFocus = focusMap.get(categoryId) ?? true;

      // Filter based on displayMode (isolate mode hides out-of-focus)
      if (shouldHidePoint(inFocus)) return;

      // Get BMD value based on selected metric
      const bmd = bmdMetric === 'median'
        ? (cat.bmdMedian ?? cat.bmdMean)
        : (cat.bmdMean ?? cat.bmdMedian);

      if (bmd != null && bmd > 0) {
        const values = clusterBmdValues.get(clusterId);
        if (values) {
          values.push(bmd);
        }
      }
    });

    // Create histogram trace for each cluster
    const traces: any[] = [];

    uniqueClusterIds.forEach((clusterId, clusterIndex) => {
      const bmdValues = clusterBmdValues.get(clusterId) || [];
      if (bmdValues.length === 0) return;

      const isHidden = hiddenClusters.has(clusterId);
      const baseColor = CLUSTER_COLOR_PALETTE[clusterIndex % CLUSTER_COLOR_PALETTE.length];

      traces.push({
        type: 'histogram',
        x: bmdValues,
        name: `Cluster ${clusterId} (${bmdValues.length})`,
        marker: {
          color: baseColor,
          line: {
            color: 'white',
            width: 1,
          },
        },
        opacity: 0.8,
        visible: isHidden ? 'legendonly' : true,
        hovertemplate: `Cluster ${clusterId}<br>BMD: %{x}<br>Count: %{y}<extra></extra>`,
      });
    });

    return traces;
  }, [clusterAssignments, categoryData, uniqueClusterIds, focusMap, displayMode, shouldHidePoint, bmdMetric, hiddenClusters]);

  // Toggle cluster visibility
  const toggleCluster = (clusterId: number) => {
    setHiddenClusters(prev => {
      const next = new Set(prev);
      if (next.has(clusterId)) {
        next.delete(clusterId);
      } else {
        next.add(clusterId);
      }
      return next;
    });
  };

  // Build cluster legend with counts
  const clusterLegend = useMemo(() => {
    const counts = new Map<number, number>();
    clusterAssignments.forEach((clusterId, categoryId) => {
      const inFocus = focusMap.get(categoryId) ?? true;
      if (shouldHidePoint(inFocus)) return;

      const cat = categoryData.get(categoryId);
      const bmd = bmdMetric === 'median'
        ? (cat?.bmdMedian ?? cat?.bmdMean)
        : (cat?.bmdMean ?? cat?.bmdMedian);

      if (bmd != null && bmd > 0) {
        counts.set(clusterId, (counts.get(clusterId) || 0) + 1);
      }
    });

    return uniqueClusterIds.map((clusterId, index) => ({
      id: clusterId,
      color: CLUSTER_COLOR_PALETTE[index % CLUSTER_COLOR_PALETTE.length],
      count: counts.get(clusterId) || 0,
    }));
  }, [uniqueClusterIds, clusterAssignments, categoryData, focusMap, shouldHidePoint, bmdMetric]);

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

  const xAxisLabel = bmdMetric === 'median' ? 'BMD Median' : 'BMD Mean';

  const layout: any = {
    title: {
      text: `Gene Cluster Distribution (${categoryCount} categories, ${uniqueClusterIds.length} clusters)`,
      font: { size: 16 },
    },
    xaxis: {
      title: { text: xAxisLabel },
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
    margin: { l: 60, r: 100, t: 60, b: 60 },
    hovermode: 'closest',
    ...DEFAULT_LAYOUT_STYLES,
    showlegend: true,
    legend: {
      orientation: 'v',
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(255,255,255,0.9)',
      bordercolor: '#ddd',
      borderwidth: 1,
    },
  };

  const config = createPlotlyConfig();

  return (
    <div style={{ width: '100%' }}>
      {/* Controls */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <Space>
          <Text>BMD Metric:</Text>
          <Select
            value={bmdMetric}
            onChange={setBmdMetric}
            style={{ width: 100 }}
            options={[
              { value: 'median', label: 'Median' },
              { value: 'mean', label: 'Mean' },
            ]}
          />
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

      {/* Interactive Cluster Legend */}
      <div style={{
        marginBottom: '1rem',
        padding: '0.75rem',
        background: '#f5f5f5',
        borderRadius: '4px',
        border: '1px solid #d9d9d9'
      }}>
        <Text strong style={{ marginRight: '12px' }}>Clusters (click to toggle):</Text>
        <Space wrap>
          {clusterLegend.map(({ id, color, count }) => {
            const isHidden = hiddenClusters.has(id);

            return (
              <div
                key={id}
                onClick={() => toggleCluster(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: isHidden ? 'transparent' : 'white',
                  border: isHidden ? '1px dashed #ccc' : '1px solid #d9d9d9',
                  opacity: isHidden ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 12,
                  height: 12,
                  backgroundColor: isHidden ? 'transparent' : color,
                  border: `2px solid ${color}`,
                  borderRadius: 2,
                }} />
                <Text style={{
                  fontSize: '12px',
                  textDecoration: isHidden ? 'line-through' : 'none',
                }}>
                  Cluster {id} ({count})
                </Text>
              </div>
            );
          })}
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
