import React, { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Row, Col } from 'antd';
import { useReactiveState } from 'Frontend/components/charts/hooks/useReactiveState';
import { useFocusAwareStyling } from 'Frontend/components/charts/hooks/useFocusAwareStyling';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function AccumulationCharts() {
  // Get ALL data with inFocus state using shared hook
  const { data: allData, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();

  // Get selection state using reactive infrastructure
  const categoryState = useReactiveState('categoryId');

  const [charts, setCharts] = useState<any[]>([]);

  // Debug logging
  useEffect(() => {
    console.log('[AccumulationCharts] categoryState changed:', {
      selectedCount: categoryState.selectedIds.size,
      source: categoryState.source,
      selectedIds: Array.from(categoryState.selectedIds).slice(0, 5)
    });
  }, [categoryState.selectedIds, categoryState.source]);

  // Get cluster colors using shared utility
  const clusterColors = useClusterColors();

  useEffect(() => {
    if (!allData || allData.length === 0) {
      console.log('[AccumulationCharts] No data available, clearing charts');
      setCharts([]);
      return;
    }

    const hasSelection = categoryState.selectedIds.size > 0;

    // Define the 6 charts with their data fields
    const chartConfigs = [
      {
        title: 'BMD Median Accumulation',
        field: 'bmdMedian',
      },
      {
        title: 'BMD Mean Accumulation',
        field: 'bmdMean',
      },
      {
        title: 'BMDL Median Accumulation',
        field: 'bmdlMedian',
      },
      {
        title: 'BMDL Mean Accumulation',
        field: 'bmdlMean',
      },
      {
        title: 'BMDU Median Accumulation',
        field: 'bmduMedian',
      },
      {
        title: 'BMDU Mean Accumulation',
        field: 'bmduMean',
      },
    ];

    const chartsData = chartConfigs.map(config => {
      // Get all values for cumulative calculation, including inFocus state
      const allValues = allData
        .map((row) => ({
          value: (row as any)[config.field],
          categoryId: row.categoryId,
          inFocus: row.inFocus
        }))
        .filter(item => item.value != null && item.value > 0)
        .sort((a, b) => a.value - b.value);

      if (allValues.length === 0) {
        return null;
      }

      // Calculate fixed x-axis range in log space
      const allX = allValues.map(item => item.value);
      const xMin = Math.min(...allX);
      const xMax = Math.max(...allX);
      const xAxisRange: [number, number] = [Math.log10(xMin), Math.log10(xMax)];

      // Group ALL categories by cluster with inFocus state
      const byCluster = new Map<string | number, Array<{x: number, y: number, categoryId: string, inFocus: boolean}>>();

      allValues.forEach((item, index) => {
        const clusterId = getClusterIdForCategory(item.categoryId);
        const cumulativePercent = ((index + 1) / allValues.length) * 100;

        if (!byCluster.has(clusterId)) {
          byCluster.set(clusterId, []);
        }
        byCluster.get(clusterId)!.push({
          x: item.value,
          y: cumulativePercent,
          categoryId: item.categoryId || '',
          inFocus: item.inFocus
        });
      });

      // Create traces with inFocus-based styling (per-point)
      const traces: any[] = [];
      const sortedClusters = Array.from(byCluster.keys()).sort((a, b) => {
        if (a === -1) return 1;
        if (b === -1) return -1;
        return Number(a) - Number(b);
      });

      sortedClusters.forEach((clusterId) => {
        const points = byCluster.get(clusterId)!;
        const baseColor = clusterColors[clusterId] || '#999999';

        // Filter points based on displayMode (isolate mode hides out-of-focus)
        const visiblePoints = points.filter(p => !shouldHidePoint(p.inFocus));

        if (visiblePoints.length === 0) {
          return; // Skip empty cluster traces
        }

        // Per-point styling arrays based on inFocus state
        const markerColors: string[] = [];
        const markerSizes: number[] = [];
        const markerOpacities: number[] = [];
        const markerLineWidths: number[] = [];
        const markerLineColors: string[] = [];

        visiblePoints.forEach(point => {
          const isSelected = categoryState.selectedIds.has(point.categoryId);
          const style = getPointStyle(point.inFocus, baseColor);

          // If selected, enhance with selection highlighting
          if (isSelected && hasSelection) {
            markerColors.push(style.color);
            markerSizes.push(12);
            markerOpacities.push(1.0);
            markerLineWidths.push(2);
            markerLineColors.push('white');
          } else {
            markerColors.push(style.color);
            markerSizes.push(style.size);
            markerOpacities.push(style.opacity);
            markerLineWidths.push(style.lineWidth);
            markerLineColors.push(style.lineColor);
          }
        });

        traces.push({
          type: 'scatter',
          mode: 'markers',
          x: visiblePoints.map(p => p.x),
          y: visiblePoints.map(p => p.y),
          customdata: visiblePoints.map(p => p.categoryId),
          marker: {
            color: markerColors,
            size: markerSizes,
            symbol: 'circle',
            opacity: markerOpacities,
            line: {
              color: markerLineColors,
              width: markerLineWidths
            }
          },
          name: getClusterLabel(clusterId),
          hovertemplate: `${getClusterLabel(clusterId)}<br>Value: %{x:.4f}<br>Cumulative %: %{y:.1f}%<extra></extra>`,
          showlegend: false,
        });
      });

      return {
        data: traces,
        layout: {
          title: {
            text: config.title,
            font: { size: 14 },
          },
          xaxis: {
            title: { text: 'BMD Value' },
            type: 'log',
            range: xAxisRange,
            gridcolor: DEFAULT_GRID_COLOR,
          },
          yaxis: {
            title: { text: 'Cumulative Percentage (%)' },
            range: [0, 100],
            gridcolor: DEFAULT_GRID_COLOR,
          },
          height: 400,
          margin: { l: 70, r: 50, t: 50, b: 50 },
          ...DEFAULT_LAYOUT_STYLES,
          showlegend: false,
        },
        config: createPlotlyConfig(),
      };
    }).filter(chart => chart !== null);

    setCharts(chartsData as any[]);
  }, [allData, clusterColors, categoryState.selectedIds, displayMode, getPointStyle, shouldHidePoint]);

  if (!allData || allData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        <p><strong>No data available for Accumulation Charts</strong></p>
        <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
          No categories pass the current filters.
        </p>
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        <p><strong>No valid BMD data available for Accumulation Charts</strong></p>
        <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
          The categories don't have valid BMD values to plot.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <h4 style={{ marginBottom: '1rem' }}>Accumulation Charts (Cumulative Distribution Functions)</h4>
      <Row gutter={[16, 16]}>
        {charts.map((chart, index) => (
          <Col xs={24} lg={12} key={index}>
            <Plot
              data={chart.data}
              layout={chart.layout}
              config={chart.config}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}
