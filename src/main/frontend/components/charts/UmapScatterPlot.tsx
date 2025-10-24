// UmapScatterPlot.tsx
// UMAP scatter plot showing GO term semantic embeddings with interactive selection
// Phase 4: Uses reactive selection infrastructure

import React, { useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { Card, Button, Space, Tag, Tooltip } from 'antd';
import { ClearOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAppSelector } from 'Frontend/store/hooks';
import { useReactiveState } from 'Frontend/components/charts/hooks/useReactiveState';
import { umapDataService } from 'Frontend/data/umapDataService';
import type { ReferenceUmapItem } from 'Frontend/data/referenceUmapData';

interface UmapScatterPlotProps {
  height?: number;
}

/**
 * UMAP scatter plot component
 * Shows all GO terms in UMAP embedding space with clusters
 * Highlights GO terms that exist in current analysis results
 * Supports interactive selection via box/lasso select
 */
export default function UmapScatterPlot({ height = 600 }: UmapScatterPlotProps) {
  // Phase 4: Use reactive state hook - UMAP reacts to category selections
  const categoryState = useReactiveState('categoryId');

  // Get current analysis results to highlight which GO terms are present
  const analysisCategories = useAppSelector(state => state.categoryResults.data);

  // Create a set of GO IDs that are in the current analysis
  const analysisGoIds = useMemo(() => {
    return new Set(analysisCategories.map(cat => cat.categoryId).filter(Boolean) as string[]);
  }, [analysisCategories]);

  // Get all UMAP reference data
  const allUmapData = useMemo(() => umapDataService.getAllData(), []);

  // Separate data into analysis categories vs. reference-only
  const { analysisPoints, referencePoints } = useMemo(() => {
    const analysis: ReferenceUmapItem[] = [];
    const reference: ReferenceUmapItem[] = [];

    allUmapData.forEach(item => {
      if (analysisGoIds.has(item.go_id)) {
        analysis.push(item);
      } else {
        reference.push(item);
      }
    });

    return { analysisPoints: analysis, referencePoints: reference };
  }, [allUmapData, analysisGoIds]);

  // Get unique cluster IDs and create color mapping
  const clusterColors = useMemo(() => {
    const clusters = umapDataService.getAllClusterIds();
    const colors: Record<string | number, string> = {};

    // Use a color palette for clusters
    const palette = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
      '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5',
      '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173',
      '#5254a3', '#8ca252', '#bd9e39', '#ad494a', '#a55194',
      '#6b6ecf', '#b5cf6b', '#e7ba52', '#d6616b', '#ce6dbd',
      '#9c9ede', '#cedb9c', '#e7cb94', '#e7969c', '#de9ed6'
    ];

    clusters.forEach((clusterId, index) => {
      if (clusterId === -1) {
        colors[clusterId] = '#999999'; // Gray for outliers
      } else {
        colors[clusterId] = palette[index % palette.length];
      }
    });

    return colors;
  }, []);

  // Create Plotly traces
  const traces = useMemo(() => {
    const result = [];

    // Group reference points by cluster
    const clusterGroups = new Map<string | number, ReferenceUmapItem[]>();
    referencePoints.forEach(point => {
      const clusterId = point.cluster_id;
      if (!clusterGroups.has(clusterId)) {
        clusterGroups.set(clusterId, []);
      }
      clusterGroups.get(clusterId)!.push(point);
    });

    // Create a trace for each cluster (reference points)
    Array.from(clusterGroups.entries()).forEach(([clusterId, points]) => {
      result.push({
        x: points.map(p => p.UMAP_1),
        y: points.map(p => p.UMAP_2),
        text: points.map(p => `${p.go_id}: ${p.go_term}<br>Cluster: ${clusterId}`),
        mode: 'markers',
        type: 'scatter',
        name: `Cluster ${clusterId}`,
        marker: {
          size: 4,
          color: clusterColors[clusterId],
          opacity: 0.3,
          line: { width: 0 },
        },
        hoverinfo: 'text',
        showlegend: true,
        legendgroup: `cluster_${clusterId}`,
      });
    });

    // Group analysis points by cluster
    const analysisClusterGroups = new Map<string | number, ReferenceUmapItem[]>();
    analysisPoints.forEach(point => {
      const clusterId = point.cluster_id;
      if (!analysisClusterGroups.has(clusterId)) {
        analysisClusterGroups.set(clusterId, []);
      }
      analysisClusterGroups.get(clusterId)!.push(point);
    });

    // Create a trace for each cluster (analysis points - highlighted)
    // Phase 4: Apply reactive styling based on category selection
    Array.from(analysisClusterGroups.entries()).forEach(([clusterId, points]) => {
      const hasSelection = categoryState.selectedIds.size > 0;

      result.push({
        x: points.map(p => p.UMAP_1),
        y: points.map(p => p.UMAP_2),
        text: points.map(p => `${p.go_id}: ${p.go_term}<br>Cluster: ${clusterId}<br><b>IN ANALYSIS</b>`),
        mode: 'markers',
        type: 'scatter',
        name: `Cluster ${clusterId} (in analysis)`,
        marker: {
          size: points.map(p => {
            const isSelected = categoryState.isSelected(p.go_id);
            return hasSelection && isSelected ? 10 : 8;
          }),
          color: clusterColors[clusterId],
          opacity: points.map(p => {
            const isSelected = categoryState.isSelected(p.go_id);
            if (!hasSelection) return 1.0;
            return isSelected ? 1.0 : 0.15;
          }),
          line: {
            width: points.map(p => {
              const isSelected = categoryState.isSelected(p.go_id);
              return hasSelection && isSelected ? 2 : (hasSelection ? 0 : 1);
            }),
            color: '#fff'
          },
        },
        hoverinfo: 'text',
        showlegend: false,
        legendgroup: `cluster_${clusterId}`,
        customdata: points.map(p => p.go_id),
      });
    });

    return result;
  }, [referencePoints, analysisPoints, clusterColors, categoryState.selectedIds.size, categoryState.isSelected]);

  // Handle Plotly selection events
  // Phase 4: Use reactive selection actions
  const handleSelected = useCallback((event: any) => {
    if (!event || !event.points || event.points.length === 0) {
      return;
    }

    // Extract GO IDs from selected points (categoryIds)
    const selectedGoIds: string[] = [];
    event.points.forEach((point: any) => {
      // Only include points from analysis (they have customdata)
      if (point.customdata) {
        selectedGoIds.push(point.customdata as string);
      }
    });

    console.log('[UmapScatterPlot] Selected category IDs (GO IDs):', selectedGoIds);
    categoryState.handleMultiSelect(selectedGoIds, 'umap');
  }, [categoryState]);

  // Handle deselect (user clicks outside selection)
  const handleDeselect = useCallback(() => {
    console.log('[UmapScatterPlot] Selection cleared');
    categoryState.handleClear();
  }, [categoryState]);

  // Handle clear button
  const handleClearSelection = useCallback(() => {
    categoryState.handleClear();
  }, [categoryState]);

  // Layout configuration
  const layout: any = {
    title: { text: 'GO Term UMAP Embedding Space' },
    xaxis: {
      title: 'UMAP 1',
      zeroline: false,
    },
    yaxis: {
      title: 'UMAP 2',
      zeroline: false,
    },
    height,
    hovermode: 'closest' as const,
    dragmode: 'lasso' as const,
    showlegend: true,
    legend: {
      x: 1.02,
      y: 1,
      orientation: 'v' as const,
      itemsizing: 'constant' as const,
      font: { size: 10 },
    },
    margin: { l: 60, r: 200, t: 80, b: 60 },
  };

  // Config for Plotly
  const config: any = {
    displayModeBar: true,
    modeBarButtonsToAdd: [],
    modeBarButtonsToRemove: ['autoScale2d'],
    displaylogo: false,
    responsive: true,
  };

  return (
    <Card
      title={
        <Space>
          <span>UMAP Semantic Space</span>
          <Tooltip title="GO terms are embedded in 2D space based on semantic similarity. Points closer together represent related biological processes. Use box/lasso select to filter categories.">
            <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
          </Tooltip>
        </Space>
      }
      extra={
        <Space>
          <Tag color="blue">{analysisPoints.length} in analysis</Tag>
          <Tag color="default">{referencePoints.length} reference</Tag>
          {categoryState.isAnythingSelected && (
            <>
              <Tag color="orange">{categoryState.selectedIds.size} selected</Tag>
              <Button
                size="small"
                icon={<ClearOutlined />}
                onClick={handleClearSelection}
              >
                Clear Selection
              </Button>
            </>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Plot
        data={traces as any}
        layout={layout}
        config={config}
        onSelected={handleSelected}
        onDeselect={handleDeselect}
        style={{ width: '100%' }}
      />

      <div style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
        <p>
          <strong>How to use:</strong> Use the lasso or box select tool to select GO terms.
          All visualizations will update to show only the selected categories.
          Large opaque points are categories in your current analysis.
          Small transparent points are reference GO terms not in your analysis.
        </p>
      </div>
    </Card>
  );
}
