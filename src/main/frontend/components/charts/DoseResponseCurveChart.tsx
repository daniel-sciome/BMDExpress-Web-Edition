import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type CurveDataDto from 'Frontend/generated/com/sciome/dto/CurveDataDto';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterLegendInteraction, getClusterMarkerStyle } from './hooks/useClusterLegendInteraction';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

interface DoseResponseCurveChartProps {
  curves: CurveDataDto[];
  selectedCategories: CategoryAnalysisResultDto[];
}

export default function DoseResponseCurveChart({ curves, selectedCategories }: DoseResponseCurveChartProps) {
  const categoryState = useReactiveState('categoryId');
  const clusterColors = useClusterColors();

  if (!curves || curves.length === 0) {
    return null;
  }

  // Map pathway description to category and cluster
  const pathwayToCluster = useMemo(() => {
    const map = new Map<string, { categoryId: string; clusterId: number | string }>();
    selectedCategories.forEach(cat => {
      if (cat.categoryDescription && cat.categoryId) {
        map.set(cat.categoryDescription, {
          categoryId: cat.categoryId,
          clusterId: getClusterIdForCategory(cat.categoryId),
        });
      }
    });
    return map;
  }, [selectedCategories]);

  // Group curves by cluster
  const curvesByCluster = useMemo(() => {
    const byCluster = new Map<number | string, CurveDataDto[]>();

    curves.forEach(curve => {
      const pathwayInfo = pathwayToCluster.get(curve.pathwayDescription || '');
      const clusterId = pathwayInfo?.clusterId ?? -1;

      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push(curve);
    });

    return byCluster;
  }, [curves, pathwayToCluster]);

  // Create base traces grouped by cluster
  const baseTraces = useMemo(() => {
    const traces: any[] = [];

    curvesByCluster.forEach((clusterCurves, clusterId) => {
      clusterCurves.forEach((curve) => {
        const curveName = `${curve.geneSymbol} (${curve.probeId})`;

        // Add interpolated curve line
        if (curve.curvePoints && curve.curvePoints.length > 0) {
          const xValues = curve.curvePoints.filter(p => p).map((p) => p!.dose);
          const yValues = curve.curvePoints.filter(p => p).map((p) => p!.response);

          traces.push({
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            name: getClusterLabel(clusterId),
            line: { width: 2 },
            hovertemplate: `${curveName}<br>${getClusterLabel(clusterId)}<br>Dose: %{x}<br>Response: %{y:.3f}<extra></extra>`,
            showlegend: true,
            legendgroup: `cluster_${clusterId}`,
            clusterId: clusterId,
            pathwayDescription: curve.pathwayDescription,
          });
        }

        // Add measured data points
        if (curve.measuredPoints && curve.measuredPoints.length > 0) {
          const xMeasured = curve.measuredPoints.filter(p => p).map((p) => p!.dose);
          const yMeasured = curve.measuredPoints.filter(p => p).map((p) => p!.response);

          traces.push({
            x: xMeasured,
            y: yMeasured,
            type: 'scatter',
            mode: 'markers',
            name: `${curveName} (data)`,
            marker: { size: 8, symbol: 'circle' },
            showlegend: false,
            hovertemplate: `${curveName} (measured)<br>Dose: %{x}<br>Response: %{y:.3f}<extra></extra>`,
            legendgroup: `cluster_${clusterId}`,
            clusterId: clusterId,
          });
        }

        // Add BMD markers
        if (curve.bmdMarkers) {
          const markers = curve.bmdMarkers;

          // BMD marker (green)
          if (markers.bmd != null && markers.bmdResponse != null) {
            traces.push({
              x: [markers.bmd],
              y: [markers.bmdResponse],
              type: 'scatter',
              mode: 'markers',
              name: `${curveName} BMD`,
              marker: {
                color: '#00FF00',
                size: 12,
                symbol: 'square',
                line: { color: '#000000', width: 1 },
              },
              showlegend: false,
              hovertemplate: `BMD<br>Dose: %{x:.3f}<br>Response: %{y:.3f}<extra></extra>`,
              legendgroup: `cluster_${clusterId}`,
              clusterId: clusterId,
            });
          }

          // BMDL marker (red)
          if (markers.bmdl != null && markers.bmdlResponse != null) {
            traces.push({
              x: [markers.bmdl],
              y: [markers.bmdlResponse],
              type: 'scatter',
              mode: 'markers',
              name: `${curveName} BMDL`,
              marker: {
                color: '#FF0000',
                size: 12,
                symbol: 'square',
                line: { color: '#000000', width: 1 },
              },
              showlegend: false,
              hovertemplate: `BMDL<br>Dose: %{x:.3f}<br>Response: %{y:.3f}<extra></extra>`,
              legendgroup: `cluster_${clusterId}`,
              clusterId: clusterId,
            });
          }

          // BMDU marker (blue)
          if (markers.bmdu != null && markers.bmduResponse != null) {
            traces.push({
              x: [markers.bmdu],
              y: [markers.bmduResponse],
              type: 'scatter',
              mode: 'markers',
              name: `${curveName} BMDU`,
              marker: {
                color: '#0000FF',
                size: 12,
                symbol: 'square',
                line: { color: '#000000', width: 1 },
              },
              showlegend: false,
              hovertemplate: `BMDU<br>Dose: %{x:.3f}<br>Response: %{y:.3f}<extra></extra>`,
              legendgroup: `cluster_${clusterId}`,
              clusterId: clusterId,
            });
          }
        }
      });
    });

    return traces;
  }, [curves, curvesByCluster, pathwayToCluster]);

  // Set up cluster legend interaction
  const { handleLegendClick, nonSelectedDisplayMode, hasSelection } = useClusterLegendInteraction({
    traces: baseTraces.filter(t => t.showlegend), // Only pass traces that show in legend
    categoryState,
    allData: selectedCategories,
    getClusterIdFromCategory: (row) => getClusterIdForCategory(row.categoryId),
    getCategoryId: (row) => row.categoryId,
    sourceName: 'DoseResponseCurveChart',
  });

  // Apply reactive styling to traces
  const plotData = useMemo(() => {
    return baseTraces.map((trace) => {
      const clusterId = trace.clusterId;
      const baseColor = clusterColors[clusterId] || '#999999';

      // Check if this cluster's parent category is selected
      const pathwayInfo = pathwayToCluster.get(trace.pathwayDescription || '');
      const isClusterSelected = hasSelection && pathwayInfo?.categoryId &&
        categoryState.isSelected(pathwayInfo.categoryId);

      // Get reactive styling (only for curve lines, not markers)
      if (trace.mode === 'lines') {
        const markerStyle = getClusterMarkerStyle(
          clusterId,
          baseColor,
          isClusterSelected,
          hasSelection,
          nonSelectedDisplayMode
        );

        return {
          ...trace,
          line: {
            ...trace.line,
            color: markerStyle.color,
          },
          opacity: markerStyle.opacity,
        };
      }

      // For markers (measured data points and BMD markers), apply cluster color
      if (trace.showlegend === false) {
        return {
          ...trace,
          marker: {
            ...trace.marker,
            color: trace.marker?.color || baseColor, // Keep BMD marker colors
          },
        };
      }

      return trace;
    });
  }, [baseTraces, clusterColors, pathwayToCluster, hasSelection, categoryState.selectedIds, nonSelectedDisplayMode]);

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
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%' }}
        onLegendClick={handleLegendClick}
      />
    </div>
  );
}
