// UmapScatterPlot.tsx
// UMAP scatter plot showing GO term semantic embeddings with interactive selection
// Phase 4: Uses reactive selection infrastructure

import React, { useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { Card, Button, Space, Tag, Tooltip } from 'antd';
import { ClearOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAppSelector } from 'Frontend/store/hooks';
import { selectFilteredData } from 'Frontend/store/slices/categoryResultsSlice';
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

  // Get FILTERED analysis results (after Master Filter is applied)
  const filteredCategories = useAppSelector(selectFilteredData);

  // Debug logging
  React.useEffect(() => {
    console.log('[UmapScatterPlot] Component mounted/updated:', {
      filteredCount: filteredCategories.length,
      selectedCount: categoryState.selectedIds.size,
      firstCategory: filteredCategories[0]?.categoryDescription || 'none',
      firstCategoryId: filteredCategories[0]?.categoryId || 'none',
      first5Categories: filteredCategories.slice(0, 5).map(c => ({
        id: c.categoryId,
        desc: c.categoryDescription?.substring(0, 40)
      }))
    });
    return () => {
      console.log('[UmapScatterPlot] Component unmounting');
    };
  }, [filteredCategories.length, categoryState.selectedIds.size]);

  // Create a set of GO IDs that pass the Master Filter
  const filteredGoIds = useMemo(() => {
    return new Set(filteredCategories.map(cat => cat.categoryId).filter(Boolean) as string[]);
  }, [filteredCategories]);

  // Get all UMAP reference data
  const allUmapData = useMemo(() => umapDataService.getAllData(), []);

  // Filter to only categories that pass the Master Filter
  const filteredPoints = useMemo(() => {
    return allUmapData.filter(item => filteredGoIds.has(item.go_id));
  }, [allUmapData, filteredGoIds]);

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

    // Layer 1: Backdrop - ALL reference points in black (entire UMAP space)
    result.push({
      x: allUmapData.map(p => p.UMAP_1),
      y: allUmapData.map(p => p.UMAP_2),
      text: allUmapData.map(p => `${p.go_id}: ${p.go_term}<br>Cluster: ${p.cluster_id}`),
      mode: 'markers',
      type: 'scatter',
      name: 'Reference Space',
      marker: {
        size: 3,
        color: '#000000', // Black
        opacity: 0.4,
        line: { width: 0 },
      },
      hoverinfo: 'text',
      showlegend: true,
    });

    // Layer 2: Overlay - Only filtered categories, grouped by cluster, with reactive styling
    const filteredClusterGroups = new Map<string | number, ReferenceUmapItem[]>();
    filteredPoints.forEach(point => {
      const clusterId = point.cluster_id;
      if (!filteredClusterGroups.has(clusterId)) {
        filteredClusterGroups.set(clusterId, []);
      }
      filteredClusterGroups.get(clusterId)!.push(point);
    });

    // Create a trace for each cluster (filtered points with reactive styling)
    Array.from(filteredClusterGroups.entries()).forEach(([clusterId, points]) => {
      const hasSelection = categoryState.selectedIds.size > 0;

      result.push({
        x: points.map(p => p.UMAP_1),
        y: points.map(p => p.UMAP_2),
        text: points.map(p => `${p.go_id}: ${p.go_term}<br>Cluster: ${clusterId}<br><b>FILTERED</b>`),
        mode: 'markers',
        type: 'scatter',
        name: `Cluster ${clusterId}`,
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
        showlegend: true,
        legendgroup: `cluster_${clusterId}`,
        customdata: points.map(p => p.go_id),
      });
    });

    return result;
  }, [allUmapData, filteredPoints, clusterColors, categoryState.selectedIds.size, categoryState.isSelected]);

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
          <Tag color="blue">{filteredPoints.length} filtered</Tag>
          <Tag color="default">{allUmapData.length} reference</Tag>
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
          Small light gray points form the backdrop (entire UMAP reference space).
          Colored points are categories that pass the Master Filter.
        </p>
      </div>
    </Card>
  );
}
