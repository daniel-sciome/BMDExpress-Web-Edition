// UmapScatterPlot.tsx
// UMAP scatter plot showing GO term semantic embeddings with interactive selection
// Reacts to individual category selections (table, ClusterPicker, lasso select) - NO legend interaction
// Respects global displayMode from visibilitySlice for consistent styling across table and charts
// Two-layer styling: inFocus-based (primary filter) + selection highlighting (additive)

import React, { useMemo, useCallback, useState } from 'react';
import Plot from 'react-plotly.js';
import { Card, Button, Space, Tag, Tooltip } from 'antd';
import { ClearOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useReactiveState } from 'Frontend/components/charts/hooks/useReactiveState';
import { useFocusAwareStyling } from 'Frontend/components/charts/hooks/useFocusAwareStyling';
import { umapDataService } from 'Frontend/data/umapDataService';
import { useClusterColors } from './utils/clusterColors';
import { createPlotlyConfig } from './utils/plotlyConfig';
import { useChartAppearance } from './hooks/useChartAppearance';
import type { ReferenceUmapItem } from 'Frontend/data/referenceUmapData';

interface UmapScatterPlotProps {
  height?: number;
  chartId?: string;
}

export default function UmapScatterPlot({ height = 600, chartId }: UmapScatterPlotProps) {
  // Use reactive state hook - UMAP reacts to category selections
  const categoryState = useReactiveState('categoryId');

  // Get ALL data with inFocus state and displayMode from shared hook
  const { data: allCategories, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();
  const { applyToLayout: applyAppearance } = useChartAppearance(chartId);

  // Reference space visibility toggle
  const [showReference, setShowReference] = useState<boolean>(true);

  // Debug logging
  React.useEffect(() => {
    console.log('[UmapScatterPlot] categoryState changed:', {
      selectedCount: categoryState.selectedIds.size,
      source: categoryState.source,
      selectedIds: Array.from(categoryState.selectedIds).slice(0, 5)
    });
  }, [categoryState.selectedIds, categoryState.source]);

  // Create maps for GO ID to inFocus state
  const goIdToFocus = useMemo(() => {
    const map = new Map<string, boolean>();
    allCategories.forEach(cat => {
      if (cat.categoryId) {
        map.set(cat.categoryId, cat.inFocus);
      }
    });
    return map;
  }, [allCategories]);

  // Get all GO IDs that exist in the analysis (regardless of filter)
  const analysisGoIds = useMemo(() => {
    return new Set(allCategories.map(cat => cat.categoryId).filter(Boolean) as string[]);
  }, [allCategories]);

  // Count in-focus categories
  const inFocusCount = useMemo(() => {
    return allCategories.filter(cat => cat.inFocus).length;
  }, [allCategories]);

  // Get all UMAP reference data
  const allUmapData = useMemo(() => umapDataService.getAllData(), []);

  // Get UMAP points that are in our analysis (regardless of filter)
  const analysisPoints = useMemo(() => {
    return allUmapData.filter(item => analysisGoIds.has(item.go_id));
  }, [allUmapData, analysisGoIds]);

  // Get cluster colors using shared utility
  const clusterColors = useClusterColors();

  // Group analysis points by cluster (includes all categories, not just in-focus)
  const clusterData = useMemo(() => {
    const byCluster = new Map<string | number, ReferenceUmapItem[]>();
    analysisPoints.forEach(point => {
      const clusterId = point.cluster_id;
      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push(point);
    });
    return byCluster;
  }, [analysisPoints]);

  // Create traces with inFocus-based styling + selection highlighting
  const traces = useMemo(() => {
    console.log('[UmapScatterPlot] Recomputing traces. inFocus:', inFocusCount, 'selected:', categoryState.selectedIds.size);
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

    // Layer 2: Cluster traces with inFocus-based styling
    const sortedClusters = Array.from(clusterData.keys()).sort((a, b) => {
      if (a === -1) return 1;
      if (b === -1) return -1;
      return Number(a) - Number(b);
    });

    sortedClusters.forEach((clusterId) => {
      const points = clusterData.get(clusterId)!;
      const baseColor = clusterColors[clusterId] || '#999999';

      // Individual point-level styling based on inFocus state
      const markerColors: string[] = [];
      const markerSizes: number[] = [];
      const markerOpacities: number[] = [];
      const markerLineWidths: number[] = [];
      const markerLineColors: string[] = [];

      // Track which points to include (for isolate mode)
      const includedPoints: ReferenceUmapItem[] = [];

      points.forEach(point => {
        const inFocus = goIdToFocus.get(point.go_id) ?? false;
        const isSelected = categoryState.selectedIds.has(point.go_id);

        // In isolate mode, skip out-of-focus points entirely
        if (shouldHidePoint(inFocus)) {
          return;
        }

        includedPoints.push(point);

        // Get base style from inFocus state
        const focusStyle = getPointStyle(inFocus, baseColor);

        // Styling priority: selection > focus
        if (isSelected && hasSelection) {
          // Selected: larger, full opacity, white border
          markerColors.push(focusStyle.color);
          markerSizes.push(12);
          markerOpacities.push(1.0);
          markerLineWidths.push(2);
          markerLineColors.push('white');
        } else if (hasSelection) {
          // Not selected but something is: dim this point
          markerColors.push(focusStyle.color);
          markerSizes.push(focusStyle.size);
          markerOpacities.push(0.2); // Dim non-selected when there's a selection
          markerLineWidths.push(0);
          markerLineColors.push('white');
        } else {
          // No selection at all: use focus-based styling
          markerColors.push(focusStyle.color);
          markerSizes.push(focusStyle.size);
          markerOpacities.push(focusStyle.opacity);
          markerLineWidths.push(focusStyle.lineWidth);
          markerLineColors.push(focusStyle.lineColor);
        }
      });

      // Only add trace if there are points to show
      if (includedPoints.length > 0) {
        result.push({
          x: includedPoints.map(p => p.UMAP_1),
          y: includedPoints.map(p => p.UMAP_2),
          text: includedPoints.map(p => {
            const inFocus = goIdToFocus.get(p.go_id) ?? false;
            return `${p.go_id}: ${p.go_term}<br>Cluster: ${clusterId}<br>${inFocus ? '<b>IN FOCUS</b>' : 'out of focus'}`;
          }),
          customdata: includedPoints.map(p => p.go_id),
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
      }
    });

    return result;
  }, [allUmapData, clusterData, clusterColors, goIdToFocus, categoryState.selectedIds, showReference, displayMode, getPointStyle, shouldHidePoint, inFocusCount]);

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
  const layout: any = applyAppearance({
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
  });

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
          <Tooltip title="GO terms are embedded in 2D space based on semantic similarity. Points closer together represent related biological processes. Selected categories have larger markers with white borders. Other categories in the same cluster show as outlines. Categories in other clusters are faded. Select via table rows, box/lasso select, or Cluster Picker.">
            <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
          </Tooltip>
        </Space>
      }
      extra={
        <Space>
          <Tag color="blue">{inFocusCount} in focus</Tag>
          <Tag color="default">{analysisPoints.length} total</Tag>
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
      <div style={{ width: '100%', aspectRatio: '2/1' }}>
        <Plot
          data={traces as any}
          layout={layout}
          config={config}
          onSelected={handleSelected}
          onDeselect={handleDeselect}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>

      <div style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
        <p>
          <strong>How to use:</strong> Select individual categories by clicking table rows, using the lasso/box select tool on this plot, or use the <strong>Cluster Picker</strong> in the sidebar to select entire clusters.
        </p>
        <p style={{ marginTop: '8px' }}>
          <strong>Visualization:</strong> In-focus categories (passing Primary Filter) appear with <strong>full-size markers</strong>.
          Out-of-focus categories are <strong>dimmed or hidden</strong> based on the display mode setting.
          Selected categories have <strong>larger markers with white borders</strong>.
          Small black points form the backdrop (entire UMAP reference space).
        </p>
      </div>
    </Card>
  );
}
