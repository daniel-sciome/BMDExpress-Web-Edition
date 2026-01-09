import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Checkbox } from 'antd';
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

  // Get top 3 categories by lowest BMD for default overlay selection
  const defaultOverlayCategories = useMemo(() => {
    const sorted = [...selectedCategories]
      .filter(cat => cat.bmdMedian != null && cat.bmdMedian > 0 && cat.categoryDescription)
      .sort((a, b) => (a.bmdMedian ?? Infinity) - (b.bmdMedian ?? Infinity))
      .slice(0, 3);
    return new Set(sorted.map(cat => cat.categoryDescription!));
  }, [selectedCategories]);

  // Track which categories are included in overlay
  const [includedInOverlay, setIncludedInOverlay] = useState<Set<string>>(defaultOverlayCategories);

  // Reset to defaults when selected categories change
  useEffect(() => {
    setIncludedInOverlay(defaultOverlayCategories);
  }, [defaultOverlayCategories]);

  const toggleCategoryInOverlay = useCallback((pathwayDesc: string) => {
    setIncludedInOverlay(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pathwayDesc)) {
        newSet.delete(pathwayDesc);
      } else {
        newSet.add(pathwayDesc);
      }
      return newSet;
    });
  }, []);

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

  // Filter curves for overlay based on checkbox selections
  const overlayCurves = useMemo(() => {
    return curves.filter(curve =>
      includedInOverlay.has(curve.pathwayDescription || '')
    );
  }, [curves, includedInOverlay]);

  // Group overlay curves by cluster
  const curvesByCluster = useMemo(() => {
    const byCluster = new Map<number | string, CurveDataDto[]>();

    overlayCurves.forEach(curve => {
      const pathwayInfo = pathwayToCluster.get(curve.pathwayDescription || '');
      const clusterId = pathwayInfo?.clusterId ?? -1;

      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push(curve);
    });

    return byCluster;
  }, [overlayCurves, pathwayToCluster]);

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

  // Create base traces grouped by cluster (for overlay plot)
  const baseTraces = useMemo(() => {
    console.log('[DoseResponseCurveChart] Recalculating baseTraces with', overlayCurves.length, 'overlay curves');
    const traces: any[] = [];

    // Calculate global y-range for vertical lines (use overlay curves only)
    let minY = Infinity;
    let maxY = -Infinity;

    overlayCurves.forEach(curve => {
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
            showlegend: false,
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
  }, [overlayCurves, curvesByCluster, pathwayToCluster]);

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
    console.log('[DoseResponseCurveChart] Recalculating plotData with', baseTraces.length, 'base traces');
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

    const result = baseTraces.map((trace) => {
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

    console.log('[DoseResponseCurveChart] plotData generated:', {
      length: result.length,
      arrayReference: result,
      firstTrace: result[0]
    });
    return result;
  }, [baseTraces, clusterColors, curvesByCluster, selectedCategories, hasSelection, categoryState.selectedIds, nonSelectedDisplayMode]);

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
    showlegend: false,
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

  // Create a simple overlay plot without the fancy reactive hooks
  const overlayPlotData = useMemo(() => {
    console.log('[DoseResponseCurveChart] Creating overlay plot with', baseTraces.length, 'traces');
    return baseTraces.map(trace => ({ ...trace }));
  }, [baseTraces]);

  const overlayLayout = useMemo(() => ({
    title: {
      text: 'Dose-Response Curves Overlay',
      font: { size: 16 },
    },
    xaxis: {
      title: { text: 'Dose' },
      type: 'log' as const,
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
    hovermode: 'closest' as const,
    showlegend: false,
    margin: {
      l: 60,
      r: 50,
      t: 60,
      b: 60,
    },
    height: 500,
  }), []);

  return (
    <div style={{ width: '100%' }}>
      {/* Overlay plot */}
      <div style={{ marginBottom: 24 }}>
        <Plot
          data={overlayPlotData}
          layout={overlayLayout}
          config={config}
          style={{ width: '100%' }}
        />
      </div>

      {/* Individual category plots - sorted by BMD median (low to high) */}
      <div>
        <h3 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 600 }}>
          Individual Category Plots
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '20px' }}>
          {Array.from(curvesByCategory.entries())
            .sort(([descA], [descB]) => {
              // Look up BMD median for each category
              const catA = selectedCategories.find(c => c.categoryDescription === descA);
              const catB = selectedCategories.find(c => c.categoryDescription === descB);
              const bmdA = catA?.bmdMedian ?? Infinity;
              const bmdB = catB?.bmdMedian ?? Infinity;
              return bmdA - bmdB;
            })
            .map(([pathwayDesc, categoryCurves]) => {
            const pathwayInfo = pathwayToCluster.get(pathwayDesc);
            const clusterId = pathwayInfo?.clusterId ?? -1;
            const clusterColor = clusterColors[clusterId] || '#999999';

            // Calculate y-range for this category
            let minY = Infinity;
            let maxY = -Infinity;

            categoryCurves.forEach(curve => {
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

            // Build traces for this category
            const categoryTraces: any[] = [];

            categoryCurves.forEach(curve => {
              const curveName = `${curve.geneSymbol} (${curve.probeId})`;

              // Curve line
              if (curve.curvePoints && curve.curvePoints.length > 0) {
                const xValues = curve.curvePoints.filter(p => p).map(p => p!.dose);
                const yValues = curve.curvePoints.filter(p => p).map(p => p!.response);

                categoryTraces.push({
                  x: xValues,
                  y: yValues,
                  type: 'scatter',
                  mode: 'lines',
                  name: curveName,
                  line: { width: 2, color: clusterColor },
                  showlegend: false,
                  hovertemplate: `${curveName}<br>Dose: %{x}<br>Response: %{y:.3f}<extra></extra>`,
                });
              }

              // Measured points
              if (curve.measuredPoints && curve.measuredPoints.length > 0) {
                const xMeasured = curve.measuredPoints.filter(p => p).map(p => p!.dose);
                const yMeasured = curve.measuredPoints.filter(p => p).map(p => p!.response);

                categoryTraces.push({
                  x: xMeasured,
                  y: yMeasured,
                  type: 'scatter',
                  mode: 'markers',
                  marker: { size: 8, symbol: 'circle', color: clusterColor },
                  showlegend: false,
                  hovertemplate: `${curveName} (measured)<br>Dose: %{x}<br>Response: %{y:.3f}<extra></extra>`,
                });
              }

              // BMD vertical lines
              if (curve.bmdMarkers) {
                const markers = curve.bmdMarkers;
                const isFirstCurve = categoryCurves.indexOf(curve) === 0;

                if (markers.bmd != null) {
                  categoryTraces.push({
                    x: [markers.bmd, markers.bmd],
                    y: [minY, maxY],
                    type: 'scatter',
                    mode: 'lines',
                    line: { color: '#00FF00', width: 2 },
                    name: 'BMD',
                    showlegend: false,
                    hovertemplate: `BMD<br>Dose: ${markers.bmd.toFixed(3)}<extra></extra>`,
                  });
                }

                if (markers.bmdl != null) {
                  categoryTraces.push({
                    x: [markers.bmdl, markers.bmdl],
                    y: [minY, maxY],
                    type: 'scatter',
                    mode: 'lines',
                    line: { color: '#FF0000', width: 2 },
                    name: 'BMDL',
                    showlegend: false,
                    hovertemplate: `BMDL<br>Dose: ${markers.bmdl.toFixed(3)}<extra></extra>`,
                  });
                }

                if (markers.bmdu != null) {
                  categoryTraces.push({
                    x: [markers.bmdu, markers.bmdu],
                    y: [minY, maxY],
                    type: 'scatter',
                    mode: 'lines',
                    line: { color: '#0000FF', width: 2 },
                    name: 'BMDU',
                    showlegend: false,
                    hovertemplate: `BMDU<br>Dose: ${markers.bmdu.toFixed(3)}<extra></extra>`,
                  });
                }
              }
            });

            const categoryLayout = {
              title: {
                text: pathwayDesc,
                font: { size: 14, weight: 600 },
              },
              xaxis: {
                title: { text: 'Dose' },
                type: 'log' as const,
                showgrid: true,
                gridcolor: '#e5e5e5',
              },
              yaxis: {
                title: { text: 'Log(Expression)' },
                showgrid: true,
                gridcolor: '#e5e5e5',
              },
              height: 400,
              margin: { l: 60, r: 20, t: 60, b: 60 },
              hovermode: 'closest' as const,
              showlegend: false,
            };

            return (
              <div key={pathwayDesc} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ marginBottom: 8 }}>
                  <Checkbox
                    checked={includedInOverlay.has(pathwayDesc)}
                    onChange={() => toggleCategoryInOverlay(pathwayDesc)}
                  >
                    <span style={{ fontSize: '13px' }}>Include in overlay</span>
                  </Checkbox>
                </div>
                <Plot
                  data={categoryTraces}
                  layout={categoryLayout}
                  config={config}
                  style={{ width: '100%' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
