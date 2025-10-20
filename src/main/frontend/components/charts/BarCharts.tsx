import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { Row, Col } from 'antd';
import { useAppSelector } from '../../store/hooks';
import { selectChartData } from '../../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

export default function BarCharts() {
  const data = useAppSelector(selectChartData);
  const [charts, setCharts] = useState<any[]>([]);

  useEffect(() => {
    if (!data || data.length === 0) {
      setCharts([]);
      return;
    }

    // Take top 20 categories sorted by p-value
    const topCategories = data
      .filter((row: CategoryAnalysisResultDto) => row.fishersExactTwoTailPValue != null)
      .sort((a: CategoryAnalysisResultDto, b: CategoryAnalysisResultDto) => {
        const pA = a.fishersExactTwoTailPValue ?? 1;
        const pB = b.fishersExactTwoTailPValue ?? 1;
        return pA - pB;
      })
      .slice(0, 20);

    const categories = topCategories.map((row: CategoryAnalysisResultDto) =>
      row.categoryDescription || 'Unknown'
    );

    // Define the 6 charts with their data
    const chartConfigs = [
      {
        title: 'BMD Median',
        values: topCategories.map((row: CategoryAnalysisResultDto) => row.bmdMedian ?? 0),
        color: '#1890ff',
      },
      {
        title: 'BMDL Median',
        values: topCategories.map((row: CategoryAnalysisResultDto) => row.bmdlMedian ?? 0),
        color: '#f5222d',
      },
      {
        title: 'BMDU Median',
        values: topCategories.map((row: CategoryAnalysisResultDto) => row.bmduMedian ?? 0),
        color: '#52c41a',
      },
      {
        title: 'BMD Mean',
        values: topCategories.map((row: CategoryAnalysisResultDto) => row.bmdMean ?? 0),
        color: '#13c2c2',
      },
      {
        title: 'BMDL Mean',
        values: topCategories.map((row: CategoryAnalysisResultDto) => row.bmdlMean ?? 0),
        color: '#fa8c16',
      },
      {
        title: 'BMDU Mean',
        values: topCategories.map((row: CategoryAnalysisResultDto) => row.bmduMean ?? 0),
        color: '#722ed1',
      },
    ];

    const chartsData = chartConfigs.map(config => ({
      data: [{
        type: 'bar',
        y: categories,
        x: config.values,
        orientation: 'h',
        marker: {
          color: config.color,
        },
        hovertemplate: '<b>%{y}</b><br>Value: %{x:.4f}<extra></extra>',
      }],
      layout: {
        title: {
          text: config.title,
          font: { size: 14 },
        },
        xaxis: {
          title: { text: 'Value' },
          type: 'log',
          gridcolor: '#e0e0e0',
        },
        yaxis: {
          title: '',
          autorange: 'reversed',
          tickfont: { size: 9 },
          gridcolor: '#e0e0e0',
        },
        height: 500,
        margin: { l: 200, r: 50, t: 50, b: 50 },
        plot_bgcolor: '#fafafa',
        paper_bgcolor: 'white',
      },
      config: {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['select2d', 'lasso2d'],
      },
    }));

    setCharts(chartsData);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for Bar Charts
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        Loading Bar Charts...
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <h4 style={{ marginBottom: '1rem' }}>BMD and BMDL Bar Charts (Top 20 Pathways)</h4>
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
