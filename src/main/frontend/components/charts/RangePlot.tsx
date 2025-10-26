import React, { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useAppSelector } from '../../store/hooks';
import { selectChartData } from '../../store/slices/categoryResultsSlice';
import { umapDataService } from 'Frontend/data/umapDataService';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

export default function RangePlot() {
  const data = useAppSelector(selectChartData);
  const [plotData, setPlotData] = useState<any[]>([]);

  // Get cluster colors (same as UMAP and AccumulationCharts)
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

    // Group categories by cluster
    const byCluster = new Map<string | number, CategoryAnalysisResultDto[]>();

    topCategories.forEach((row: CategoryAnalysisResultDto) => {
      const umapItem = umapDataService.getByGoId(row.categoryId || '');
      const clusterId = umapItem?.cluster_id ?? -1;

      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push(row);
    });

    // Create a trace for each cluster
    const traces: any[] = [];

    byCluster.forEach((clusterData, clusterId) => {
      const color = clusterColors[clusterId] || '#999999';

      const categories = clusterData.map((row: CategoryAnalysisResultDto) =>
        row.categoryDescription || 'Unknown'
      );
      const bmdValues = clusterData.map((row: CategoryAnalysisResultDto) => row.bmdMedian!);
      const bmdlValues = clusterData.map((row: CategoryAnalysisResultDto) => row.bmdlMedian!);
      const bmduValues = clusterData.map((row: CategoryAnalysisResultDto) => row.bmduMedian!);

      // Calculate error bar extents (distance from BMD to BMDL and BMDU)
      const errorMinus = bmdValues.map((bmd, i) => bmd - bmdlValues[i]);
      const errorPlus = bmduValues.map((bmdu, i) => bmdu - bmdValues[i]);

      traces.push({
        type: 'scatter',
        mode: 'markers',
        x: bmdValues,
        y: categories,
        error_x: {
          type: 'data',
          symmetric: false,
          array: errorPlus,
          arrayminus: errorMinus,
          color: color,
          thickness: 2,
          width: 4,
        },
        marker: {
          color: color,
          size: 8,
          symbol: 'circle',
        },
        name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
        hovertemplate:
          '<b>%{y}</b><br>' +
          `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}<br>` +
          'BMD: %{x:.4f}<br>' +
          'BMDL: %{customdata[0]:.4f}<br>' +
          'BMDU: %{customdata[1]:.4f}<br>' +
          '<extra></extra>',
        customdata: clusterData.map((row: CategoryAnalysisResultDto) => [
          row.bmdlMedian,
          row.bmduMedian,
        ]),
      });
    });

    setPlotData(traces);
  }, [data, clusterColors]);

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
    showlegend: true,
    legend: {
      x: 1.02,
      xanchor: 'left',
      y: 1,
    },
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
