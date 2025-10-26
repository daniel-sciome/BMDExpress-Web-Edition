import React, { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Row, Col } from 'antd';
import { useAppSelector } from '../../store/hooks';
import { selectFilteredData } from '../../store/slices/categoryResultsSlice';
import { useReactiveState } from 'Frontend/components/charts/hooks/useReactiveState';
import { umapDataService } from 'Frontend/data/umapDataService';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

export default function AccumulationCharts() {
  // Get ALL filtered data (after Master Filter)
  const allData = useAppSelector(selectFilteredData);

  // Get selection state using reactive infrastructure
  const categoryState = useReactiveState('categoryId');

  const [charts, setCharts] = useState<any[]>([]);

  // Debug logging
  useEffect(() => {
    console.log('[AccumulationCharts] Component rendered:', {
      totalDataLength: allData?.length || 0,
      selectedCount: categoryState.selectedIds.size,
      hasData: !!allData && allData.length > 0
    });
  }, [allData, categoryState.selectedIds.size]);

  // Get cluster colors (same as UMAP)
  const clusterColors = useMemo(() => {
    const clusters = umapDataService.getAllClusterIds();
    const colors: Record<string | number, string> = {};

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
        colors[clusterId] = '#999999';
      } else {
        colors[clusterId] = palette[index % palette.length];
      }
    });

    return colors;
  }, []);

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

      // Layer 1: Background - ALL categories (gray)
      const allValues = allData
        .map((row: CategoryAnalysisResultDto) => ({
          value: (row as any)[config.field],
          categoryId: row.categoryId
        }))
        .filter(item => item.value != null && item.value > 0)
        .sort((a, b) => a.value - b.value);

      // Calculate x-axis range from background data (for fixed axis scaling)
      let xAxisRange: [number, number] | undefined;

      if (allValues.length > 0) {
        const allX: number[] = [];
        const allY: number[] = [];
        const totalCount = allValues.length;

        allValues.forEach((item, index) => {
          allX.push(item.value);
          allY.push(((index + 1) / totalCount) * 100);
        });

        // Calculate fixed x-axis range in log space
        const xMin = Math.min(...allX);
        const xMax = Math.max(...allX);
        xAxisRange = [Math.log10(xMin), Math.log10(xMax)];

        traces.push({
          type: 'scatter',
          mode: 'lines',
          x: allX,
          y: allY,
          line: {
            color: '#d0d0d0',
            width: 2,
          },
          fill: 'tozeroy',
          fillcolor: '#f0f0f0',
          name: 'All Categories',
          hovertemplate: 'Value: %{x:.4f}<br>Cumulative %: %{y:.1f}%<extra></extra>',
        });
      }

      // Layer 2: Foreground - SELECTED categories as individual markers (colored by cluster)
      if (selectedData.length > 0 && allValues.length > 0) {
        // Group selected data by cluster for separate traces
        const byCluster = new Map<string | number, Array<{x: number, y: number, categoryId: string}>>();

        selectedData.forEach(row => {
          const value = (row as any)[config.field];
          if (value == null || value <= 0) return;

          // Find position on background cumulative curve
          const index = allValues.findIndex(item => item.categoryId === row.categoryId);
          if (index === -1) return;

          const cumulativePercent = ((index + 1) / allValues.length) * 100;

          const umapItem = umapDataService.getByGoId(row.categoryId || '');
          const clusterId = umapItem?.cluster_id ?? -1;

          if (!byCluster.has(clusterId)) {
            byCluster.set(clusterId, []);
          }
          byCluster.get(clusterId)!.push({
            x: value,
            y: cumulativePercent,
            categoryId: row.categoryId || ''
          });
        });

        // Create a marker trace for each cluster (no lines)
        byCluster.forEach((points, clusterId) => {
          const color = clusterColors[clusterId] || '#999999';

          traces.push({
            type: 'scatter',
            mode: 'markers',
            x: points.map(p => p.x),
            y: points.map(p => p.y),
            marker: {
              color: color,
              size: 8,
              symbol: 'circle',
              line: {
                color: 'white',
                width: 1
              }
            },
            name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
            hovertemplate: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}<br>Value: %{x:.4f}<br>Cumulative %: %{y:.1f}%<extra></extra>`,
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
            gridcolor: '#e0e0e0',
          },
          yaxis: {
            title: { text: 'Cumulative Percentage (%)' },
            range: [0, 100],
            gridcolor: '#e0e0e0',
          },
          height: 400,
          margin: { l: 70, r: 50, t: 50, b: 50 },
          plot_bgcolor: '#fafafa',
          paper_bgcolor: 'white',
          showlegend: selectedData.length > 0,
          legend: {
            x: 1,
            xanchor: 'right',
            y: 1,
          },
        },
        config: {
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['select2d', 'lasso2d'],
        },
      };
    }).filter(chart => chart !== null);

    setCharts(chartsData as any[]);
  }, [allData, selectedData, unselectedData, clusterColors]);

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
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}
