import React from 'react';
import Plot from 'react-plotly.js';
import type CurveDataDto from 'Frontend/generated/com/sciome/dto/CurveDataDto';

interface DoseResponseCurveChartProps {
  curves: CurveDataDto[];
}

export default function DoseResponseCurveChart({ curves }: DoseResponseCurveChartProps) {
  if (!curves || curves.length === 0) {
    return null;
  }

  // Color palette for curves (cycle through these colors)
  const colors = ['#FF0000', '#0000FF', '#000000', '#00FF00', '#FF00FF', '#00FFFF', '#FFA500'];

  const plotData: any[] = [];

  curves.forEach((curve, index) => {
    const color = colors[index % colors.length];
    const curveName = `${curve.geneSymbol} (${curve.probeId})`;

    // Add interpolated curve line
    if (curve.curvePoints && curve.curvePoints.length > 0) {
      const xValues = curve.curvePoints.filter(p => p).map((p) => p!.dose);
      const yValues = curve.curvePoints.filter(p => p).map((p) => p!.response);

      plotData.push({
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: 'lines',
        name: curveName,
        line: {
          color: color,
          width: 2,
        },
        hovertemplate: `${curveName}<br>Dose: %{x}<br>Response: %{y:.3f}<extra></extra>`,
      });
    }

    // Add measured data points
    if (curve.measuredPoints && curve.measuredPoints.length > 0) {
      const xMeasured = curve.measuredPoints.filter(p => p).map((p) => p!.dose);
      const yMeasured = curve.measuredPoints.filter(p => p).map((p) => p!.response);

      plotData.push({
        x: xMeasured,
        y: yMeasured,
        type: 'scatter',
        mode: 'markers',
        name: `${curveName} (data)`,
        marker: {
          color: color,
          size: 8,
          symbol: 'circle',
        },
        showlegend: false,
        hovertemplate: `${curveName} (measured)<br>Dose: %{x}<br>Response: %{y:.3f}<extra></extra>`,
      });
    }

    // Add BMD markers
    if (curve.bmdMarkers) {
      const markers = curve.bmdMarkers;

      // BMD marker (green)
      if (markers.bmd != null && markers.bmdResponse != null) {
        plotData.push({
          x: [markers.bmd],
          y: [markers.bmdResponse],
          type: 'scatter',
          mode: 'markers',
          name: `${curveName} BMD`,
          marker: {
            color: '#00FF00',
            size: 12,
            symbol: 'square',
            line: {
              color: '#000000',
              width: 1,
            },
          },
          showlegend: false,
          hovertemplate: `BMD<br>Dose: %{x:.3f}<br>Response: %{y:.3f}<extra></extra>`,
        });
      }

      // BMDL marker (red)
      if (markers.bmdl != null && markers.bmdlResponse != null) {
        plotData.push({
          x: [markers.bmdl],
          y: [markers.bmdlResponse],
          type: 'scatter',
          mode: 'markers',
          name: `${curveName} BMDL`,
          marker: {
            color: '#FF0000',
            size: 12,
            symbol: 'square',
            line: {
              color: '#000000',
              width: 1,
            },
          },
          showlegend: false,
          hovertemplate: `BMDL<br>Dose: %{x:.3f}<br>Response: %{y:.3f}<extra></extra>`,
        });
      }

      // BMDU marker (blue)
      if (markers.bmdu != null && markers.bmduResponse != null) {
        plotData.push({
          x: [markers.bmdu],
          y: [markers.bmduResponse],
          type: 'scatter',
          mode: 'markers',
          name: `${curveName} BMDU`,
          marker: {
            color: '#0000FF',
            size: 12,
            symbol: 'square',
            line: {
              color: '#000000',
              width: 1,
            },
          },
          showlegend: false,
          hovertemplate: `BMDU<br>Dose: %{x:.3f}<br>Response: %{y:.3f}<extra></extra>`,
        });
      }
    }
  });

  const layout: any = {
    title: {
      text: curves[0]?.pathwayDescription || 'Dose-Response Curves',
      font: { size: 16 },
    },
    xaxis: {
      title: { text: 'Dose' },
      type: 'log',
      autorange: true,
      showgrid: true,
      gridcolor: '#e5e5e5',
    },
    yaxis: {
      title: { text: 'Log(Expression)' },
      autorange: true,
      showgrid: true,
      gridcolor: '#e5e5e5',
    },
    hovermode: 'closest',
    showlegend: true,
    legend: {
      x: 1.05,
      y: 1,
      xanchor: 'left',
      yanchor: 'top',
    },
    margin: {
      l: 60,
      r: 150,
      t: 60,
      b: 60,
    },
    height: 500,
  };

  const config: any = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  };

  return (
    <div style={{ width: '100%' }}>
      <Plot data={plotData} layout={layout} config={config} style={{ width: '100%' }} />
    </div>
  );
}
