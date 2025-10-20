import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useAppSelector } from '../../store/hooks';
import { selectChartData } from '../../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

export default function RangePlot() {
  const data = useAppSelector(selectChartData);
  const [plotData, setPlotData] = useState<any[]>([]);

  useEffect(() => {
    if (!data || data.length === 0) {
      setPlotData([]);
      return;
    }

    // Filter out rows without BMD/BMDL/BMDU values
    const validData = data.filter((row: CategoryAnalysisResultDto) =>
      row.bmdMedian != null &&
      row.bmdlMedian != null &&
      row.bmduMedian != null &&
      row.bmdMedian > 0 &&
      row.bmdlMedian > 0 &&
      row.bmduMedian > 0
    );

    if (validData.length === 0) {
      setPlotData([]);
      return;
    }

    // Take top 20 categories sorted by p-value (most significant first)
    const topCategories = validData
      .sort((a: CategoryAnalysisResultDto, b: CategoryAnalysisResultDto) => {
        const pA = a.fishersExactTwoTailPValue ?? 1;
        const pB = b.fishersExactTwoTailPValue ?? 1;
        return pA - pB;
      })
      .slice(0, 20);

    // Prepare data for Plotly
    const categories = topCategories.map((row: CategoryAnalysisResultDto) =>
      row.categoryDescription || 'Unknown'
    );
    const bmdValues = topCategories.map((row: CategoryAnalysisResultDto) => row.bmdMedian!);
    const bmdlValues = topCategories.map((row: CategoryAnalysisResultDto) => row.bmdlMedian!);
    const bmduValues = topCategories.map((row: CategoryAnalysisResultDto) => row.bmduMedian!);

    // Calculate error bar extents (distance from BMD to BMDL and BMDU)
    const errorMinus = bmdValues.map((bmd, i) => bmd - bmdlValues[i]);
    const errorPlus = bmduValues.map((bmdu, i) => bmdu - bmdValues[i]);

    const trace: any = {
      type: 'scatter',
      mode: 'markers',
      x: bmdValues,
      y: categories,
      error_x: {
        type: 'data',
        symmetric: false,
        array: errorPlus,
        arrayminus: errorMinus,
        color: '#1890ff',
        thickness: 2,
        width: 4,
      },
      marker: {
        color: '#1890ff',
        size: 8,
        symbol: 'circle',
      },
      hovertemplate:
        '<b>%{y}</b><br>' +
        'BMD: %{x:.4f}<br>' +
        'BMDL: %{customdata[0]:.4f}<br>' +
        'BMDU: %{customdata[1]:.4f}<br>' +
        '<extra></extra>',
      customdata: topCategories.map((row: CategoryAnalysisResultDto) => [
        row.bmdlMedian,
        row.bmduMedian,
      ]),
    };

    setPlotData([trace]);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for Range Plot
      </div>
    );
  }

  if (plotData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid BMD/BMDL/BMDU data available
      </div>
    );
  }

  const layout: any = {
    title: {
      text: 'Range Plot: BMD with Confidence Intervals (Top 20 Pathways)',
      font: { size: 16 },
    },
    xaxis: {
      title: { text: 'BMD Value' },
      type: 'log',
      autorange: true,
      gridcolor: '#e0e0e0',
    },
    yaxis: {
      title: { text: 'Pathway/Category' },
      autorange: 'reversed', // Most significant at top
      gridcolor: '#e0e0e0',
      tickfont: { size: 10 },
    },
    height: Math.max(500, plotData[0]?.y?.length * 25 || 500),
    margin: { l: 300, r: 50, t: 80, b: 80 },
    hovermode: 'closest',
    plot_bgcolor: '#fafafa',
    paper_bgcolor: 'white',
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
