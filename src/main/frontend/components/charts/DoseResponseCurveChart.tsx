import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Checkbox, Collapse, Space, Typography } from 'antd';
import Plot from 'react-plotly.js';
import type CurveDataDto from 'Frontend/generated/com/sciome/dto/CurveDataDto';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterLegendInteraction, getClusterMarkerStyle } from './hooks/useClusterLegendInteraction';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { prepareLogScaleValues } from './utils/plotlyConfig';
import { useChartAppearance } from './hooks/useChartAppearance';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

const { Text } = Typography;

interface DoseResponseCurveChartProps {
  curves: CurveDataDto[];
  selectedCategories: CategoryAnalysisResultDto[];
  chartId?: string;
}

export default function DoseResponseCurveChart({ curves, selectedCategories, chartId }: DoseResponseCurveChartProps) {
  const clusterColors = useClusterColors();
  const resolvedId = chartId || 'curve-overlay';
  const { applyToLayout: parentApply, getConfig } = useChartAppearance(resolvedId);
  const overlayApp = useChartAppearance(undefined, { parentId: resolvedId, key: 'overlay' });
  const categoryState = useReactiveState('categoryId');
  const [useLogScale, setUseLogScale] = useState(true);

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

  // Track whether the individual plots section is expanded
  const [plotsSectionExpanded, setPlotsSectionExpanded] = useState(true);

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

  // Collect all dose values and compute zero position for log scale
  const doseTransform = useMemo(() => {
    const allDoses: number[] = [];

    curves.forEach(curve => {
      if (curve.curvePoints) {
        curve.curvePoints.filter(p => p).forEach(p => allDoses.push(p!.dose));
      }
      if (curve.measuredPoints) {
        curve.measuredPoints.filter(p => p).forEach(p => allDoses.push(p!.dose));
      }
    });

    const { zeroPosition, minNonZero, maxValue } = prepareLogScaleValues(allDoses);
    const hasZeros = allDoses.some(d => d === 0);

    // Generate tick values and labels for log scale with zero
    let tickvals: number[] = [];
    let ticktext: string[] = [];

    if (useLogScale && zeroPosition && minNonZero && maxValue) {
      if (hasZeros) {
        tickvals.push(zeroPosition);
        ticktext.push('0');
      }

      // Add decade ticks
      const minDecade = Math.floor(Math.log10(minNonZero));
      const maxDecade = Math.ceil(Math.log10(maxValue));

      for (let decade = minDecade; decade <= maxDecade; decade++) {
        const tickValue = Math.pow(10, decade);
        if (!hasZeros || Math.abs(Math.log10(tickValue) - Math.log10(zeroPosition)) > 0.5) {
          tickvals.push(tickValue);
          ticktext.push(tickValue >= 1 ? tickValue.toString() : tickValue.toFixed(-decade + 1));
        }
      }
    }

    return {
      zeroPosition,
      hasZeros,
      tickvals,
      ticktext,
      transformDose: (dose: number) => {
        if (!useLogScale) return dose;
        if (dose === 0 && zeroPosition) return zeroPosition;
        return dose;
      },
    };
  }, [curves, useLogScale]);

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
          const xValues = curve.curvePoints.filter(p => p).map((p) => doseTransform.transformDose(p!.dose));
          const yValues = curve.curvePoints.filter(p => p).map((p) => p!.response);
          const originalDoses = curve.curvePoints.filter(p => p).map((p) => p!.dose);

          traces.push({
            x: xValues,
            y: yValues,
            customdata: originalDoses,
            type: 'scatter',
            mode: 'lines',
            name: getClusterLabel(clusterId),
            line: { width: 2 },
            hovertemplate: `${curveName}<br>${getClusterLabel(clusterId)}<br>Dose: %{customdata}<br>Response: %{y:.3f}<extra></extra>`,
            showlegend: false,
            clusterId: clusterId,
            pathwayDescription: curve.pathwayDescription,
          });

          isFirstCurveInCluster = false; // Subsequent curves won't show in legend
        }

        // Add measured data points
        if (curve.measuredPoints && curve.measuredPoints.length > 0) {
          const xMeasured = curve.measuredPoints.filter(p => p).map((p) => doseTransform.transformDose(p!.dose));
          const yMeasured = curve.measuredPoints.filter(p => p).map((p) => p!.response);
          const originalDoses = curve.measuredPoints.filter(p => p).map((p) => p!.dose);

          traces.push({
            x: xMeasured,
            y: yMeasured,
            customdata: originalDoses,
            type: 'scatter',
            mode: 'markers',
            name: `${curveName} (data)`,
            marker: { size: 8, symbol: 'circle' },
            showlegend: false,
            hovertemplate: `${curveName} (measured)<br>Dose: %{customdata}<br>Response: %{y:.3f}<extra></extra>`,
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
  }, [overlayCurves, curvesByCluster, pathwayToCluster, doseTransform]);

  // Set up cluster legend interaction (synchronizes with all other views)
  const { handleLegendClick, nonSelectedDisplayMode, hasSelection } = useClusterLegendInteraction({
    traces: baseTraces.filter(t => t.showlegend), // Only legend-visible traces
    categoryState,
    allData: selectedCategories,
    getClusterIdFromCategory: (row) => getClusterIdForCategory(row.categoryId),
    getCategoryId: (row) => row.categoryId,
    sourceName: 'chart',
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

  const layout: any = parentApply({
    title: {
      text: curves[0]?.pathwayDescription || 'Dose-Response Curves',
      font: { size: 16 },
    },
    xaxis: {
      title: { text: 'Dose' },
      type: 'log',
      autorange: true,
      showgrid: true,
    },
    yaxis: {
      title: { text: 'Log(Expression)' },
      autorange: true,
      showgrid: true,
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
  });

  const config: any = getConfig('dose_response_curves');

  // Create a simple overlay plot without the fancy reactive hooks
  const overlayPlotData = useMemo(() => {
    console.log('[DoseResponseCurveChart] Creating overlay plot with', baseTraces.length, 'traces');
    return baseTraces.map(trace => ({ ...trace }));
  }, [baseTraces]);

  const overlayLayout = useMemo(() => overlayApp.applyToLayout({
    title: {
      text: 'Dose-Response Curves Overlay',
      font: { size: 16 },
    },
    xaxis: {
      title: { text: 'Dose' },
      type: useLogScale ? 'log' as const : 'linear' as const,
      ...(useLogScale && doseTransform.tickvals.length > 0 ? {
        tickmode: 'array' as const,
        tickvals: doseTransform.tickvals,
        ticktext: doseTransform.ticktext,
      } : {
        autorange: true,
      }),
      showgrid: true,
    },
    yaxis: {
      title: { text: 'Log(Expression)' },
      autorange: true,
      showgrid: true,
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
  }), [useLogScale, doseTransform, overlayApp.applyToLayout]);

  return (
    <div style={{ width: '100%' }}>
      {/* Controls */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <Checkbox checked={useLogScale} onChange={(e) => setUseLogScale(e.target.checked)}>
          Log₁₀ Scale (Dose)
        </Checkbox>
        {useLogScale && doseTransform.hasZeros && (
          <Text type="secondary" style={{ fontSize: '0.85em' }}>
            Zero doses shown at pseudo-position, labeled as "0"
          </Text>
        )}
      </div>

      {/* Overlay plot */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ width: '100%', aspectRatio: '2/1' }}>
          <Plot
            data={overlayPlotData}
            layout={overlayLayout}
            config={overlayApp.getConfig('dose_response_overlay')}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </div>
      </div>

      {/* Individual category plots - sorted by BMD median, always rendered */}
      <Collapse
        activeKey={plotsSectionExpanded ? ['individual'] : []}
        onChange={(keys) => {
          const keyArray = Array.isArray(keys) ? keys : [keys];
          setPlotsSectionExpanded(keyArray.includes('individual'));
        }}
        items={[{
          key: 'individual',
          label: (
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              Individual Category Plots ({curvesByCategory.size})
            </span>
          ),
          children: (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '20px' }}>
              {Array.from(curvesByCategory.entries())
                .sort(([descA], [descB]) => {
                  const catA = selectedCategories.find(c => c.categoryDescription === descA);
                  const catB = selectedCategories.find(c => c.categoryDescription === descB);
                  return (catA?.bmdMedian ?? Infinity) - (catB?.bmdMedian ?? Infinity);
                })
                .map(([pathwayDesc, categoryCurves]) => {
                  const pathwayInfo = pathwayToCluster.get(pathwayDesc);
                  const clusterId = pathwayInfo?.clusterId ?? -1;
                  const clusterColor = clusterColors[clusterId] || '#999999';

                  // Calculate y-range for this category
                  let minY = Infinity;
                  let maxY = -Infinity;
                  categoryCurves.forEach(curve => {
                    curve.curvePoints?.filter(p => p).forEach(p => {
                      minY = Math.min(minY, p!.response);
                      maxY = Math.max(maxY, p!.response);
                    });
                    curve.measuredPoints?.filter(p => p).forEach(p => {
                      minY = Math.min(minY, p!.response);
                      maxY = Math.max(maxY, p!.response);
                    });
                  });
                  const yPadding = (maxY - minY) * 0.05;
                  minY -= yPadding;
                  maxY += yPadding;

                  // Build traces for this category
                  const categoryTraces: any[] = [];
                  categoryCurves.forEach(curve => {
                    const curveName = `${curve.geneSymbol} (${curve.probeId})`;
                    if (curve.curvePoints && curve.curvePoints.length > 0) {
                      categoryTraces.push({
                        x: curve.curvePoints.filter(p => p).map(p => doseTransform.transformDose(p!.dose)),
                        y: curve.curvePoints.filter(p => p).map(p => p!.response),
                        customdata: curve.curvePoints.filter(p => p).map(p => p!.dose),
                        type: 'scatter', mode: 'lines',
                        name: curveName,
                        line: { width: 2, color: clusterColor },
                        showlegend: false,
                        hovertemplate: `${curveName}<br>Dose: %{customdata}<br>Response: %{y:.3f}<extra></extra>`,
                      });
                    }
                    if (curve.measuredPoints && curve.measuredPoints.length > 0) {
                      categoryTraces.push({
                        x: curve.measuredPoints.filter(p => p).map(p => doseTransform.transformDose(p!.dose)),
                        y: curve.measuredPoints.filter(p => p).map(p => p!.response),
                        customdata: curve.measuredPoints.filter(p => p).map(p => p!.dose),
                        type: 'scatter', mode: 'markers',
                        marker: { size: 8, symbol: 'circle', color: clusterColor },
                        showlegend: false,
                        hovertemplate: `${curveName} (measured)<br>Dose: %{customdata}<br>Response: %{y:.3f}<extra></extra>`,
                      });
                    }
                    if (curve.bmdMarkers) {
                      const m = curve.bmdMarkers;
                      if (m.bmd != null) categoryTraces.push({ x: [m.bmd, m.bmd], y: [minY, maxY], type: 'scatter', mode: 'lines', line: { color: '#00FF00', width: 2 }, name: 'BMD', showlegend: false, hovertemplate: `BMD<br>Dose: ${m.bmd.toFixed(3)}<extra></extra>` });
                      if (m.bmdl != null) categoryTraces.push({ x: [m.bmdl, m.bmdl], y: [minY, maxY], type: 'scatter', mode: 'lines', line: { color: '#FF0000', width: 2 }, name: 'BMDL', showlegend: false, hovertemplate: `BMDL<br>Dose: ${m.bmdl.toFixed(3)}<extra></extra>` });
                      if (m.bmdu != null) categoryTraces.push({ x: [m.bmdu, m.bmdu], y: [minY, maxY], type: 'scatter', mode: 'lines', line: { color: '#0000FF', width: 2 }, name: 'BMDU', showlegend: false, hovertemplate: `BMDU<br>Dose: ${m.bmdu.toFixed(3)}<extra></extra>` });
                    }
                  });

                  const categoryLayout = parentApply({
                    xaxis: {
                      title: { text: 'Dose' },
                      type: useLogScale ? 'log' as const : 'linear' as const,
                      ...(useLogScale && doseTransform.tickvals.length > 0 ? { tickmode: 'array' as const, tickvals: doseTransform.tickvals, ticktext: doseTransform.ticktext } : {}),
                      showgrid: true,
                    },
                    yaxis: { title: { text: 'Log(Expression)' }, showgrid: true },
                    height: 350,
                    margin: { l: 60, r: 20, t: 20, b: 60 },
                    hovermode: 'closest' as const,
                    showlegend: false,
                  });

                  return (
                    <div key={pathwayDesc} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Checkbox
                          checked={includedInOverlay.has(pathwayDesc)}
                          onChange={() => toggleCategoryInOverlay(pathwayDesc)}
                        >
                          <span style={{ fontWeight: 500, fontSize: '13px' }}>{pathwayDesc}</span>
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
          ),
        }]}
      />
    </div>
  );
}
