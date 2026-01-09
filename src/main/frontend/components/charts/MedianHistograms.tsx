/**
 * Median Histograms Component
 *
 * Displays 3 histograms showing the distribution of category-level BMD median statistics:
 * 1. BMD Median
 * 2. BMDL Median
 * 3. BMDU Median
 *
 * Each histogram shows stacked bars colored by UMAP cluster assignment.
 * Colors match the sidebar ClusterPicker for consistency.
 *
 * Responds to display modes:
 * - highlight: Show all data at full opacity
 * - dim: Show in-focus at full opacity, out-of-focus dimmed
 * - isolate: Only show in-focus data
 *
 * This is a CATEGORY-LEVEL visualization - each data point is one category's aggregated median value.
 *
 * Medians are more robust to outliers than means, providing a better measure of central tendency
 * when the distribution is skewed.
 */

import React, { useMemo, useState } from 'react';
import { Row, Col, Checkbox } from 'antd';
import Plot from 'react-plotly.js';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function MedianHistograms() {
  const { data: allData, displayMode } = useFocusAwareStyling();
  const clusterColors = useClusterColors();
  const [useLogYAxis, setUseLogYAxis] = useState(false);

  // Group data by cluster and focus state, extract values for each metric
  const clusterData = useMemo(() => {
    if (!allData || allData.length === 0) return null;

    // Get unique cluster IDs and sort them (outliers last)
    const clusterIds = new Set<number>();
    allData.forEach(row => {
      const clusterId = getClusterIdForCategory(row.categoryId);
      clusterIds.add(clusterId);
    });
    const sortedClusterIds = Array.from(clusterIds).sort((a, b) => {
      if (a < 0 && b >= 0) return 1;
      if (a >= 0 && b < 0) return -1;
      return a - b;
    });

    // Extract values by cluster AND focus state for each metric
    // Returns { inFocus: Map<clusterId, values>, outOfFocus: Map<clusterId, values> }
    const extractValuesByClusterAndFocus = (field: string) => {
      const inFocus = new Map<number, number[]>();
      const outOfFocus = new Map<number, number[]>();
      sortedClusterIds.forEach(id => {
        inFocus.set(id, []);
        outOfFocus.set(id, []);
      });

      allData.forEach(row => {
        const value = (row as any)[field];
        const clusterId = getClusterIdForCategory(row.categoryId);
        if (value !== undefined && value > 0 && !isNaN(value) && isFinite(value)) {
          const targetMap = row.inFocus ? inFocus : outOfFocus;
          const arr = targetMap.get(clusterId);
          if (arr) arr.push(value);
        }
      });

      return { inFocus, outOfFocus };
    };

    return {
      clusterIds: sortedClusterIds,
      bmdMedians: extractValuesByClusterAndFocus('bmdMedian'),
      bmdlMedians: extractValuesByClusterAndFocus('bmdlMedian'),
      bmduMedians: extractValuesByClusterAndFocus('bmduMedian'),
    };
  }, [allData]);

  // Check if any data exists
  const hasAnyData = useMemo(() => {
    if (!clusterData) return false;
    let total = 0;
    clusterData.bmdMedians.inFocus.forEach(arr => total += arr.length);
    clusterData.bmdMedians.outOfFocus.forEach(arr => total += arr.length);
    clusterData.bmdlMedians.inFocus.forEach(arr => total += arr.length);
    clusterData.bmdlMedians.outOfFocus.forEach(arr => total += arr.length);
    clusterData.bmduMedians.inFocus.forEach(arr => total += arr.length);
    clusterData.bmduMedians.outOfFocus.forEach(arr => total += arr.length);
    return total > 0;
  }, [clusterData]);

  if (!hasAnyData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid median data available for histograms
      </div>
    );
  }

  const histogramConfig = {
    type: useLogYAxis ? 'log' : 'linear',
    nbins: 20
  };

  const commonLayout = {
    ...DEFAULT_LAYOUT_STYLES,
    barmode: 'stack' as const,
    bargap: 0.05,
    yaxis: {
      title: { text: 'Count' },
      type: histogramConfig.type,
      gridcolor: DEFAULT_GRID_COLOR,
    },
    margin: { l: 60, r: 50, t: 60, b: 60 },
    showlegend: false,
  };

  // Helper to create stacked traces for a histogram with display mode support
  // Creates traces for in-focus (full opacity) and out-of-focus (dimmed/hidden based on mode)
  const createStackedTraces = (dataByClusterAndFocus: { inFocus: Map<number, number[]>; outOfFocus: Map<number, number[]> }) => {
    const traces: any[] = [];

    clusterData!.clusterIds.forEach(clusterId => {
      const inFocusValues = dataByClusterAndFocus.inFocus.get(clusterId) || [];
      const outOfFocusValues = dataByClusterAndFocus.outOfFocus.get(clusterId) || [];
      const color = clusterColors[clusterId] || '#999999';
      const label = getClusterLabel(clusterId);

      // In-focus trace (always full opacity when visible)
      if (inFocusValues.length > 0) {
        traces.push({
          x: inFocusValues,
          type: 'histogram',
          nbinsx: histogramConfig.nbins,
          name: `${label} (in focus)`,
          marker: {
            color: color,
            opacity: 1.0,
            line: { color: 'white', width: 1 }
          },
          hovertemplate: `Value: %{x:.4f}<br>Count: %{y}<extra>${label}</extra>`,
          showlegend: false,
        });
      }

      // Out-of-focus trace: shown in highlight mode (full), dimmed in dim mode, hidden in isolate mode
      if (outOfFocusValues.length > 0 && displayMode !== 'isolate') {
        const outOfFocusOpacity = displayMode === 'dim' ? 0.2 : 1.0;
        traces.push({
          x: outOfFocusValues,
          type: 'histogram',
          nbinsx: histogramConfig.nbins,
          name: `${label} (out of focus)`,
          marker: {
            color: color,
            opacity: outOfFocusOpacity,
            line: { color: 'white', width: 1 }
          },
          hovertemplate: `Value: %{x:.4f}<br>Count: %{y}<extra>${label}</extra>`,
          showlegend: false,
        });
      }
    });

    return traces;
  };

  // Check if each histogram has data (considering display mode)
  const hasData = (dataByClusterAndFocus: { inFocus: Map<number, number[]>; outOfFocus: Map<number, number[]> }) => {
    let total = 0;
    dataByClusterAndFocus.inFocus.forEach(arr => total += arr.length);
    if (displayMode !== 'isolate') {
      dataByClusterAndFocus.outOfFocus.forEach(arr => total += arr.length);
    }
    return total > 0;
  };

  const hasBmdMedians = hasData(clusterData!.bmdMedians);
  const hasBmdlMedians = hasData(clusterData!.bmdlMedians);
  const hasBmduMedians = hasData(clusterData!.bmduMedians);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Checkbox checked={useLogYAxis} onChange={(e) => setUseLogYAxis(e.target.checked)}>
          Log Y-Axis
        </Checkbox>
      </div>

      <Row gutter={[16, 16]}>
        {/* BMD Median Histogram */}
        {hasBmdMedians && (
          <Col xs={24} lg={12}>
            <Plot
              data={createStackedTraces(clusterData!.bmdMedians) as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMD Median Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMD Median' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 450,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMDL Median Histogram */}
        {hasBmdlMedians && (
          <Col xs={24} lg={12}>
            <Plot
              data={createStackedTraces(clusterData!.bmdlMedians) as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMDL Median Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMDL Median' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 450,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMDU Median Histogram */}
        {hasBmduMedians && (
          <Col xs={24} lg={12}>
            <Plot
              data={createStackedTraces(clusterData!.bmduMedians) as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMDU Median Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMDU Median' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 450,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}
      </Row>

      <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
        <p><strong>About these histograms:</strong></p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Each histogram shows the distribution of category-level median values</li>
          <li>Colors correspond to UMAP cluster assignments (same as sidebar cluster picker)</li>
          <li>X-axis: Median value range, Y-axis: Number of categories in that range</li>
          <li>Default bins: 20 equal-width buckets</li>
          <li>Toggle "Log Y-Axis" for better visibility with wide-ranging counts</li>
          <li>Medians are more robust to outliers than means, showing the true center of each category's distribution</li>
        </ul>
      </div>
    </div>
  );
}
