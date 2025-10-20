import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { CategoryResultsService } from 'Frontend/generated/endpoints';

interface BestModelsPieChartProps {
  projectId: string;
  resultName: string;
}

export default function BestModelsPieChart({ projectId, resultName }: BestModelsPieChartProps) {
  const [plotData, setPlotData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModelCounts();
  }, [projectId, resultName]);

  const loadModelCounts = async () => {
    try {
      setLoading(true);
      const counts = await CategoryResultsService.getModelCounts(projectId, resultName);

      if (!counts || Object.keys(counts).length === 0) {
        setPlotData([]);
        return;
      }

      // Convert map to arrays for Plotly
      const labels = Object.keys(counts);
      const values = Object.values(counts);

      // Define colors for common models
      const colors = [
        '#1890ff',  // blue
        '#f5222d',  // red
        '#52c41a',  // green
        '#fa8c16',  // orange
        '#722ed1',  // purple
        '#13c2c2',  // cyan
        '#eb2f96',  // magenta
        '#faad14',  // gold
        '#2f54eb',  // geekblue
        '#a0d911',  // lime
      ];

      const trace: any = {
        type: 'pie',
        labels: labels,
        values: values,
        marker: {
          colors: colors.slice(0, labels.length),
        },
        textinfo: 'label+percent',
        textposition: 'auto',
        hovertemplate: '<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>',
      };

      setPlotData([trace]);
    } catch (error) {
      console.error('Failed to load model counts:', error);
      setPlotData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        Loading Best Models Pie Chart...
      </div>
    );
  }

  if (plotData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No model data available for Pie Chart
      </div>
    );
  }

  const layout: any = {
    title: {
      text: 'Best Models Distribution (Unique Probes)',
      font: { size: 16 },
    },
    height: 600,
    showlegend: true,
    legend: {
      orientation: 'v',
      x: 1.05,
      y: 0.5,
    },
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
