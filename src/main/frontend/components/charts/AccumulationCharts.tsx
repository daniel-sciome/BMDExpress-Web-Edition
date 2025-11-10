import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { Row, Col } from 'antd';
import { useAppSelector } from '../../store/hooks';
import { selectFilteredData } from '../../store/slices/categoryResultsSlice';
import { useReactiveState } from 'Frontend/components/charts/hooks/useReactiveState';
import { useNonSelectedDisplayMode } from 'Frontend/components/charts/hooks/useNonSelectedDisplayMode';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function AccumulationCharts() {
  // Get ALL filtered data (after Master Filter)
  const allData = useAppSelector(selectFilteredData);

  // Get selection state using reactive infrastructure
  const categoryState = useReactiveState('categoryId');
  const hasSelection = categoryState.selectedIds.size > 0;

  // Non-selected cluster display mode (same as UMAP)
  const [nonSelectedDisplayMode, setNonSelectedDisplayMode] = useNonSelectedDisplayMode(hasSelection);

  // Outliers visibility toggle (simple on/off)
  const [outliersVisible, setOutliersVisible] = useState<boolean>(true);

  const [charts, setCharts] = useState<any[]>([]);

  // Debug logging
  useEffect(() => {
    console.log('[AccumulationCharts] Component rendered:', {
      totalDataLength: allData?.length || 0,
      selectedCount: categoryState.selectedIds.size,
      hasData: !!allData && allData.length > 0
    });
  }, [allData, categoryState.selectedIds.size]);

  // Get cluster colors using shared utility
  const clusterColors = useClusterColors();

  // Separate data into selected and unselected
  const { selectedData, unselectedData } = useMemo(() => {
    if (!allData) return { selectedData: [], unselectedData: [] };

    const selected: CategoryAnalysisResultDto[] = [];
    const unselected: CategoryAnalysisResultDto[] = [];

    allData.forEach(row => {
      if (categoryState.selectedIds.has(row.categoryId || '')) {
        selected.push(row);
      } else {
        unselected.push(row);
      }
    });

    return { selectedData: selected, unselectedData: unselected };
  }, [allData, categoryState.selectedIds]);

  // Handle legend click - same behavior as UMAP
  const handleLegendClick = useCallback((event: any, traces: any[]) => {
    if (!event || event.curveNumber === undefined) {
      return false;
    }

    // Get the trace that was clicked
    const trace = traces[event.curveNumber];
    if (!trace || !trace.name) {
      return false;
    }

    // Extract cluster ID from trace name (format: "Cluster X" or "Cluster Outliers")
    const clusterMatch = trace.name.match(/Cluster (\S+)/);
    if (!clusterMatch) {
      return false;
    }

    // Special handling for outliers - simple visibility toggle
    if (clusterMatch[1] === 'Outliers') {
      console.log('[AccumulationCharts] Toggling outliers visibility:', !outliersVisible);
      setOutliersVisible(prev => !prev);
      return false; // Prevent default legend toggle
    }

    const clusterId = clusterMatch[1];

    // Check if Cmd (Mac) or Ctrl (Windows/Linux) key is pressed for multi-select
    const isMultiSelect = event.event?.ctrlKey || event.event?.metaKey;

    console.log('[AccumulationCharts] Legend clicked for cluster:', clusterId, 'multiselect:', isMultiSelect);

    // Find all category IDs in this cluster
    const categoriesInCluster = allData
      .filter(row => {
        const rowClusterId = getClusterIdForCategory(row.categoryId);
        return String(rowClusterId) === clusterId;
      })
      .map(row => row.categoryId)
      .filter(Boolean) as string[];

    console.log('[AccumulationCharts] Categories in cluster:', categoriesInCluster.length);

    // Check if this cluster is currently selected
    const isClusterSelected = categoriesInCluster.some(catId => categoryState.selectedIds.has(catId));

    if (!isClusterSelected) {
      // Cluster not selected - first click selects it AND makes non-selected markers outline
      console.log('[AccumulationCharts] Selecting cluster, non-selected -> outline');
      setNonSelectedDisplayMode('outline');

      if (isMultiSelect) {
        // Multi-select: add to existing selection
        const currentSelection = Array.from(categoryState.selectedIds);
        const mergedSelection = [...new Set([...currentSelection, ...categoriesInCluster])];
        categoryState.handleMultiSelect(mergedSelection, 'chart');
      } else {
        // Single select: replace selection
        categoryState.handleMultiSelect(categoriesInCluster, 'chart');
      }
    } else {
      // Cluster is selected - cycle through: outline -> hidden -> deselect
      if (nonSelectedDisplayMode === 'outline') {
        console.log('[AccumulationCharts] Switching to hidden mode');
        setNonSelectedDisplayMode('hidden');
      } else if (nonSelectedDisplayMode === 'hidden') {
        // hidden -> deselect
        console.log('[AccumulationCharts] Deselecting cluster');
        setNonSelectedDisplayMode('full'); // Reset for next selection

        if (isMultiSelect) {
          // Multi-select: remove from selection
          const currentSelection = Array.from(categoryState.selectedIds);
          const categoriesInClusterSet = new Set(categoriesInCluster);
          const newSelection = currentSelection.filter(catId => !categoriesInClusterSet.has(String(catId)));

          if (newSelection.length > 0) {
            categoryState.handleMultiSelect(newSelection, 'chart');
          } else {
            categoryState.handleClear();
          }
        } else {
          // Single select: clear all
          categoryState.handleClear();
        }
      } else {
        // Should not happen, but if in 'full' mode, go to outline
        console.log('[AccumulationCharts] Unexpected state, switching to outline mode');
        setNonSelectedDisplayMode('outline');
      }
    }

    // Return false to prevent default legend toggle behavior
    return false;
  }, [allData, categoryState, nonSelectedDisplayMode, outliersVisible]);

  useEffect(() => {
    if (!allData || allData.length === 0) {
      console.log('[AccumulationCharts] No data available, clearing charts');
      setCharts([]);
      return;
    }

    // Define the 6 charts with their data fields
    const chartConfigs = [
      {
        title: 'BMD Median Accumulation',
        field: 'bmdMedian',
      },
      {
        title: 'BMD Mean Accumulation',
        field: 'bmdMean',
      },
      {
        title: 'BMDL Median Accumulation',
        field: 'bmdlMedian',
      },
      {
        title: 'BMDL Mean Accumulation',
        field: 'bmdlMean',
      },
      {
        title: 'BMDU Median Accumulation',
        field: 'bmduMedian',
      },
      {
        title: 'BMDU Mean Accumulation',
        field: 'bmduMean',
      },
    ];

    const chartsData = chartConfigs.map(config => {
      const traces: any[] = [];

      // Get all values for cumulative calculation
      const allValues = allData
        .map((row: CategoryAnalysisResultDto) => ({
          value: (row as any)[config.field],
          categoryId: row.categoryId
        }))
        .filter(item => item.value != null && item.value > 0)
        .sort((a, b) => a.value - b.value);

      // Calculate x-axis range from all data (for fixed axis scaling)
      let xAxisRange: [number, number] | undefined;

      if (allValues.length > 0) {
        // Calculate fixed x-axis range in log space
        const allX = allValues.map(item => item.value);
        const xMin = Math.min(...allX);
        const xMax = Math.max(...allX);
        xAxisRange = [Math.log10(xMin), Math.log10(xMax)];

        // Group ALL categories by cluster for reactive traces
        const byCluster = new Map<string | number, Array<{x: number, y: number, categoryId: string}>>();

        allValues.forEach((item, index) => {
          const clusterId = getClusterIdForCategory(item.categoryId);
          const cumulativePercent = ((index + 1) / allValues.length) * 100;

          if (!byCluster.has(clusterId)) {
            byCluster.set(clusterId, []);
          }
          byCluster.get(clusterId)!.push({
            x: item.value,
            y: cumulativePercent,
            categoryId: item.categoryId || ''
          });
        });

        // Create a trace for each cluster with reactive styling
        byCluster.forEach((points, clusterId) => {
          // Determine marker styling based on selection state and display mode
          const baseColor = clusterColors[clusterId] || '#999999';
          let markerColor = baseColor;
          let markerSize = 8;
          let markerLineWidth = 1;
          let markerLineColor = 'white';
          let markerOpacity = 1.0;

          // Special handling for outliers - simple visibility toggle
          if (clusterId === -1) {
            markerOpacity = outliersVisible ? 1.0 : 0;
          } else {
            // Regular clusters: reactive styling based on selection
            const isClusterSelected = hasSelection && points.some(p => categoryState.isSelected(p.categoryId));

            if (hasSelection && !isClusterSelected) {
              // This cluster is NOT selected, apply non-selected display mode
              if (nonSelectedDisplayMode === 'outline') {
                // Outline mode: transparent fill with colored border
                const rgb = [
                  parseInt(baseColor.slice(1, 3), 16),
                  parseInt(baseColor.slice(3, 5), 16),
                  parseInt(baseColor.slice(5, 7), 16)
                ];
                markerColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`;
                markerLineWidth = 1;
                markerLineColor = baseColor;
              } else if (nonSelectedDisplayMode === 'hidden') {
                // Hidden mode: set opacity to 0 but keep trace visible for legend
                markerOpacity = 0;
              }
            } else if (isClusterSelected) {
              // Selected cluster: larger markers with white border
              markerSize = 10;
              markerLineWidth = 2;
            }
          }

          traces.push({
            type: 'scatter',
            mode: 'markers',
            x: points.map(p => p.x),
            y: points.map(p => p.y),
            marker: {
              color: markerColor,
              size: markerSize,
              symbol: 'circle',
              opacity: markerOpacity,
              line: {
                color: markerLineColor,
                width: markerLineWidth
              }
            },
            name: getClusterLabel(clusterId),
            hovertemplate: `${getClusterLabel(clusterId)}<br>Value: %{x:.4f}<br>Cumulative %: %{y:.1f}%<extra></extra>`,
            showlegend: true,
            legendgroup: `cluster_${clusterId}`,
          });
        });
      }

      if (traces.length === 0) {
        return null;
      }

      return {
        data: traces,
        layout: {
          title: {
            text: config.title,
            font: { size: 14 },
          },
          xaxis: {
            title: { text: 'BMD Value' },
            type: 'log',
            range: xAxisRange, // Fixed range based on background data
            gridcolor: DEFAULT_GRID_COLOR,
          },
          yaxis: {
            title: { text: 'Cumulative Percentage (%)' },
            range: [0, 100],
            gridcolor: DEFAULT_GRID_COLOR,
          },
          height: 400,
          margin: { l: 70, r: 50, t: 50, b: 50 },
          ...DEFAULT_LAYOUT_STYLES,
          showlegend: true, // Always show legend for reactive interaction
          legend: {
            x: 1,
            xanchor: 'right',
            y: 1,
          },
        },
        config: createPlotlyConfig(),
      };
    }).filter(chart => chart !== null);

    setCharts(chartsData as any[]);
  }, [allData, selectedData, unselectedData, clusterColors, hasSelection, nonSelectedDisplayMode, outliersVisible, categoryState.isSelected]);

  if (!allData || allData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        <p><strong>No data available for Accumulation Charts</strong></p>
        <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
          No categories pass the current filters.
        </p>
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        <p><strong>No valid BMD data available for Accumulation Charts</strong></p>
        <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
          The categories don't have valid BMD values to plot.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <h4 style={{ marginBottom: '1rem' }}>Accumulation Charts (Cumulative Distribution Functions)</h4>
      <Row gutter={[16, 16]}>
        {charts.map((chart, index) => (
          <Col xs={24} lg={12} key={index}>
            <Plot
              data={chart.data}
              layout={chart.layout}
              config={chart.config}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
              onLegendClick={(event) => handleLegendClick(event, chart.data)}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}
