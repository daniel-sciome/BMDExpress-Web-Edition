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
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

type MetricType = 'median' | 'mean';

export default function BMDvsBMDLScatter() {
  const data = useSelector(selectFilteredData);
  const clusterColors = useClusterColors();
  const [useLogX, setUseLogX] = useState(true);
  const [useLogY, setUseLogY] = useState(true);
  const [metricType, setMetricType] = useState<MetricType>('median');

  // Extract scatter plot data grouped by cluster
  const scatterData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Group data by cluster
    const byCluster = new Map<number, Array<{
      x: number;
      y: number;
      categoryName: string;
    }>>();

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

        const clusterId = getClusterIdForCategory(row.categoryId);
        if (!byCluster.has(clusterId)) {
          byCluster.set(clusterId, []);
        }

        byCluster.get(clusterId)!.push({
          x: xValue,
          y: yValue,
          categoryName: row.categoryDescription || row.categoryId || 'Unknown'
        });
      }
    });

    return byCluster;
  }, [data, metricType]);

  if (!scatterData || scatterData.size === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid BMD vs BMDL data available for scatter plot
      </div>
    );
  }

  // Calculate axis ranges for log scale
  const getAllValues = (byCluster: Map<number, Array<{x: number, y: number, categoryName: string}>>, axis: 'x' | 'y'): number[] => {
    const values: number[] = [];
    byCluster.forEach(points => {
      points.forEach(point => values.push(point[axis]));
    });
    return values;
  };

  const getAxisConfig = (values: number[], useLog: boolean) => {
    if (values.length === 0) return { type: 'linear' as const };

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

  const allXValues = getAllValues(scatterData, 'x');
  const allYValues = getAllValues(scatterData, 'y');
  const xAxisConfig = getAxisConfig(allXValues, useLogX);
  const yAxisConfig = getAxisConfig(allYValues, useLogY);

  const metricLabel = metricType === 'median' ? 'Median' : 'Mean';

  // Create traces for each cluster
  const traces = useMemo(() => {
    const result: any[] = [];

    // Sort clusters (outliers last)
    const sortedClusters = Array.from(scatterData.keys()).sort((a, b) => {
      if (a === -1) return 1;
      if (b === -1) return -1;
      return a - b;
    });

    sortedClusters.forEach(clusterId => {
      const points = scatterData.get(clusterId)!;
      const color = clusterColors[clusterId] || '#999999';

      result.push({
        x: points.map(p => p.x),
        y: points.map(p => p.y),
        type: 'scatter',
        mode: 'markers',
        name: getClusterLabel(clusterId),
        marker: {
          size: 8,
          color: color,
          line: {
            color: '#ffffff',
            width: 1
          },
          opacity: 0.7
        },
        text: points.map(p => p.categoryName),
        hovertemplate:
          '<b>%{text}</b><br>' +
          `${getClusterLabel(clusterId)}<br>` +
          `BMD ${metricLabel}: %{x:.4f}<br>` +
          `BMDL ${metricLabel}: %{y:.4f}<br>` +
          '<extra></extra>',
      });
    });

    return result;
  }, [scatterData, clusterColors, metricLabel]);

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
        data={traces}
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
          showlegend: true,
          legend: {
            x: 1.02,
            xanchor: 'left',
            y: 1,
            yanchor: 'top',
          },
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
          <li>Colors indicate cluster assignments from UMAP semantic space analysis</li>
          <li>Click legend items to show/hide specific clusters</li>
        </ul>
      </div>
    </div>
  );
}
