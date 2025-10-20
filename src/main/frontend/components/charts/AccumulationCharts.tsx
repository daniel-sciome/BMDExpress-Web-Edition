import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { Row, Col } from 'antd';
import { useAppSelector } from '../../store/hooks';
import { selectChartData } from '../../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

export default function AccumulationCharts() {
  const data = useAppSelector(selectChartData);
  const [charts, setCharts] = useState<any[]>([]);

  useEffect(() => {
    if (!data || data.length === 0) {
      setCharts([]);
      return;
    }

    // Define the 6 charts with their data fields
    const chartConfigs = [
      {
        title: 'BMD Median Accumulation',
        field: 'bmdMedian',
        color: '#1890ff',
      },
      {
        title: 'BMD Mean Accumulation',
        field: 'bmdMean',
        color: '#13c2c2',
      },
      {
        title: 'BMDL Median Accumulation',
        field: 'bmdlMedian',
        color: '#f5222d',
      },
      {
        title: 'BMDL Mean Accumulation',
        field: 'bmdlMean',
        color: '#fa8c16',
      },
      {
        title: 'BMDU Median Accumulation',
        field: 'bmduMedian',
        color: '#52c41a',
      },
      {
        title: 'BMDU Mean Accumulation',
        field: 'bmduMean',
        color: '#722ed1',
      },
    ];

    const chartsData = chartConfigs.map(config => {
      // Extract and sort values
      const values = data
        .map((row: CategoryAnalysisResultDto) => (row as any)[config.field])
        .filter((v: any) => v != null && v > 0)
        .sort((a: number, b: number) => a - b);

      if (values.length === 0) {
        return null;
      }

      // Calculate cumulative percentage
      const xValues: number[] = [];
      const yValues: number[] = [];
      const totalCount = values.length;

      values.forEach((value: number, index: number) => {
        xValues.push(value);
        yValues.push(((index + 1) / totalCount) * 100);
      });

      return {
        data: [{
          type: 'scatter',
          mode: 'lines',
          x: xValues,
          y: yValues,
          line: {
            color: config.color,
            width: 2,
          },
          fill: 'tozeroy',
          fillcolor: config.color + '20', // Add transparency
          hovertemplate: 'Value: %{x:.4f}<br>Cumulative %: %{y:.1f}%<extra></extra>',
        }],
        layout: {
          title: {
            text: config.title,
            font: { size: 14 },
          },
          xaxis: {
            title: { text: 'BMD Value' },
            type: 'log',
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
          showlegend: false,
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
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for Accumulation Charts
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid data available for Accumulation Charts
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
