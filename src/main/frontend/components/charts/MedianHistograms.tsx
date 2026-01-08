/**
 * Median Histograms Component
 *
 * Displays 3 histograms showing the distribution of category-level BMD median statistics:
 * 1. BMD Median
 * 2. BMDL Median
 * 3. BMDU Median
 *
 * Each histogram shows stacked bars by cluster type:
 * - Clustered (green): categories assigned to numbered clusters
 * - Unclassified (orange): categories in UMAP but not clustered
 * - Not in Reference (gray): categories not in UMAP reference
 *
 * This is a CATEGORY-LEVEL visualization - each data point is one category's aggregated median value.
 *
 * Medians are more robust to outliers than means, providing a better measure of central tendency
 * when the distribution is skewed.
 */

import React, { useMemo, useState } from 'react';
import { Row, Col, Checkbox } from 'antd';
import Plot from 'react-plotly.js';
import { useClusterTypeSplit, CLUSTER_TYPE_COLORS, CLUSTER_TYPE_LABELS } from './hooks/useClusterTypeSplit';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function MedianHistograms() {
  const { clustered, unclassified, notInReference, allData } = useClusterTypeSplit();
  const [useLogYAxis, setUseLogYAxis] = useState(false);

  // Extract median values from each cluster type
  const medianData = useMemo(() => {
    if (!allData || allData.length === 0) return null;

    const extractValues = (data: typeof clustered, field: string) => {
      return data
        .map(row => (row as any)[field])
        .filter((v: number) => v !== undefined && v > 0 && !isNaN(v) && isFinite(v));
    };

    return {
      bmdMedians: {
        clustered: extractValues(clustered, 'bmdMedian'),
        unclassified: extractValues(unclassified, 'bmdMedian'),
        notInReference: extractValues(notInReference, 'bmdMedian'),
      },
      bmdlMedians: {
        clustered: extractValues(clustered, 'bmdlMedian'),
        unclassified: extractValues(unclassified, 'bmdlMedian'),
        notInReference: extractValues(notInReference, 'bmdlMedian'),
      },
      bmduMedians: {
        clustered: extractValues(clustered, 'bmduMedian'),
        unclassified: extractValues(unclassified, 'bmduMedian'),
        notInReference: extractValues(notInReference, 'bmduMedian'),
      },
    };
  }, [clustered, unclassified, notInReference, allData]);

  // Check if any data exists
  const hasAnyData = medianData && (
    medianData.bmdMedians.clustered.length > 0 ||
    medianData.bmdMedians.unclassified.length > 0 ||
    medianData.bmdMedians.notInReference.length > 0 ||
    medianData.bmdlMedians.clustered.length > 0 ||
    medianData.bmduMedians.clustered.length > 0
  );

  if (!hasAnyData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid median data available for histograms
      </div>
    );
  }

  const histogramConfig = {
    type: useLogYAxis ? 'log' : 'linear',
    nbins: 20 // Default bucket size from JavaFX implementation
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
    showlegend: true,
    legend: {
      orientation: 'h' as const,
      x: 0.5,
      xanchor: 'center' as const,
      y: -0.15,
    },
  };

  // Helper to create 3 stacked traces for a histogram
  const createStackedTraces = (
    data: { clustered: number[]; unclassified: number[]; notInReference: number[] },
    showLegend: boolean = false
  ) => {
    const traces: any[] = [];

    if (data.clustered.length > 0) {
      traces.push({
        x: data.clustered,
        type: 'histogram',
        nbinsx: histogramConfig.nbins,
        name: CLUSTER_TYPE_LABELS.clustered,
        marker: {
          color: CLUSTER_TYPE_COLORS.clustered,
          line: { color: '#000000', width: 1 }
        },
        hovertemplate: 'Value: %{x:.4f}<br>Count: %{y}<extra>Clustered</extra>',
        showlegend: showLegend,
        legendgroup: 'clustered',
      });
    }

    if (data.unclassified.length > 0) {
      traces.push({
        x: data.unclassified,
        type: 'histogram',
        nbinsx: histogramConfig.nbins,
        name: CLUSTER_TYPE_LABELS.unclassified,
        marker: {
          color: CLUSTER_TYPE_COLORS.unclassified,
          line: { color: '#000000', width: 1 }
        },
        hovertemplate: 'Value: %{x:.4f}<br>Count: %{y}<extra>Unclassified</extra>',
        showlegend: showLegend,
        legendgroup: 'unclassified',
      });
    }

    if (data.notInReference.length > 0) {
      traces.push({
        x: data.notInReference,
        type: 'histogram',
        nbinsx: histogramConfig.nbins,
        name: CLUSTER_TYPE_LABELS.notInReference,
        marker: {
          color: CLUSTER_TYPE_COLORS.notInReference,
          line: { color: '#000000', width: 1 }
        },
        hovertemplate: 'Value: %{x:.4f}<br>Count: %{y}<extra>Not in Reference</extra>',
        showlegend: showLegend,
        legendgroup: 'notInReference',
      });
    }

    return traces;
  };

  // Check if any histogram has data
  const hasBmdMedians = medianData.bmdMedians.clustered.length > 0 || medianData.bmdMedians.unclassified.length > 0 || medianData.bmdMedians.notInReference.length > 0;
  const hasBmdlMedians = medianData.bmdlMedians.clustered.length > 0 || medianData.bmdlMedians.unclassified.length > 0 || medianData.bmdlMedians.notInReference.length > 0;
  const hasBmduMedians = medianData.bmduMedians.clustered.length > 0 || medianData.bmduMedians.unclassified.length > 0 || medianData.bmduMedians.notInReference.length > 0;

  // First histogram shows the legend
  const isFirstHistogram = hasBmdMedians;

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
              data={createStackedTraces(medianData.bmdMedians, true) as any}
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
              data={createStackedTraces(medianData.bmdlMedians, !isFirstHistogram) as any}
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
              data={createStackedTraces(medianData.bmduMedians, false) as any}
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
          <li>Each histogram shows the distribution of category-level median values, split by cluster type</li>
          <li><span style={{ color: CLUSTER_TYPE_COLORS.clustered }}>■</span> Clustered: categories assigned to numbered clusters in UMAP</li>
          <li><span style={{ color: CLUSTER_TYPE_COLORS.unclassified }}>■</span> Unclassified: categories in UMAP reference but not clustered</li>
          <li><span style={{ color: CLUSTER_TYPE_COLORS.notInReference }}>■</span> Not in Reference: categories not in UMAP reference data</li>
          <li>X-axis: Median value range, Y-axis: Number of categories in that range</li>
          <li>Default bins: 20 equal-width buckets</li>
          <li>Toggle "Log Y-Axis" for better visibility with wide-ranging counts</li>
          <li>Medians are more robust to outliers than means, showing the true center of each category's distribution</li>
        </ul>
      </div>
    </div>
  );
}
