// UmapScatterPlot.tsx
// UMAP scatter plot showing GO term semantic embeddings with interactive selection
// Reacts to ClusterPicker selections only - NO legend interaction

import React, { useMemo, useCallback, useState } from 'react';
import Plot from 'react-plotly.js';
import { Card, Button, Space, Tag, Tooltip } from 'antd';
import { ClearOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAppSelector } from 'Frontend/store/hooks';
import { selectFilteredData } from 'Frontend/store/slices/categoryResultsSlice';
import { useReactiveState } from 'Frontend/components/charts/hooks/useReactiveState';
import { umapDataService } from 'Frontend/data/umapDataService';
import { useClusterColors } from './utils/clusterColors';
import { createPlotlyConfig } from './utils/plotlyConfig';
import type { ReferenceUmapItem } from 'Frontend/data/referenceUmapData';

interface UmapScatterPlotProps {
  height?: number;
}

export default function UmapScatterPlot({ height = 600 }: UmapScatterPlotProps) {
  // Use reactive state hook - UMAP reacts to category selections
  const categoryState = useReactiveState('categoryId');

  // Reference space visibility toggle
  const [showReference, setShowReference] = useState<boolean>(true);

  // Get FILTERED analysis results (after Master Filter is applied)
  const filteredCategories = useAppSelector(selectFilteredData);

  // Debug logging
  React.useEffect(() => {
    console.log('[UmapScatterPlot] categoryState changed:', {
      selectedCount: categoryState.selectedIds.size,
      source: categoryState.source,
      selectedIds: Array.from(categoryState.selectedIds).slice(0, 5)
    });
  }, [categoryState.selectedIds, categoryState.source]);

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

  // Get cluster colors using shared utility
  const clusterColors = useClusterColors();

  // Group filtered points by cluster
  const clusterData = useMemo(() => {
    const byCluster = new Map<string | number, ReferenceUmapItem[]>();
    filteredPoints.forEach(point => {
      const clusterId = point.cluster_id;
      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push(point);
    });
    return byCluster;
  }, [filteredPoints]);

  // Create traces with reactive styling
  const traces = useMemo(() => {
    console.log('[UmapScatterPlot] Recomputing traces. Selection:', {
      selectedCount: categoryState.selectedIds.size,
      selectedIds: Array.from(categoryState.selectedIds).slice(0, 5),
      source: categoryState.source,
    });
    const result: any[] = [];

    const hasSelection = categoryState.selectedIds.size > 0;

    // Layer 1: Backdrop - ALL reference points (entire UMAP space)
    if (showReference) {
      result.push({
        x: allUmapData.map(p => p.UMAP_1),
        y: allUmapData.map(p => p.UMAP_2),
        text: allUmapData.map(p => `${p.go_id}: ${p.go_term}<br>Cluster: ${p.cluster_id}`),
        mode: 'markers',
        type: 'scatter',
        name: 'Reference Space',
        marker: {
          size: 3,
          color: '#000000',
          opacity: 0.2,
        },
        hoverinfo: 'text',
        showlegend: false,
      });
    }

    // Layer 2: Cluster traces with reactive styling
    const sortedClusters = Array.from(clusterData.keys()).sort((a, b) => {
      if (a === -1) return 1;
      if (b === -1) return -1;
      return Number(a) - Number(b);
    });

    sortedClusters.forEach((clusterId) => {
      const points = clusterData.get(clusterId)!;
      const baseColor = clusterColors[clusterId] || '#999999';

      // Check if ANY category from this cluster is selected
      const isClusterSelected = hasSelection && points.some(p => categoryState.selectedIds.has(p.go_id));

      let markerColor = baseColor;
      let markerSize = 8;
      let markerOpacity = 1.0;
      let markerLineWidth = 0;
      let markerLineColor = 'white';

      if (hasSelection) {
        if (isClusterSelected) {
          // This cluster is selected - make it stand out
          markerSize = 10;
          markerLineWidth = 2;
          markerLineColor = 'white';
        } else {
          // This cluster is NOT selected - fade it out
          markerOpacity = 0.2;
        }
      }

      result.push({
        x: points.map(p => p.UMAP_1),
        y: points.map(p => p.UMAP_2),
        text: points.map(p => `${p.go_id}: ${p.go_term}<br>Cluster: ${clusterId}<br><b>FILTERED</b>`),
        customdata: points.map(p => p.go_id),
        mode: 'markers',
        type: 'scatter',
        name: `Cluster ${clusterId}`,
        marker: {
          color: markerColor,
          size: markerSize,
          opacity: markerOpacity,
          line: {
            color: markerLineColor,
            width: markerLineWidth,
          },
        },
        hoverinfo: 'text',
        showlegend: false,
      });
    });

    return result;
  }, [allUmapData, clusterData, clusterColors, categoryState.selectedIds, showReference]);

  // Handle Plotly selection events
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
    showlegend: false,
    margin: { l: 60, r: 60, t: 80, b: 60 },
  };

  // Config for Plotly
  const config = createPlotlyConfig({
    modeBarButtonsToAdd: [],
    modeBarButtonsToRemove: ['autoScale2d'],
  });

  return (
    <Card
      title={
        <Space>
          <span>UMAP Semantic Space</span>
          <Tooltip title="GO terms are embedded in 2D space based on semantic similarity. Points closer together represent related biological processes. Use box/lasso select to filter categories, or use the Cluster Picker in the sidebar to select clusters.">
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
          <Button
            size="small"
            onClick={() => setShowReference(!showReference)}
          >
            {showReference ? 'Hide' : 'Show'} Reference
          </Button>
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
          <strong>How to use:</strong> Use the lasso or box select tool to select GO terms, or use the <strong>Cluster Picker</strong> in the sidebar to select entire clusters.
          All visualizations will update to show only the selected categories.
          Small black points form the backdrop (entire UMAP reference space).
          Colored points are categories that pass the Master Filter.
        </p>
      </div>
    </Card>
  );
}
