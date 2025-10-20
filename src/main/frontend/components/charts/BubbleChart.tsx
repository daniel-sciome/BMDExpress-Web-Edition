import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useAppSelector } from '../../store/hooks';
import { selectChartData } from '../../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

export default function BubbleChart() {
  const data = useAppSelector(selectChartData);
  const [plotData, setPlotData] = useState<any[]>([]);

  useEffect(() => {
    if (!data || data.length === 0) {
      setPlotData([]);
      return;
    }

    // Filter for valid data points
    const validData = data.filter((row: CategoryAnalysisResultDto) =>
      row.bmdMedian != null &&
      row.bmdMedian > 0 &&
      row.fishersExactTwoTailPValue != null &&
      row.fishersExactTwoTailPValue > 0 &&
      row.percentage != null &&
      row.percentage > 0
    );

    if (validData.length === 0) {
      setPlotData([]);
      return;
    }

    // Prepare data for bubble chart
    const bmdValues = validData.map((row: CategoryAnalysisResultDto) => row.bmdMedian!);
    const pValues = validData.map((row: CategoryAnalysisResultDto) => row.fishersExactTwoTailPValue!);
    const negLogPValues = pValues.map(p => -Math.log10(p));
    const percentages = validData.map((row: CategoryAnalysisResultDto) => row.percentage!);
    const labels = validData.map((row: CategoryAnalysisResultDto) => row.categoryDescription || 'Unknown');

    const trace: any = {
      type: 'scatter',
      mode: 'markers',
      x: bmdValues,
      y: negLogPValues,
      marker: {
        size: percentages,
        sizemode: 'diameter',
        sizeref: 2.0 * Math.max(...percentages) / (40 ** 2), // Scale bubbles
        sizemin: 4,
        color: '#1890ff',
        opacity: 0.6,
        line: {
          color: '#096dd9',
          width: 1,
        },
      },
      text: labels,
      hovertemplate:
        '<b>%{text}</b><br>' +
        'BMD: %{x:.4f}<br>' +
        '-log10(p-value): %{y:.2f}<br>' +
        'Percentage: %{marker.size:.1f}%<br>' +
        '<extra></extra>',
    };

    setPlotData([trace]);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for Bubble Chart
      </div>
    );
  }

  if (plotData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid data available for Bubble Chart
      </div>
    );
  }

  const layout: any = {
    title: {
      text: 'Bubble Chart: BMD vs Fisher P-Value (size = % genes)',
      font: { size: 16 },
    },
    xaxis: {
      title: { text: 'BMD Median' },
      type: 'log',
      autorange: true,
      gridcolor: '#e0e0e0',
    },
    yaxis: {
      title: { text: '-log10(Fisher Two-Tail P-Value)' },
      autorange: true,
      gridcolor: '#e0e0e0',
    },
    height: 600,
    hovermode: 'closest',
    plot_bgcolor: '#fafafa',
    paper_bgcolor: 'white',
    showlegend: false,
  };

  const config: any = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d'],
  };

  return (
    <div style={{ width: '100%' }}>
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
}
