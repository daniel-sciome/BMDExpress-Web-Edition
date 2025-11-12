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
 * Each histogram shows how many categories fall within each value range (bin).
 * This is a CATEGORY-LEVEL visualization - each data point is one category's aggregated mean value.
 */

import React, { useMemo, useState } from 'react';
import { Row, Col, Checkbox } from 'antd';
import { useSelector } from 'react-redux';
import Plot from 'react-plotly.js';
import { selectFilteredData } from '../../store/slices/categoryResultsSlice';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function MeanHistograms() {
  const data = useSelector(selectFilteredData);
  const [useLogYAxis, setUseLogYAxis] = useState(false);

  // Extract mean values from filtered data
  const meanData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const bmdMeans: number[] = [];
    const bmdlMeans: number[] = [];
    const bmduMeans: number[] = [];
    const bmdFifthMeans: number[] = [];
    const bmdTenthMeans: number[] = [];

    data.forEach(row => {
      // Collect valid mean values
      if (row.bmdMean !== undefined && row.bmdMean > 0 && !isNaN(row.bmdMean) && isFinite(row.bmdMean)) {
        bmdMeans.push(row.bmdMean);
      }
      if (row.bmdlMean !== undefined && row.bmdlMean > 0 && !isNaN(row.bmdlMean) && isFinite(row.bmdlMean)) {
        bmdlMeans.push(row.bmdlMean);
      }
      if (row.bmduMean !== undefined && row.bmduMean > 0 && !isNaN(row.bmduMean) && isFinite(row.bmduMean)) {
        bmduMeans.push(row.bmduMean);
      }
      if (row.bmdFifthPercentileTotalGenes !== undefined && row.bmdFifthPercentileTotalGenes > 0 && !isNaN(row.bmdFifthPercentileTotalGenes) && isFinite(row.bmdFifthPercentileTotalGenes)) {
        bmdFifthMeans.push(row.bmdFifthPercentileTotalGenes);
      }
      if (row.bmdTenthPercentileTotalGenes !== undefined && row.bmdTenthPercentileTotalGenes > 0 && !isNaN(row.bmdTenthPercentileTotalGenes) && isFinite(row.bmdTenthPercentileTotalGenes)) {
        bmdTenthMeans.push(row.bmdTenthPercentileTotalGenes);
      }
    });

    return {
      bmdMeans,
      bmdlMeans,
      bmduMeans,
      bmdFifthMeans,
      bmdTenthMeans
    };
  }, [data]);

  if (!meanData || (
    meanData.bmdMeans.length === 0 &&
    meanData.bmdlMeans.length === 0 &&
    meanData.bmduMeans.length === 0 &&
    meanData.bmdFifthMeans.length === 0 &&
    meanData.bmdTenthMeans.length === 0
  )) {
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
    bargap: 0.05,
    yaxis: {
      title: { text: 'Count' },
      type: histogramConfig.type,
      gridcolor: DEFAULT_GRID_COLOR,
    },
    margin: { l: 60, r: 50, t: 60, b: 60 },
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Checkbox checked={useLogYAxis} onChange={(e) => setUseLogYAxis(e.target.checked)}>
          Log Y-Axis
        </Checkbox>
      </div>

      <Row gutter={[16, 16]}>
        {/* BMD Mean Histogram */}
        {meanData.bmdMeans.length > 0 && (
          <Col xs={24} lg={12}>
            <Plot
              data={[{
                x: meanData.bmdMeans,
                type: 'histogram',
                nbinsx: histogramConfig.nbins,
                marker: {
                  color: '#1f77b4',
                  line: {
                    color: '#000000',
                    width: 1
                  }
                },
                hovertemplate: 'Value: %{x:.4f}<br>Count: %{y}<extra></extra>',
              }] as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMD Mean Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMD Mean' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 400,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMDL Mean Histogram */}
        {meanData.bmdlMeans.length > 0 && (
          <Col xs={24} lg={12}>
            <Plot
              data={[{
                x: meanData.bmdlMeans,
                type: 'histogram',
                nbinsx: histogramConfig.nbins,
                marker: {
                  color: '#ff7f0e',
                  line: {
                    color: '#000000',
                    width: 1
                  }
                },
                hovertemplate: 'Value: %{x:.4f}<br>Count: %{y}<extra></extra>',
              }] as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMDL Mean Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMDL Mean' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 400,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMDU Mean Histogram */}
        {meanData.bmduMeans.length > 0 && (
          <Col xs={24} lg={12}>
            <Plot
              data={[{
                x: meanData.bmduMeans,
                type: 'histogram',
                nbinsx: histogramConfig.nbins,
                marker: {
                  color: '#2ca02c',
                  line: {
                    color: '#000000',
                    width: 1
                  }
                },
                hovertemplate: 'Value: %{x:.4f}<br>Count: %{y}<extra></extra>',
              }] as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMDU Mean Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMDU Mean' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 400,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMD 5th Percentile Mean Histogram */}
        {meanData.bmdFifthMeans.length > 0 && (
          <Col xs={24} lg={12}>
            <Plot
              data={[{
                x: meanData.bmdFifthMeans,
                type: 'histogram',
                nbinsx: histogramConfig.nbins,
                marker: {
                  color: '#d62728',
                  line: {
                    color: '#000000',
                    width: 1
                  }
                },
                hovertemplate: 'Value: %{x:.4f}<br>Count: %{y}<extra></extra>',
              }] as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMD 5th Percentile Mean Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMD 5th Percentile Mean' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 400,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMD 10th Percentile Mean Histogram */}
        {meanData.bmdTenthMeans.length > 0 && (
          <Col xs={24} lg={12}>
            <Plot
              data={[{
                x: meanData.bmdTenthMeans,
                type: 'histogram',
                nbinsx: histogramConfig.nbins,
                marker: {
                  color: '#9467bd',
                  line: {
                    color: '#000000',
                    width: 1
                  }
                },
                hovertemplate: 'Value: %{x:.4f}<br>Count: %{y}<extra></extra>',
              }] as any}
              layout={{
                ...commonLayout,
                title: { text: 'BMD 10th Percentile Mean Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMD 10th Percentile Mean' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 400,
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
          <li>Each histogram shows the distribution of category-level mean values</li>
          <li>X-axis: Mean value range, Y-axis: Number of categories in that range</li>
          <li>Default bins: 20 equal-width buckets</li>
          <li>Toggle "Log Y-Axis" for better visibility with wide-ranging counts</li>
          <li>Percentile means (5th, 10th) show the average of the lower-tail BMD values within each category</li>
        </ul>
      </div>
    </div>
  );
}
