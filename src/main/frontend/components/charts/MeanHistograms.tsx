/**
 * Mean Histograms Component
 *
 * Displays 5 histograms showing the distribution of category-level BMD mean statistics:
 * 1. BMD Mean
 * 2. BMDL Mean
 * 3. BMDU Mean
 * 4. BMD 5th Percentile
 * 5. BMD 10th Percentile
 *
 * Each histogram shows stacked bars by cluster type:
 * - Clustered (green): categories assigned to numbered clusters
 * - Unclassified (orange): categories in UMAP but not clustered
 * - Not in Reference (gray): categories not in UMAP reference
 *
 * This is a CATEGORY-LEVEL visualization - each data point is one category's aggregated mean value.
 */

import React, { useMemo, useState } from 'react';
import { Row, Col, Checkbox } from 'antd';
import Plot from 'react-plotly.js';
import { useClusterTypeSplit, CLUSTER_TYPE_COLORS, CLUSTER_TYPE_LABELS } from './hooks/useClusterTypeSplit';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function MeanHistograms() {
  const { clustered, unclassified, notInReference, allData } = useClusterTypeSplit();
  const [useLogYAxis, setUseLogYAxis] = useState(false);

  // Extract mean values from each cluster type
  const meanData = useMemo(() => {
    if (!allData || allData.length === 0) return null;

    const extractValues = (data: typeof clustered, field: string) => {
      return data
        .map(row => (row as any)[field])
        .filter((v: number) => v !== undefined && v > 0 && !isNaN(v) && isFinite(v));
    };

    return {
      bmdMeans: {
        clustered: extractValues(clustered, 'bmdMean'),
        unclassified: extractValues(unclassified, 'bmdMean'),
        notInReference: extractValues(notInReference, 'bmdMean'),
      },
      bmdlMeans: {
        clustered: extractValues(clustered, 'bmdlMean'),
        unclassified: extractValues(unclassified, 'bmdlMean'),
        notInReference: extractValues(notInReference, 'bmdlMean'),
      },
      bmduMeans: {
        clustered: extractValues(clustered, 'bmduMean'),
        unclassified: extractValues(unclassified, 'bmduMean'),
        notInReference: extractValues(notInReference, 'bmduMean'),
      },
      bmdFifthMeans: {
        clustered: extractValues(clustered, 'bmdFifthPercentileTotalGenes'),
        unclassified: extractValues(unclassified, 'bmdFifthPercentileTotalGenes'),
        notInReference: extractValues(notInReference, 'bmdFifthPercentileTotalGenes'),
      },
      bmdTenthMeans: {
        clustered: extractValues(clustered, 'bmdTenthPercentileTotalGenes'),
        unclassified: extractValues(unclassified, 'bmdTenthPercentileTotalGenes'),
        notInReference: extractValues(notInReference, 'bmdTenthPercentileTotalGenes'),
      },
    };
  }, [clustered, unclassified, notInReference, allData]);

  // Check if any data exists
  const hasAnyData = meanData && (
    meanData.bmdMeans.clustered.length > 0 ||
    meanData.bmdMeans.unclassified.length > 0 ||
    meanData.bmdMeans.notInReference.length > 0 ||
    meanData.bmdlMeans.clustered.length > 0 ||
    meanData.bmduMeans.clustered.length > 0
  );

  if (!hasAnyData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid mean data available for histograms
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
  const hasBmdMeans = meanData.bmdMeans.clustered.length > 0 || meanData.bmdMeans.unclassified.length > 0 || meanData.bmdMeans.notInReference.length > 0;
  const hasBmdlMeans = meanData.bmdlMeans.clustered.length > 0 || meanData.bmdlMeans.unclassified.length > 0 || meanData.bmdlMeans.notInReference.length > 0;
  const hasBmduMeans = meanData.bmduMeans.clustered.length > 0 || meanData.bmduMeans.unclassified.length > 0 || meanData.bmduMeans.notInReference.length > 0;
  const hasBmdFifthMeans = meanData.bmdFifthMeans.clustered.length > 0 || meanData.bmdFifthMeans.unclassified.length > 0 || meanData.bmdFifthMeans.notInReference.length > 0;
  const hasBmdTenthMeans = meanData.bmdTenthMeans.clustered.length > 0 || meanData.bmdTenthMeans.unclassified.length > 0 || meanData.bmdTenthMeans.notInReference.length > 0;

  // First histogram shows the legend
  const isFirstHistogram = hasBmdMeans;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Checkbox checked={useLogYAxis} onChange={(e) => setUseLogYAxis(e.target.checked)}>
          Log Y-Axis
        </Checkbox>
      </div>

      <Row gutter={[16, 16]}>
        {/* BMD Mean Histogram */}
        {hasBmdMeans && (
          <Col xs={24} lg={12}>
            <Plot
              data={createStackedTraces(meanData.bmdMeans, true) as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMD Mean Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMD Mean' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 450,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMDL Mean Histogram */}
        {hasBmdlMeans && (
          <Col xs={24} lg={12}>
            <Plot
              data={createStackedTraces(meanData.bmdlMeans, !isFirstHistogram) as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMDL Mean Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMDL Mean' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 450,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMDU Mean Histogram */}
        {hasBmduMeans && (
          <Col xs={24} lg={12}>
            <Plot
              data={createStackedTraces(meanData.bmduMeans, false) as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMDU Mean Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMDU Mean' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 450,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMD 5th Percentile Mean Histogram */}
        {hasBmdFifthMeans && (
          <Col xs={24} lg={12}>
            <Plot
              data={createStackedTraces(meanData.bmdFifthMeans, false) as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMD 5th Percentile Mean Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMD 5th Percentile Mean' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 450,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMD 10th Percentile Mean Histogram */}
        {hasBmdTenthMeans && (
          <Col xs={24} lg={12}>
            <Plot
              data={createStackedTraces(meanData.bmdTenthMeans, false) as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMD 10th Percentile Mean Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMD 10th Percentile Mean' }, gridcolor: DEFAULT_GRID_COLOR },
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
          <li>Each histogram shows the distribution of category-level mean values, split by cluster type</li>
          <li><span style={{ color: CLUSTER_TYPE_COLORS.clustered }}>■</span> Clustered: categories assigned to numbered clusters in UMAP</li>
          <li><span style={{ color: CLUSTER_TYPE_COLORS.unclassified }}>■</span> Unclassified: categories in UMAP reference but not clustered</li>
          <li><span style={{ color: CLUSTER_TYPE_COLORS.notInReference }}>■</span> Not in Reference: categories not in UMAP reference data</li>
          <li>X-axis: Mean value range, Y-axis: Number of categories in that range</li>
          <li>Default bins: 20 equal-width buckets</li>
          <li>Toggle "Log Y-Axis" for better visibility with wide-ranging counts</li>
        </ul>
      </div>
    </div>
  );
}
