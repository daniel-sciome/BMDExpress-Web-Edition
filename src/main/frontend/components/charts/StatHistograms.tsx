/**
 * Stat Histograms Component
 *
 * Displays histogram(s) showing the distribution of category-level BMD statistics.
 * Can show a single base (BMD/BMDL/BMDU) or all three side by side.
 *
 * The histogram shows stacked bars colored by UMAP cluster assignment.
 * Colors match the sidebar ClusterPicker for consistency.
 *
 * Responds to display modes:
 * - highlight: Show all data at full opacity
 * - dim: Show in-focus at full opacity, out-of-focus dimmed
 * - isolate: Only show in-focus data
 *
 * This is a CATEGORY-LEVEL visualization - each data point is one category's aggregated value.
 */

import React, { useMemo, useState } from 'react';
import { Row, Col, Checkbox, Select, Space, Typography } from 'antd';
import Plot from 'react-plotly.js';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useBmdMetricTriple } from './hooks/useBmdMetric';
import { BmdStatSelector } from './BmdMetricSelector';
import { getClusterColor, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';
import type { BmdBaseType } from './utils/bmdMetricConfig';

const { Option } = Select;
const { Text } = Typography;

type BaseSelection = BmdBaseType | 'all';

export default function StatHistograms() {
  const { data: allData, displayMode } = useFocusAwareStyling();
  const [useLogXAxis, setUseLogXAxis] = useState(true);
  const [selectedBase, setSelectedBase] = useState<BaseSelection>('bmd');

  // BMD metric selection (all three bases share the same stat)
  const { stat, setStat, bmd, bmdl, bmdu } = useBmdMetricTriple();

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

    // Extract values by cluster AND focus state for a given getValue function
    const extractValuesByClusterAndFocus = (getValue: (row: any) => number | undefined) => {
      const inFocus = new Map<number, number[]>();
      const outOfFocus = new Map<number, number[]>();
      sortedClusterIds.forEach(id => {
        inFocus.set(id, []);
        outOfFocus.set(id, []);
      });

      allData.forEach(row => {
        const value = getValue(row);
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
      bmdValues: extractValuesByClusterAndFocus(bmd.getValue),
      bmdlValues: extractValuesByClusterAndFocus(bmdl.getValue),
      bmduValues: extractValuesByClusterAndFocus(bmdu.getValue),
    };
  }, [allData, bmd, bmdl, bmdu]);

  // Check if any data exists
  const hasAnyData = useMemo(() => {
    if (!clusterData) return false;
    let total = 0;
    clusterData.bmdValues.inFocus.forEach(arr => total += arr.length);
    clusterData.bmdValues.outOfFocus.forEach(arr => total += arr.length);
    clusterData.bmdlValues.inFocus.forEach(arr => total += arr.length);
    clusterData.bmdlValues.outOfFocus.forEach(arr => total += arr.length);
    clusterData.bmduValues.inFocus.forEach(arr => total += arr.length);
    clusterData.bmduValues.outOfFocus.forEach(arr => total += arr.length);
    return total > 0;
  }, [clusterData]);

  if (!hasAnyData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid data available for histograms
      </div>
    );
  }

  const histogramConfig = {
    nbins: 20
  };

  const commonLayout = {
    ...DEFAULT_LAYOUT_STYLES,
    barmode: 'stack' as const,
    bargap: 0.05,
    yaxis: {
      title: { text: 'Count' },
      gridcolor: DEFAULT_GRID_COLOR,
    },
    margin: { l: 60, r: 50, t: 60, b: 60 },
    showlegend: false,
  };

  // Generate x-axis config for a given set of values
  const getXAxisConfig = (dataByClusterAndFocus: { inFocus: Map<number, number[]>; outOfFocus: Map<number, number[]> }) => {
    if (!useLogXAxis) {
      return {
        gridcolor: DEFAULT_GRID_COLOR,
        type: 'linear' as const,
      };
    }

    // Collect all values to determine range
    const allValues: number[] = [];
    dataByClusterAndFocus.inFocus.forEach(arr => allValues.push(...arr));
    if (displayMode !== 'isolate') {
      dataByClusterAndFocus.outOfFocus.forEach(arr => allValues.push(...arr));
    }

    if (allValues.length === 0) {
      return { gridcolor: DEFAULT_GRID_COLOR, type: 'linear' as const };
    }

    const logValues = allValues.map(v => Math.log10(v));
    const minLog = Math.floor(Math.min(...logValues));
    const maxLog = Math.ceil(Math.max(...logValues));

    // Generate tick values for each decade
    const tickvals: number[] = [];
    const ticktext: string[] = [];
    for (let i = minLog; i <= maxLog; i++) {
      tickvals.push(i);
      const val = Math.pow(10, i);
      ticktext.push(val >= 1 ? val.toString() : val.toFixed(-i));
    }

    return {
      gridcolor: DEFAULT_GRID_COLOR,
      type: 'linear' as const,
      tickvals,
      ticktext,
    };
  };

  // Helper to create stacked traces for a histogram with display mode support
  // When using log scale, we transform values to log10 space for proper binning
  const createStackedTraces = (dataByClusterAndFocus: { inFocus: Map<number, number[]>; outOfFocus: Map<number, number[]> }) => {
    const traces: any[] = [];

    clusterData!.clusterIds.forEach(clusterId => {
      const inFocusValues = dataByClusterAndFocus.inFocus.get(clusterId) || [];
      const outOfFocusValues = dataByClusterAndFocus.outOfFocus.get(clusterId) || [];
      const color = getClusterColor(clusterId);
      const label = getClusterLabel(clusterId);

      // Transform to log10 if using log scale
      const transformValues = (values: number[]) =>
        useLogXAxis ? values.map(v => Math.log10(v)) : values;

      // In-focus trace (always full opacity when visible)
      if (inFocusValues.length > 0) {
        traces.push({
          x: transformValues(inFocusValues),
          type: 'histogram',
          nbinsx: histogramConfig.nbins,
          name: `${label} (in focus)`,
          marker: {
            color: color,
            opacity: 1.0,
            line: { color: 'white', width: 1 }
          },
          hovertemplate: useLogXAxis
            ? `Value: 10^%{x:.2f}<br>Count: %{y}<extra>${label}</extra>`
            : `Value: %{x:.4f}<br>Count: %{y}<extra>${label}</extra>`,
          showlegend: false,
        });
      }

      // Out-of-focus trace: shown in highlight mode (full), dimmed in dim mode, hidden in isolate mode
      if (outOfFocusValues.length > 0 && displayMode !== 'isolate') {
        const outOfFocusOpacity = displayMode === 'dim' ? 0.2 : 1.0;
        traces.push({
          x: transformValues(outOfFocusValues),
          type: 'histogram',
          nbinsx: histogramConfig.nbins,
          name: `${label} (out of focus)`,
          marker: {
            color: color,
            opacity: outOfFocusOpacity,
            line: { color: 'white', width: 1 }
          },
          hovertemplate: useLogXAxis
            ? `Value: 10^%{x:.2f}<br>Count: %{y}<extra>${label}</extra>`
            : `Value: %{x:.4f}<br>Count: %{y}<extra>${label}</extra>`,
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

  const hasBmdValues = hasData(clusterData!.bmdValues);
  const hasBmdlValues = hasData(clusterData!.bmdlValues);
  const hasBmduValues = hasData(clusterData!.bmduValues);

  // Determine which histograms to show
  const showBmd = selectedBase === 'all' || selectedBase === 'bmd';
  const showBmdl = selectedBase === 'all' || selectedBase === 'bmdl';
  const showBmdu = selectedBase === 'all' || selectedBase === 'bmdu';

  // Determine column width based on how many histograms are shown
  const colWidth = selectedBase === 'all' ? 12 : 24;

  return (
    <div style={{ width: '100%' }}>
      {/* Controls */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <Space>
          <Text>Base:</Text>
          <Select
            value={selectedBase}
            onChange={setSelectedBase}
            style={{ width: 100 }}
          >
            <Option value="all">All</Option>
            <Option value="bmd">BMD</Option>
            <Option value="bmdl">BMDL</Option>
            <Option value="bmdu">BMDU</Option>
          </Select>
        </Space>
        <Space>
          <Text>Statistic:</Text>
          <BmdStatSelector stat={stat} onStatChange={setStat} />
        </Space>
        <Checkbox checked={useLogXAxis} onChange={(e) => setUseLogXAxis(e.target.checked)}>
          Log₁₀ Scale
        </Checkbox>
      </div>

      <Row gutter={[16, 16]}>
        {/* BMD Histogram */}
        {showBmd && hasBmdValues && (
          <Col xs={24} lg={colWidth} key={`bmd-col-${selectedBase}`}>
            <Plot
              key={`bmd-plot-${selectedBase}`}
              data={createStackedTraces(clusterData!.bmdValues) as any}
              layout={{
                ...commonLayout,
                title: { text: `${bmd.label} Histogram`, font: { size: 14 } },
                xaxis: { ...getXAxisConfig(clusterData!.bmdValues), title: { text: useLogXAxis ? `${bmd.label} (log₁₀)` : bmd.label } },
                height: 450,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMDL Histogram */}
        {showBmdl && hasBmdlValues && (
          <Col xs={24} lg={colWidth} key={`bmdl-col-${selectedBase}`}>
            <Plot
              key={`bmdl-plot-${selectedBase}`}
              data={createStackedTraces(clusterData!.bmdlValues) as any}
              layout={{
                ...commonLayout,
                title: { text: `${bmdl.label} Histogram`, font: { size: 14 } },
                xaxis: { ...getXAxisConfig(clusterData!.bmdlValues), title: { text: useLogXAxis ? `${bmdl.label} (log₁₀)` : bmdl.label } },
                height: 450,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMDU Histogram */}
        {showBmdu && hasBmduValues && (
          <Col xs={24} lg={colWidth} key={`bmdu-col-${selectedBase}`}>
            <Plot
              key={`bmdu-plot-${selectedBase}`}
              data={createStackedTraces(clusterData!.bmduValues) as any}
              layout={{
                ...commonLayout,
                title: { text: `${bmdu.label} Histogram`, font: { size: 14 } },
                xaxis: { ...getXAxisConfig(clusterData!.bmduValues), title: { text: useLogXAxis ? `${bmdu.label} (log₁₀)` : bmdu.label } },
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
          <li>Each histogram shows the distribution of category-level values for the selected statistic</li>
          <li>Colors correspond to UMAP cluster assignments (same as sidebar cluster picker)</li>
          <li>X-axis: Value range, Y-axis: Number of categories in that range</li>
          <li>Default bins: 20 equal-width buckets</li>
          <li>Toggle "Log Y-Axis" for better visibility with wide-ranging counts</li>
        </ul>
      </div>
    </div>
  );
}
