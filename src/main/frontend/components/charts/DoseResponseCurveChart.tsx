import React, { useMemo, useCallback } from 'react';
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
  const clusterColors = useClusterColors();
  const categoryState = useReactiveState('categoryId');

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

  // Group curves by category (pathway description) for subplot mode
  const curvesByCategory = useMemo(() => {
    const byCategory = new Map<string, CurveDataDto[]>();

    curves.forEach(curve => {
      const pathwayDesc = curve.pathwayDescription || 'Unknown';
      if (!byCategory.has(pathwayDesc)) {
        byCategory.set(pathwayDesc, []);
      }
      byCategory.get(pathwayDesc)!.push(curve);
    });

    return byCategory;
  }, [curves]);

  // Create base traces grouped by cluster
  const baseTraces = useMemo(() => {
    const traces: any[] = [];

    // Calculate global y-range for vertical lines
    let minY = Infinity;
    let maxY = -Infinity;

    curves.forEach(curve => {
      if (curve.curvePoints && curve.curvePoints.length > 0) {
        curve.curvePoints.filter(p => p).forEach(p => {
          minY = Math.min(minY, p!.response);
          maxY = Math.max(maxY, p!.response);
        });
      }
      if (curve.measuredPoints && curve.measuredPoints.length > 0) {
        curve.measuredPoints.filter(p => p).forEach(p => {
          minY = Math.min(minY, p!.response);
          maxY = Math.max(maxY, p!.response);
        });
      }
    });

    // Add some padding to the range
    const yPadding = (maxY - minY) * 0.05;
    minY -= yPadding;
    maxY += yPadding;

    curvesByCluster.forEach((clusterCurves, clusterId) => {
      let isFirstCurveInCluster = true;

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
            showlegend: isFirstCurveInCluster, // Only first curve in cluster shows in legend
            legendgroup: `cluster_${clusterId}`,
            clusterId: clusterId,
            pathwayDescription: curve.pathwayDescription,
          });

          isFirstCurveInCluster = false; // Subsequent curves won't show in legend
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

        // Add BMD vertical lines
        if (curve.bmdMarkers) {
          const markers = curve.bmdMarkers;

          // BMD vertical line (green)
          if (markers.bmd != null) {
            traces.push({
              x: [markers.bmd, markers.bmd],
              y: [minY, maxY],
              type: 'scatter',
              mode: 'lines',
              name: `${curveName} BMD`,
              line: {
                color: '#00FF00',
                width: 2,
                dash: 'solid',
              },
              showlegend: false,
              hovertemplate: `BMD<br>Dose: ${markers.bmd.toFixed(3)}<extra></extra>`,
              legendgroup: `cluster_${clusterId}`,
              clusterId: clusterId,
              isBmdLine: true, // Flag to preserve semantic color
            });
          }

          // BMDL vertical line (red)
          if (markers.bmdl != null) {
            traces.push({
              x: [markers.bmdl, markers.bmdl],
              y: [minY, maxY],
              type: 'scatter',
              mode: 'lines',
              name: `${curveName} BMDL`,
              line: {
                color: '#FF0000',
                width: 2,
                dash: 'solid',
              },
              showlegend: false,
              hovertemplate: `BMDL<br>Dose: ${markers.bmdl.toFixed(3)}<extra></extra>`,
              legendgroup: `cluster_${clusterId}`,
              clusterId: clusterId,
              isBmdLine: true, // Flag to preserve semantic color
            });
          }

          // BMDU vertical line (blue)
          if (markers.bmdu != null) {
            traces.push({
              x: [markers.bmdu, markers.bmdu],
              y: [minY, maxY],
              type: 'scatter',
              mode: 'lines',
              name: `${curveName} BMDU`,
              line: {
                color: '#0000FF',
                width: 2,
                dash: 'solid',
              },
              showlegend: false,
              hovertemplate: `BMDU<br>Dose: ${markers.bmdu.toFixed(3)}<extra></extra>`,
              legendgroup: `cluster_${clusterId}`,
              clusterId: clusterId,
              isBmdLine: true, // Flag to preserve semantic color
            });
          }
        }
      });
    });

    return traces;
  }, [curves, curvesByCluster, pathwayToCluster]);

  // Set up cluster legend interaction (synchronizes with all other views)
  const { handleLegendClick, nonSelectedDisplayMode, hasSelection } = useClusterLegendInteraction({
    traces: baseTraces.filter(t => t.showlegend), // Only legend-visible traces
    categoryState,
    allData: selectedCategories,
    getClusterIdFromCategory: (row) => getClusterIdForCategory(row.categoryId),
    getCategoryId: (row) => row.categoryId,
    sourceName: 'DoseResponseCurveChart',
  });

  // Apply reactive styling to traces (all curves always visible, but styled based on selection)
  const plotData = useMemo(() => {
    // Pre-compute which clusters have selected categories
    const clusterSelectionMap = new Map<number | string, boolean>();
    if (hasSelection) {
      curvesByCluster.forEach((clusterCurves, clusterId) => {
        const categoriesInCluster = selectedCategories
          .filter(cat => getClusterIdForCategory(cat.categoryId) === clusterId)
          .map(cat => cat.categoryId)
          .filter(Boolean);

        const isSelected = categoriesInCluster.some(catId => categoryState.isSelected(catId));
        clusterSelectionMap.set(clusterId, isSelected);
      });
    }

    return baseTraces.map((trace) => {
      const clusterId = trace.clusterId;
      const baseColor = clusterColors[clusterId] || '#999999';

      // Check if ANY category from this cluster is selected (for reactive styling)
      const isClusterSelected = clusterSelectionMap.get(clusterId) || false;

      // Handle lines (both curve lines and BMD vertical lines)
      if (trace.mode === 'lines') {
        // Calculate reactive opacity
        let opacity = 1.0;
        if (hasSelection && !isClusterSelected && nonSelectedDisplayMode === 'hidden') {
          opacity = 0;
        }

        // BMD vertical lines keep their semantic colors
        if (trace.isBmdLine) {
          return {
            ...trace,
            opacity: opacity,
          };
        }

        // Curve lines use cluster colors with full reactive styling
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

      // For markers (measured data points), apply cluster color with same opacity as lines
      if (trace.mode === 'markers' && trace.showlegend === false) {
        // Calculate opacity for this cluster's markers
        let opacity = 1.0;
        if (hasSelection && !isClusterSelected) {
          if (nonSelectedDisplayMode === 'hidden') {
            opacity = 0;
          }
        }

        return {
          ...trace,
          marker: {
            ...trace.marker,
            color: trace.marker?.color || baseColor, // Keep BMD marker semantic colors or use cluster color
          },
          opacity: opacity,
        };
      }

      return trace;
    });
  }, [baseTraces, clusterColors, curvesByCluster, selectedCategories, hasSelection, categoryState.selectedIds, nonSelectedDisplayMode]);

  // Create individual subplot data and layout for each category
  const { subplotData, subplotLayout } = useMemo(() => {
    const categories = Array.from(curvesByCategory.keys());
    const numCategories = categories.length;
    const cols = Math.min(2, numCategories); // Max 2 columns
    const rows = Math.ceil(numCategories / cols);

    const subplots: any[] = [];
    const annotations: any[] = [];

    // Calculate global y-range for vertical lines
    let minY = Infinity;
    let maxY = -Infinity;

    curves.forEach(curve => {
      if (curve.curvePoints && curve.curvePoints.length > 0) {
        curve.curvePoints.filter(p => p).forEach(p => {
          minY = Math.min(minY, p!.response);
          maxY = Math.max(maxY, p!.response);
        });
      }
      if (curve.measuredPoints && curve.measuredPoints.length > 0) {
        curve.measuredPoints.filter(p => p).forEach(p => {
          minY = Math.min(minY, p!.response);
          maxY = Math.max(maxY, p!.response);
        });
      }
    });

    const yPadding = (maxY - minY) * 0.05;
    minY -= yPadding;
    maxY += yPadding;

    categories.forEach((pathwayDesc, idx) => {
      const categoryCurves = curvesByCategory.get(pathwayDesc)!;
      const pathwayInfo = pathwayToCluster.get(pathwayDesc);
      const clusterId = pathwayInfo?.clusterId ?? -1;
      const clusterColor = clusterColors[clusterId] || '#999999';

      const row = Math.floor(idx / cols) + 1;
      const col = (idx % cols) + 1;
      const xref = col === 1 ? 'x' : `x${(idx + 1)}`;
      const yref = row === 1 && col === 1 ? 'y' : `y${(idx + 1)}`;

      categoryCurves.forEach(curve => {
        const curveName = `${curve.geneSymbol} (${curve.probeId})`;

        // Add curve line
        if (curve.curvePoints && curve.curvePoints.length > 0) {
          const xValues = curve.curvePoints.filter(p => p).map(p => p!.dose);
          const yValues = curve.curvePoints.filter(p => p).map(p => p!.response);

          subplots.push({
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            name: curveName,
            line: { width: 2, color: clusterColor },
            showlegend: false,
            hovertemplate: `${curveName}<br>Dose: %{x}<br>Response: %{y:.3f}<extra></extra>`,
            xaxis: xref,
            yaxis: yref,
          });
        }

        // Add measured points
        if (curve.measuredPoints && curve.measuredPoints.length > 0) {
          const xMeasured = curve.measuredPoints.filter(p => p).map(p => p!.dose);
          const yMeasured = curve.measuredPoints.filter(p => p).map(p => p!.response);

          subplots.push({
            x: xMeasured,
            y: yMeasured,
            type: 'scatter',
            mode: 'markers',
            name: `${curveName} (data)`,
            marker: { size: 8, symbol: 'circle', color: clusterColor },
            showlegend: false,
            hovertemplate: `${curveName} (measured)<br>Dose: %{x}<br>Response: %{y:.3f}<extra></extra>`,
            xaxis: xref,
            yaxis: yref,
          });
        }

        // Add BMD vertical lines
        if (curve.bmdMarkers) {
          const markers = curve.bmdMarkers;

          if (markers.bmd != null) {
            subplots.push({
              x: [markers.bmd, markers.bmd],
              y: [minY, maxY],
              type: 'scatter',
              mode: 'lines',
              line: { color: '#00FF00', width: 2 },
              showlegend: false,
              hovertemplate: `BMD<br>Dose: ${markers.bmd.toFixed(3)}<extra></extra>`,
              xaxis: xref,
              yaxis: yref,
            });
          }

          if (markers.bmdl != null) {
            subplots.push({
              x: [markers.bmdl, markers.bmdl],
              y: [minY, maxY],
              type: 'scatter',
              mode: 'lines',
              line: { color: '#FF0000', width: 2 },
              showlegend: false,
              hovertemplate: `BMDL<br>Dose: ${markers.bmdl.toFixed(3)}<extra></extra>`,
              xaxis: xref,
              yaxis: yref,
            });
          }

          if (markers.bmdu != null) {
            subplots.push({
              x: [markers.bmdu, markers.bmdu],
              y: [minY, maxY],
              type: 'scatter',
              mode: 'lines',
              line: { color: '#0000FF', width: 2 },
              showlegend: false,
              hovertemplate: `BMDU<br>Dose: ${markers.bmdu.toFixed(3)}<extra></extra>`,
              xaxis: xref,
              yaxis: yref,
            });
          }
        }
      });

      // Add subplot title annotation
      annotations.push({
        xref: `x${idx + 1} domain`,
        yref: `y${idx + 1} domain`,
        x: 0.5,
        y: 1.0,
        xanchor: 'center',
        yanchor: 'bottom',
        text: `<b>${pathwayDesc}</b>`,
        showarrow: false,
        font: { size: 12 },
      });
    });

    // Create subplot layout
    const subplotLayoutConfig: any = {
      grid: { rows, columns: cols, pattern: 'independent', roworder: 'top to bottom' },
      height: Math.max(500, rows * 400),
      showlegend: false,
      hovermode: 'closest',
      annotations,
      margin: { l: 60, r: 20, t: 80, b: 60 },
    };

    // Configure axes for each subplot
    for (let i = 0; i < numCategories; i++) {
      const axisNum = i === 0 ? '' : String(i + 1);
      subplotLayoutConfig[`xaxis${axisNum}`] = {
        title: 'Dose',
        type: 'log',
        showgrid: true,
        gridcolor: '#e5e5e5',
      };
      subplotLayoutConfig[`yaxis${axisNum}`] = {
        title: 'Log(Expression)',
        showgrid: true,
        gridcolor: '#e5e5e5',
      };
    }

    return { subplotData: subplots, subplotLayout: subplotLayoutConfig };
  }, [curvesByCategory, curves, pathwayToCluster, clusterColors]);

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
      {/* Overlay plot */}
      <div style={{ marginBottom: 24 }}>
        <Plot
          data={plotData}
          layout={layout}
          config={config}
          style={{ width: '100%' }}
          onLegendClick={handleLegendClick}
        />
      </div>

      {/* Individual category subplots */}
      <div>
        <h3 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 600 }}>
          Individual Category Plots
        </h3>
        <Plot
          data={subplotData}
          layout={subplotLayout}
          config={config}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
