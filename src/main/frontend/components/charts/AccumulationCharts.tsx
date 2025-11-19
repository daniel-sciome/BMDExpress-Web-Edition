import React, { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Row, Col } from 'antd';
import { useAppSelector } from '../../store/hooks';
import { selectFilteredData } from '../../store/slices/categoryResultsSlice';
import { useReactiveState } from 'Frontend/components/charts/hooks/useReactiveState';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function AccumulationCharts() {
  // Get ALL filtered data (after Primary Filter)
  const allData = useAppSelector(selectFilteredData);

  // Get selection state using reactive infrastructure
  const categoryState = useReactiveState('categoryId');

  const [charts, setCharts] = useState<any[]>([]);

  // Debug logging
  useEffect(() => {
    console.log('[AccumulationCharts] categoryState changed:', {
      selectedCount: categoryState.selectedIds.size,
      source: categoryState.source,
      selectedIds: Array.from(categoryState.selectedIds).slice(0, 5)
    });
  }, [categoryState.selectedIds, categoryState.source]);

  // Get cluster colors using shared utility
  const clusterColors = useClusterColors();

  useEffect(() => {
    if (!allData || allData.length === 0) {
      console.log('[AccumulationCharts] No data available, clearing charts');
      setCharts([]);
      return;
    }

    const hasSelection = categoryState.selectedIds.size > 0;

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
      // Get all values for cumulative calculation
      const allValues = allData
        .map((row: CategoryAnalysisResultDto) => ({
          value: (row as any)[config.field],
          categoryId: row.categoryId
        }))
        .filter(item => item.value != null && item.value > 0)
        .sort((a, b) => a.value - b.value);

      if (allValues.length === 0) {
        return null;
      }

      // Calculate fixed x-axis range in log space
      const allX = allValues.map(item => item.value);
      const xMin = Math.min(...allX);
      const xMax = Math.max(...allX);
      const xAxisRange: [number, number] = [Math.log10(xMin), Math.log10(xMax)];

      // Group ALL categories by cluster
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

      // Create traces with reactive styling
      const traces: any[] = [];
      const sortedClusters = Array.from(byCluster.keys()).sort((a, b) => {
        if (a === -1) return 1;
        if (b === -1) return -1;
        return Number(a) - Number(b);
      });

      sortedClusters.forEach((clusterId) => {
        const points = byCluster.get(clusterId)!;
        const baseColor = clusterColors[clusterId] || '#999999';

        // Determine marker styling based on selection state
        let markerColor = baseColor;
        let markerSize = 8;
        let markerLineWidth = 1;
        let markerLineColor = 'white';
        let markerOpacity = 1.0;

        // Check if ANY category from this cluster is selected
        const isClusterSelected = hasSelection && points.some(p => categoryState.selectedIds.has(p.categoryId));

        if (hasSelection) {
          if (isClusterSelected) {
            // This cluster is selected - make it stand out
            markerSize = 10;
            markerLineWidth = 2;
          } else {
            // This cluster is NOT selected - fade it out
            markerOpacity = 0.2;
          }
        }

        traces.push({
          type: 'scatter',
          mode: 'markers',
          x: points.map(p => p.x),
          y: points.map(p => p.y),
          customdata: points.map(p => p.categoryId),
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
          showlegend: false,
        });
      });

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
            range: xAxisRange,
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
          showlegend: false,
        },
        config: createPlotlyConfig(),
      };
    }).filter(chart => chart !== null);

    setCharts(chartsData as any[]);
  }, [allData, clusterColors, categoryState.selectedIds]);

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
