/**
 * Median Histograms Component
 *
 * Displays 3 histograms showing the distribution of category-level BMD median statistics:
 * 1. BMD Median
 * 2. BMDL Median
 * 3. BMDU Median
 *
 * Each histogram shows how many categories fall within each value range (bin).
 * This is a CATEGORY-LEVEL visualization - each data point is one category's aggregated median value.
 *
 * Medians are more robust to outliers than means, providing a better measure of central tendency
 * when the distribution is skewed.
 */

import React, { useMemo, useState } from 'react';
import { Row, Col, Checkbox } from 'antd';
import { useSelector } from 'react-redux';
import Plot from 'react-plotly.js';
import { selectFilteredData } from '../../store/slices/categoryResultsSlice';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function MedianHistograms() {
  const data = useSelector(selectFilteredData);
  const [useLogYAxis, setUseLogYAxis] = useState(false);

  // Extract median values from filtered data
  const medianData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const bmdMedians: number[] = [];
    const bmdlMedians: number[] = [];
    const bmduMedians: number[] = [];

    data.forEach(row => {
      // Collect valid median values
      if (row.bmdMedian !== undefined && row.bmdMedian > 0 && !isNaN(row.bmdMedian) && isFinite(row.bmdMedian)) {
        bmdMedians.push(row.bmdMedian);
      }
      if (row.bmdlMedian !== undefined && row.bmdlMedian > 0 && !isNaN(row.bmdlMedian) && isFinite(row.bmdlMedian)) {
        bmdlMedians.push(row.bmdlMedian);
      }
      if (row.bmduMedian !== undefined && row.bmduMedian > 0 && !isNaN(row.bmduMedian) && isFinite(row.bmduMedian)) {
        bmduMedians.push(row.bmduMedian);
      }
    });

    return {
      bmdMedians,
      bmdlMedians,
      bmduMedians
    };
  }, [data]);

  if (!medianData || (
    medianData.bmdMedians.length === 0 &&
    medianData.bmdlMedians.length === 0 &&
    medianData.bmduMedians.length === 0
  )) {
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
        {/* BMD Median Histogram */}
        {medianData.bmdMedians.length > 0 && (
          <Col xs={24} lg={12}>
            <Plot
              data={[{
                x: medianData.bmdMedians,
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
                title: { text: 'BMD Median Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMD Median' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 400,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMDL Median Histogram */}
        {medianData.bmdlMedians.length > 0 && (
          <Col xs={24} lg={12}>
            <Plot
              data={[{
                x: medianData.bmdlMedians,
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
                title: { text: 'BMDL Median Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMDL Median' }, gridcolor: DEFAULT_GRID_COLOR },
                height: 400,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        )}

        {/* BMDU Median Histogram */}
        {medianData.bmduMedians.length > 0 && (
          <Col xs={24} lg={12}>
            <Plot
              data={[{
                x: medianData.bmduMedians,
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
                title: { text: 'BMDU Median Histogram', font: { size: 14 } },
                xaxis: { title: { text: 'BMDU Median' }, gridcolor: DEFAULT_GRID_COLOR },
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
          <li>Each histogram shows the distribution of category-level median values</li>
          <li>X-axis: Median value range, Y-axis: Number of categories in that range</li>
          <li>Default bins: 20 equal-width buckets</li>
          <li>Toggle "Log Y-Axis" for better visibility with wide-ranging counts</li>
          <li>Medians are more robust to outliers than means, showing the true center of each category's distribution</li>
        </ul>
      </div>
    </div>
  );
}
