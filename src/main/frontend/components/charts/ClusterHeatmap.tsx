/**
 * ClusterHeatmap Component
 *
 * Visualizes hierarchical clustering results as a heatmap where:
 * - Y-axis shows categories ordered by dendrogram (similar categories adjacent)
 * - X-axis shows BMD values (log scale)
 * - Color indicates cluster membership
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 *
 * This visualization helps identify groups of categories with similar
 * gene activity patterns and their associated BMD distributions.
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
  /** Maximum categories to display (default: 100) */
  maxCategories?: number;
  /** Initial linkage method */
  initialLinkageMethod?: LinkageMethod;
}

export default function ClusterHeatmap({
  maxCategories = 100,
  initialLinkageMethod = 'average',
}: ClusterHeatmapProps) {
  const [linkageMethod, setLinkageMethod] = useState<LinkageMethod>(initialLinkageMethod);

  const {
    orderedCategoryIds,
    orderedClusterIds,
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

  // Build heatmap data
  const plotData = useMemo(() => {
    if (orderedCategoryIds.length === 0) return null;

    // Limit categories for performance
    const displayCount = Math.min(orderedCategoryIds.length, maxCategories);
    const displayCategoryIds = orderedCategoryIds.slice(0, displayCount);
    const displayClusterIds = orderedClusterIds.slice(0, displayCount);

    // Get BMD values and labels for display, filtering by displayMode
    const categoryLabels: string[] = [];
    const bmdValues: number[] = [];
    const markerColors: string[] = [];
    const markerOpacities: number[] = [];
    const markerSizes: number[] = [];
    const markerLineWidths: number[] = [];
    const markerLineColors: string[] = [];
    const hoverTexts: string[] = [];

    displayCategoryIds.forEach((categoryId, index) => {
      const cat = categoryData.get(categoryId);
      const clusterId = displayClusterIds[index];
      const inFocus = focusMap.get(categoryId) ?? true;

      // Filter based on displayMode (isolate mode hides out-of-focus)
      if (shouldHidePoint(inFocus)) return;

      // Truncate long labels
      let label = cat?.categoryDescription || categoryId;
      if (label.length > 50) {
        label = label.substring(0, 47) + '...';
      }
      categoryLabels.push(label);

      // Get BMD value (use median, fallback to mean)
      const bmd = cat?.bmdMedian ?? cat?.bmdMean ?? 0;
      bmdValues.push(bmd > 0 ? bmd : 0.001); // Avoid log(0)

      // Get cluster color and apply inFocus styling
      const colorIndex = uniqueClusterIds.indexOf(clusterId);
      const baseColor = colorIndex >= 0
        ? CLUSTER_COLOR_PALETTE[colorIndex % CLUSTER_COLOR_PALETTE.length]
        : OUTLIER_COLOR;

      const style = getPointStyle(inFocus, baseColor);
      markerColors.push(style.color);
      markerOpacities.push(style.opacity);
      markerSizes.push(12);
      markerLineWidths.push(style.lineWidth);
      markerLineColors.push(style.lineColor);

      hoverTexts.push(
        `Category: ${cat?.categoryDescription || categoryId}<br>` +
        `BMD Median: ${cat?.bmdMedian?.toFixed(4) || 'N/A'}<br>` +
        `Cluster: ${clusterId}<br>` +
        `Genes: ${cat?.genesThatPassedAllFilters || 0}`
      );
    });

    if (categoryLabels.length === 0) {
      return null;
    }

    // Create scatter trace showing BMD by category, colored by cluster
    const trace: any = {
      type: 'scatter',
      mode: 'markers',
      x: bmdValues,
      y: categoryLabels,
      marker: {
        size: markerSizes,
        color: markerColors,
        opacity: markerOpacities,
        symbol: 'circle',
        line: {
          color: markerLineColors,
          width: markerLineWidths,
        },
      },
      text: hoverTexts,
      hovertemplate: '%{text}<extra></extra>',
    };

    return [trace];
  }, [orderedCategoryIds, orderedClusterIds, categoryData, uniqueClusterIds, maxCategories, focusMap, displayMode, getPointStyle, shouldHidePoint]);

  // Build cluster legend
  const clusterLegend = useMemo(() => {
    return uniqueClusterIds.map((clusterId, index) => ({
      id: clusterId,
      color: CLUSTER_COLOR_PALETTE[index % CLUSTER_COLOR_PALETTE.length],
      count: orderedClusterIds.filter(c => c === clusterId).length,
    }));
  }, [uniqueClusterIds, orderedClusterIds]);

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

  if (!plotData || orderedCategoryIds.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for cluster heatmap
      </div>
    );
  }

  // Calculate height based on visible items
  const visibleCount = plotData[0]?.y?.length || 0;
  const chartHeight = Math.max(400, visibleCount * 20 + 150);

  const layout: any = {
    title: {
      text: `Gene Cluster Heatmap (${categoryCount} categories, ${uniqueClusterIds.length} clusters)`,
      font: { size: 16 },
    },
    xaxis: {
      title: { text: 'BMD Median' },
      type: 'log',
      autorange: true,
      gridcolor: DEFAULT_GRID_COLOR,
    },
    yaxis: {
      title: { text: '' },
      autorange: true,
      tickfont: { size: 10 },
      dtick: 1,
    },
    height: chartHeight,
    margin: { l: 250, r: 100, t: 60, b: 60 },
    hovermode: 'closest',
    ...DEFAULT_LAYOUT_STYLES,
    showlegend: false,
  };

  const config = createPlotlyConfig();

  return (
    <div style={{ width: '100%' }}>
      {/* Controls */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '16px' }}>
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

      {/* Cluster Legend */}
      <div style={{
        marginBottom: '1rem',
        padding: '0.75rem',
        background: '#f5f5f5',
        borderRadius: '4px',
        border: '1px solid #d9d9d9'
      }}>
        <Text strong style={{ marginRight: '12px' }}>Clusters:</Text>
        <Space wrap>
          {clusterLegend.map(({ id, color, count }) => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: 12,
                height: 12,
                backgroundColor: color,
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.1)',
              }} />
              <Text style={{ fontSize: '12px' }}>
                Cluster {id} ({count})
              </Text>
            </div>
          ))}
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

      {visibleCount < categoryCount && (
        <div style={{ textAlign: 'center', color: '#666', fontSize: '12px', marginTop: '8px' }}>
          Showing {visibleCount} of {categoryCount} categories
        </div>
      )}
    </div>
  );
}
