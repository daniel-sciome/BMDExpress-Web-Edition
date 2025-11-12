/**
 * BMD vs BMDL Scatter Plot Component
 *
 * Displays a scatter plot comparing BMD (Benchmark Dose) vs BMDL (Lower Confidence Limit)
 * values at the category level. Each point represents one category's aggregated statistics.
 *
 * This visualization helps identify:
 * - Correlation between BMD and BMDL values
 * - Categories with large uncertainty (wide BMD-BMDL intervals)
 * - Overall distribution patterns of dose-response estimates
 *
 * CATEGORY-LEVEL: Each point = one category's median/mean values
 */

import React, { useMemo, useState } from 'react';
import { Checkbox, Radio, Space } from 'antd';
import { useSelector } from 'react-redux';
import Plot from 'react-plotly.js';
import { selectFilteredData } from '../../store/slices/categoryResultsSlice';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

type MetricType = 'median' | 'mean';

export default function BMDvsBMDLScatter() {
  const data = useSelector(selectFilteredData);
  const [useLogX, setUseLogX] = useState(true);
  const [useLogY, setUseLogY] = useState(true);
  const [metricType, setMetricType] = useState<MetricType>('median');

  // Extract scatter plot data from filtered categories
  const scatterData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const xValues: number[] = [];
    const yValues: number[] = [];
    const categoryNames: string[] = [];

    data.forEach(row => {
      // Get X (BMD) and Y (BMDL) values based on metric type
      let xValue: number | undefined;
      let yValue: number | undefined;

      if (metricType === 'median') {
        xValue = row.bmdMedian;
        yValue = row.bmdlMedian;
      } else {
        xValue = row.bmdMean;
        yValue = row.bmdlMean;
      }

      // Only include valid positive values
      if (xValue !== undefined && yValue !== undefined &&
          xValue > 0 && yValue > 0 &&
          !isNaN(xValue) && !isNaN(yValue) &&
          isFinite(xValue) && isFinite(yValue)) {
        xValues.push(xValue);
        yValues.push(yValue);
        categoryNames.push(row.categoryDescription || row.categoryId || 'Unknown');
      }
    });

    return {
      xValues,
      yValues,
      categoryNames
    };
  }, [data, metricType]);

  if (!scatterData || scatterData.xValues.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid BMD vs BMDL data available for scatter plot
      </div>
    );
  }

  // Calculate axis ranges for log scale
  const getAxisConfig = (values: number[], useLog: boolean) => {
    if (useLog) {
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const minDecade = Math.floor(Math.log10(minVal));
      const maxDecade = Math.ceil(Math.log10(maxVal));
      return {
        type: 'log' as const,
        range: [minDecade - 0.5, maxDecade + 0.5]
      };
    }
    return {
      type: 'linear' as const
    };
  };

  const xAxisConfig = getAxisConfig(scatterData.xValues, useLogX);
  const yAxisConfig = getAxisConfig(scatterData.yValues, useLogY);

  const metricLabel = metricType === 'median' ? 'Median' : 'Mean';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Space>
          <span style={{ fontWeight: 500 }}>Metric:</span>
          <Radio.Group value={metricType} onChange={(e) => setMetricType(e.target.value)}>
            <Radio.Button value="median">Median</Radio.Button>
            <Radio.Button value="mean">Mean</Radio.Button>
          </Radio.Group>
        </Space>

        <Space>
          <Checkbox checked={useLogX} onChange={(e) => setUseLogX(e.target.checked)}>
            Log X-Axis
          </Checkbox>
          <Checkbox checked={useLogY} onChange={(e) => setUseLogY(e.target.checked)}>
            Log Y-Axis
          </Checkbox>
        </Space>
      </div>

      <Plot
        data={[{
          x: scatterData.xValues,
          y: scatterData.yValues,
          type: 'scatter',
          mode: 'markers',
          marker: {
            size: 8,
            color: '#1f77b4',
            line: {
              color: '#ffffff',
              width: 1
            },
            opacity: 0.7
          },
          text: scatterData.categoryNames,
          hovertemplate:
            '<b>%{text}</b><br>' +
            `BMD ${metricLabel}: %{x:.4f}<br>` +
            `BMDL ${metricLabel}: %{y:.4f}<br>` +
            '<extra></extra>',
        }]}
        layout={{
          ...DEFAULT_LAYOUT_STYLES,
          title: {
            text: `BMD vs BMDL Scatter Plot (${metricLabel})`,
            font: { size: 14 }
          },
          xaxis: {
            title: { text: `BMD ${metricLabel}` },
            type: xAxisConfig.type,
            range: xAxisConfig.range,
            gridcolor: DEFAULT_GRID_COLOR,
            showgrid: true,
          },
          yaxis: {
            title: { text: `BMDL ${metricLabel}` },
            type: yAxisConfig.type,
            range: yAxisConfig.range,
            gridcolor: DEFAULT_GRID_COLOR,
            showgrid: true,
          },
          height: 600,
          margin: { l: 80, r: 50, t: 80, b: 80 },
          hovermode: 'closest',
        } as any}
        config={createPlotlyConfig() as any}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />

      <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
        <p><strong>About this scatter plot:</strong></p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Each point represents one category's BMD vs BMDL values</li>
          <li>X-axis: BMD (Benchmark Dose) - the estimated dose at the benchmark response</li>
          <li>Y-axis: BMDL (Lower Confidence Limit) - the statistical lower bound of the BMD estimate</li>
          <li>Points closer to the diagonal indicate tighter confidence intervals (more precise estimates)</li>
          <li>Points farther from the diagonal indicate wider confidence intervals (more uncertain estimates)</li>
          <li>Log scales are typically used since BMD values often span multiple orders of magnitude</li>
        </ul>
      </div>
    </div>
  );
}
