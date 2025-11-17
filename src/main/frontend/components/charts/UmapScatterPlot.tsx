// UmapScatterPlot.tsx
// UMAP scatter plot showing GO term semantic embeddings with interactive selection
// Reacts to individual category selections (table, ClusterPicker, lasso select) - NO legend interaction

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

      // Individual point-level styling based on whether each specific category is selected
      const markerColors: string[] = [];
      const markerSizes: number[] = [];
      const markerOpacities: number[] = [];
      const markerLineWidths: number[] = [];
      const markerLineColors: string[] = [];

      points.forEach(point => {
        const isPointSelected = categoryState.selectedIds.has(point.go_id);

        if (hasSelection) {
          if (isPointSelected) {
            // This specific point is selected - make it stand out
            markerColors.push(baseColor);
            markerSizes.push(10);
            markerOpacities.push(1.0);
            markerLineWidths.push(2);
            markerLineColors.push('white');
          } else {
            // This point is NOT selected - fade it out
            markerColors.push(baseColor);
            markerSizes.push(8);
            markerOpacities.push(0.2);
            markerLineWidths.push(0);
            markerLineColors.push('white');
          }
        } else {
          // No selection - normal styling
          markerColors.push(baseColor);
          markerSizes.push(8);
          markerOpacities.push(1.0);
          markerLineWidths.push(0);
          markerLineColors.push('white');
        }
      });

      result.push({
        x: points.map(p => p.UMAP_1),
        y: points.map(p => p.UMAP_2),
        text: points.map(p => `${p.go_id}: ${p.go_term}<br>Cluster: ${clusterId}<br><b>FILTERED</b>`),
        customdata: points.map(p => p.go_id),
        mode: 'markers',
        type: 'scatter',
        name: `Cluster ${clusterId}`,
        marker: {
          color: markerColors,
          size: markerSizes,
          opacity: markerOpacities,
          line: {
            color: markerLineColors,
            width: markerLineWidths,
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
          <Tooltip title="GO terms are embedded in 2D space based on semantic similarity. Points closer together represent related biological processes. Individual selected categories are highlighted with larger markers and white borders. Select via table rows, box/lasso select, or Cluster Picker.">
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
          <strong>How to use:</strong> Select individual categories by clicking table rows, using the lasso/box select tool on this plot, or use the <strong>Cluster Picker</strong> in the sidebar to select entire clusters.
          Selected categories will be highlighted with larger markers and white borders.
          Small black points form the backdrop (entire UMAP reference space).
          Colored points are categories that pass the Master Filter.
        </p>
      </div>
    </Card>
  );
}
