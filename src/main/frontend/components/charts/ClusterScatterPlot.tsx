/**
 * ClusterScatterPlot Component
 *
 * Scatter plot showing BMD distribution by gene cluster assignment:
 * - X-axis: BMD Median (log scale)
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
import { CLUSTER_COLOR_PALETTE, OUTLIER_COLOR } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

const { Text } = Typography;

interface ClusterScatterPlotProps {
  /** Initial linkage method */
  initialLinkageMethod?: LinkageMethod;
}

export default function ClusterScatterPlot({
  initialLinkageMethod = 'average',
}: ClusterScatterPlotProps) {
  const [linkageMethod, setLinkageMethod] = useState<LinkageMethod>(initialLinkageMethod);
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

  // Build scatter traces (one per cluster for legend)
  const plotData = useMemo(() => {
    if (clusterAssignments.size === 0) return [];

    // Group categories by cluster
    const clusterGroups = new Map<number, string[]>();
    clusterAssignments.forEach((clusterId, categoryId) => {
      if (!clusterGroups.has(clusterId)) {
        clusterGroups.set(clusterId, []);
      }
      clusterGroups.get(clusterId)!.push(categoryId);
    });

    // Create a trace for each cluster
    const traces: any[] = [];

    uniqueClusterIds.forEach((clusterId, clusterIndex) => {
      const categoryIds = clusterGroups.get(clusterId) || [];
      if (categoryIds.length === 0) return;

      const isClusterHidden = hiddenClusters.has(clusterId);

      const xValues: number[] = [];
      const yValues: number[] = [];
      const sizes: number[] = [];
      const texts: string[] = [];
      const markerColors: string[] = [];
      const markerOpacities: number[] = [];
      const markerLineWidths: number[] = [];
      const markerLineColors: string[] = [];

      const baseColor = CLUSTER_COLOR_PALETTE[clusterIndex % CLUSTER_COLOR_PALETTE.length];

      categoryIds.forEach(categoryId => {
        const cat = categoryData.get(categoryId);
        if (!cat) return;

        const inFocus = focusMap.get(categoryId) ?? true;

        // Filter based on displayMode (isolate mode hides out-of-focus)
        if (shouldHidePoint(inFocus)) return;

        const bmd = cat.bmdMedian ?? cat.bmdMean;

        if (bmd != null && bmd > 0) {
          xValues.push(bmd);
          // Y-axis is cluster ID with jitter to avoid overlap
          yValues.push(clusterId + (Math.random() - 0.5) * 0.6);

          // Size based on gene count (clamped)
          const geneCount = cat.genesThatPassedAllFilters || 1;
          sizes.push(Math.min(Math.max(geneCount * 0.5 + 5, 6), 30));

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
            `BMD Median: ${bmd.toFixed(4)}<br>` +
            pValueStr +
            `Cluster: ${clusterId}<br>` +
            `Genes: ${geneCount}`
          );
        }
      });

      if (xValues.length > 0) {
        traces.push({
          type: 'scatter',
          mode: 'markers',
          name: `Cluster ${clusterId} (${categoryIds.length})`,
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
          visible: isClusterHidden ? 'legendonly' : true,
        });
      }
    });

    return traces;
  }, [clusterAssignments, categoryData, uniqueClusterIds, hiddenClusters, focusMap, displayMode, getPointStyle, shouldHidePoint]);

  // Calculate Y-axis range to show all clusters with padding
  // Must be before early returns to comply with React hooks rules
  const yAxisRange = useMemo(() => {
    if (uniqueClusterIds.length === 0) return undefined;
    const minCluster = Math.min(...uniqueClusterIds);
    const maxCluster = Math.max(...uniqueClusterIds);
    return [minCluster - 0.8, maxCluster + 0.8];
  }, [uniqueClusterIds]);

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

  const layout: any = {
    title: {
      text: `Gene Clusters: BMD by Cluster (${categoryCount} categories, ${uniqueClusterIds.length} clusters)`,
      font: { size: 16 },
    },
    xaxis: {
      title: { text: 'BMD Median' },
      type: 'log',
      autorange: true,
      gridcolor: DEFAULT_GRID_COLOR,
    },
    yaxis: {
      title: { text: 'Gene Cluster ID' },
      tickmode: 'array',
      tickvals: uniqueClusterIds,
      ticktext: uniqueClusterIds.map(id => `Cluster ${id}`),
      range: yAxisRange,
      gridcolor: DEFAULT_GRID_COLOR,
    },
    height: Math.max(400, uniqueClusterIds.length * 80 + 150),
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
          {uniqueClusterIds.map((clusterId, index) => {
            const color = CLUSTER_COLOR_PALETTE[index % CLUSTER_COLOR_PALETTE.length];
            const isHidden = hiddenClusters.has(clusterId);
            const count = Array.from(clusterAssignments.values()).filter(c => c === clusterId).length;

            return (
              <div
                key={clusterId}
                onClick={() => toggleCluster(clusterId)}
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
                  Cluster {clusterId} ({count})
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
