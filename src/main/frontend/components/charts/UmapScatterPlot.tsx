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

  // Reference space visibility state: 'full' -> 'dimmed' -> 'hidden' -> 'full'
  const [backdropVisibility, setBackdropVisibility] = React.useState<'full' | 'dimmed' | 'hidden'>('full');

  // Non-selected cluster display mode: 'full' -> 'outline' -> 'hidden' when selection exists
  const [nonSelectedDisplayMode, setNonSelectedDisplayMode] = React.useState<'full' | 'outline' | 'hidden'>('full');

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
    // Visibility controlled by backdropVisibility state
    // Note: Use opacity instead of visible:false to keep legend item clickable
    const backdropOpacity = backdropVisibility === 'full' ? 0.4 : backdropVisibility === 'dimmed' ? 0.1 : 0;
    const isBackdropHidden = backdropVisibility !== 'full';

    result.push({
      x: allUmapData.map(p => p.UMAP_1),
      y: allUmapData.map(p => p.UMAP_2),
      text: allUmapData.map(p => `${p.go_id}: ${p.go_term}<br>Cluster: ${p.cluster_id}`),
      mode: 'markers',
      type: 'scatter',
      name: 'Reference Space',
      marker: {
        size: 3,
        color: isBackdropHidden ? 'rgba(0,0,0,0)' : '#000000', // Transparent when hidden/dimmed
        opacity: backdropOpacity,
        line: {
          width: isBackdropHidden ? 1 : 0,
          color: '#000000'
        },
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

      // Check if ANY category from this cluster is selected
      const isClusterSelected = hasSelection && points.some(p => categoryState.isSelected(p.go_id));

      // Determine marker styling based on selection state and display mode
      let markerColor = clusterColors[clusterId];
      let markerLineWidth = 0;
      let markerOpacity = 1.0;
      let visible: boolean | 'legendonly' = true;

      if (hasSelection && !isClusterSelected) {
        // This cluster is NOT selected, apply non-selected display mode
        if (nonSelectedDisplayMode === 'outline') {
          // Outline mode: transparent fill with colored border
          markerColor = `rgba(${parseInt(clusterColors[clusterId].slice(1,3), 16)}, ${parseInt(clusterColors[clusterId].slice(3,5), 16)}, ${parseInt(clusterColors[clusterId].slice(5,7), 16)}, 0)`;
          markerLineWidth = 1;
        } else if (nonSelectedDisplayMode === 'hidden') {
          // Hidden mode: set opacity to 0 but keep trace visible for legend
          markerOpacity = 0;
        }
      }

      result.push({
        x: points.map(p => p.UMAP_1),
        y: points.map(p => p.UMAP_2),
        text: points.map(p => `${p.go_id}: ${p.go_term}<br>Cluster: ${clusterId}<br><b>FILTERED</b>`),
        mode: 'markers',
        type: 'scatter',
        name: `Cluster ${clusterId}`,
        marker: {
          size: 8,
          color: markerColor,
          opacity: markerOpacity,
          line: {
            width: markerLineWidth,
            color: clusterColors[clusterId]
          },
        },
        hoverinfo: 'text',
        showlegend: true,
        legendgroup: `cluster_${clusterId}`,
        customdata: points.map(p => p.go_id),
      });
    });

    return result;
  }, [allUmapData, filteredPoints, clusterColors, categoryState.selectedIds.size, categoryState.isSelected, backdropVisibility, nonSelectedDisplayMode]);

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

  // Handle legend click - select all categories in a cluster
  const handleLegendClick = useCallback((event: any) => {
    if (!event || event.curveNumber === undefined) {
      return false; // Allow default behavior
    }

    // Get the trace that was clicked
    const trace = traces[event.curveNumber];
    if (!trace || !trace.name) {
      return false;
    }

    // Handle Reference Space clicks - 3-way toggle
    if (trace.name === 'Reference Space') {
      // Cycle through: full -> dimmed -> hidden -> full
      setBackdropVisibility(current => {
        if (current === 'full') {
          console.log('[UmapScatterPlot] Reference Space: full -> dimmed');
          return 'dimmed';
        } else if (current === 'dimmed') {
          console.log('[UmapScatterPlot] Reference Space: dimmed -> hidden');
          return 'hidden';
        } else {
          console.log('[UmapScatterPlot] Reference Space: hidden -> full');
          return 'full';
        }
      });
      return false; // Prevent default legend toggle
    }

    // Extract cluster ID from trace name (format: "Cluster X")
    const clusterMatch = trace.name.match(/Cluster (\S+)/);
    if (!clusterMatch) {
      return false;
    }

    const clusterId = clusterMatch[1];

    // Check if Cmd (Mac) or Ctrl (Windows/Linux) key is pressed for multi-select
    const isMultiSelect = event.event?.ctrlKey || event.event?.metaKey;

    console.log('[UmapScatterPlot] Legend clicked for cluster:', clusterId, 'multiselect:', isMultiSelect);

    // Find all category IDs in this cluster (from filtered points)
    const categoriesInCluster = filteredPoints
      .filter(point => String(point.cluster_id) === clusterId)
      .map(point => point.go_id);

    console.log('[UmapScatterPlot] Categories in cluster:', categoriesInCluster.length);

    // Check if this cluster is currently selected
    const isClusterSelected = categoriesInCluster.some(catId => categoryState.selectedIds.has(catId));

    if (!isClusterSelected) {
      // Cluster not selected - first click selects it AND makes non-selected markers outline
      console.log('[UmapScatterPlot] Selecting cluster, non-selected -> outline');
      setNonSelectedDisplayMode('outline');

      if (isMultiSelect) {
        // Multi-select: add to existing selection
        const currentSelection = Array.from(categoryState.selectedIds);
        const mergedSelection = [...new Set([...currentSelection, ...categoriesInCluster])];
        categoryState.handleMultiSelect(mergedSelection, 'umap');
      } else {
        // Single select: replace selection
        categoryState.handleMultiSelect(categoriesInCluster, 'umap');
      }
    } else {
      // Cluster is selected - cycle through: outline -> hidden -> deselect
      if (nonSelectedDisplayMode === 'outline') {
        console.log('[UmapScatterPlot] Switching to hidden mode');
        setNonSelectedDisplayMode('hidden');
      } else if (nonSelectedDisplayMode === 'hidden') {
        // hidden -> deselect
        console.log('[UmapScatterPlot] Deselecting cluster');
        setNonSelectedDisplayMode('full'); // Reset for next selection

        if (isMultiSelect) {
          // Multi-select: remove from selection
          const currentSelection = Array.from(categoryState.selectedIds);
          const categoriesInClusterSet = new Set(categoriesInCluster);
          const newSelection = currentSelection.filter(catId => !categoriesInClusterSet.has(String(catId)));

          if (newSelection.length > 0) {
            categoryState.handleMultiSelect(newSelection, 'umap');
          } else {
            categoryState.handleClear();
          }
        } else {
          // Single select: clear all
          categoryState.handleClear();
        }
      } else {
        // Should not happen, but if in 'full' mode, go to outline
        console.log('[UmapScatterPlot] Unexpected state, switching to outline mode');
        setNonSelectedDisplayMode('outline');
      }
    }

    // Return false to prevent default legend toggle behavior
    return false;
  }, [traces, filteredPoints, categoryState, nonSelectedDisplayMode]);

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
          <Tooltip title="GO terms are embedded in 2D space based on semantic similarity. Points closer together represent related biological processes. Use box/lasso select to filter categories, or click a cluster in the legend to select it. Click again to make non-selected clusters outline-only, then hidden, then deselect. Hold Cmd/Ctrl while clicking to add/remove multiple clusters. Click 'Reference Space' to cycle backdrop visibility: full → dimmed → hidden.">
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
        onLegendClick={handleLegendClick}
        style={{ width: '100%' }}
      />

      <div style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
        <p>
          <strong>How to use:</strong> Use the lasso or box select tool to select GO terms, or click a cluster in the legend to select it.
          Click again to cycle through views of <strong>non-selected clusters</strong>: filled → outline → hidden, then click once more to deselect.
          Hold <strong>Cmd/Ctrl</strong> while clicking legend items to add/remove multiple clusters from your selection.
          Click <strong>Reference Space</strong> legend item to cycle backdrop visibility (full → dimmed → hidden).
          All visualizations will update to show only the selected categories.
          Small black points form the backdrop (entire UMAP reference space).
          Colored points are categories that pass the Master Filter.
        </p>
      </div>
    </Card>
  );
}
