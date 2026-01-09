/**
 * Bar Charts Component
 *
 * Displays horizontal bar charts showing BMD/BMDL/BMDU values for top 20 categories.
 * Each bar represents one category, colored by UMAP cluster assignment.
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 */

import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Row, Col } from 'antd';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function BarCharts() {
  const { data, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const clusterColors = useClusterColors();
  const hasSelection = categoryState.selectedIds.size > 0;

  // Get top 20 categories sorted by p-value
  const topCategories = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter(row => row.fishersExactTwoTailPValue != null)
      .sort((a, b) => {
        const pA = a.fishersExactTwoTailPValue ?? 1;
        const pB = b.fishersExactTwoTailPValue ?? 1;
        return pA - pB;
      })
      .slice(0, 20);
  }, [data]);

  // Define chart configs
  const chartConfigs = [
    { title: 'BMD Median', field: 'bmdMedian' as const },
    { title: 'BMDL Median', field: 'bmdlMedian' as const },
    { title: 'BMDU Median', field: 'bmduMedian' as const },
    { title: 'BMD Mean', field: 'bmdMean' as const },
    { title: 'BMDL Mean', field: 'bmdlMean' as const },
    { title: 'BMDU Mean', field: 'bmduMean' as const },
  ];

  // Group categories by cluster with inFocus state
  const clusterData = useMemo(() => {
    const byCluster = new Map<number, Array<{
      categoryId: string;
      categoryName: string;
      values: Record<string, number>;
      inFocus: boolean;
    }>>();

    topCategories.forEach(row => {
      const clusterId = getClusterIdForCategory(row.categoryId);
      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }

      byCluster.get(clusterId)!.push({
        categoryId: row.categoryId || '',
        categoryName: row.categoryDescription || row.categoryId || 'Unknown',
        values: {
          bmdMedian: row.bmdMedian ?? 0,
          bmdlMedian: row.bmdlMedian ?? 0,
          bmduMedian: row.bmduMedian ?? 0,
          bmdMean: row.bmdMean ?? 0,
          bmdlMean: row.bmdlMean ?? 0,
          bmduMean: row.bmduMean ?? 0,
        },
        inFocus: row.inFocus
      });
    });

    return byCluster;
  }, [topCategories]);

  // Create styled charts for each config
  const styledCharts = useMemo(() => {
    return chartConfigs.map(config => {
      const traces: any[] = [];

      // Sort clusters (outliers last)
      const sortedClusters = Array.from(clusterData.keys()).sort((a, b) => {
        if (a === -1) return 1;
        if (b === -1) return -1;
        return a - b;
      });

      sortedClusters.forEach(clusterId => {
        const items = clusterData.get(clusterId)!;
        const baseColor = clusterColors[clusterId] || '#999999';

        // Filter items based on displayMode (isolate mode hides out-of-focus)
        const visibleItems = items.filter(item => !shouldHidePoint(item.inFocus));

        if (visibleItems.length === 0) {
          return; // Skip empty cluster traces
        }

        // Per-bar styling arrays
        const barColors: string[] = [];
        const barOpacities: number[] = [];
        const barLineWidths: number[] = [];
        const barLineColors: string[] = [];

        visibleItems.forEach(item => {
          const isSelected = categoryState.selectedIds.has(item.categoryId);
          const style = getPointStyle(item.inFocus, baseColor);

          if (isSelected && hasSelection) {
            barColors.push(style.color);
            barOpacities.push(1.0);
            barLineWidths.push(2);
            barLineColors.push('white');
          } else {
            barColors.push(style.color);
            barOpacities.push(style.opacity);
            barLineWidths.push(style.lineWidth);
            barLineColors.push(style.lineColor);
          }
        });

        traces.push({
          type: 'bar',
          y: visibleItems.map(item => item.categoryName),
          x: visibleItems.map(item => item.values[config.field]),
          orientation: 'h',
          name: getClusterLabel(clusterId),
          marker: {
            color: barColors,
            opacity: barOpacities,
            line: {
              color: barLineColors,
              width: barLineWidths,
            },
          },
          hovertemplate: '<b>%{y}</b><br>' +
            `${getClusterLabel(clusterId)}<br>` +
            'Value: %{x:.4f}<extra></extra>',
          showlegend: false,
        });
      });

      return {
        title: config.title,
        data: traces,
      };
    });
  }, [chartConfigs, clusterData, clusterColors, categoryState.selectedIds, hasSelection, displayMode, getPointStyle, shouldHidePoint]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for Bar Charts
      </div>
    );
  }

  if (styledCharts.length === 0 || topCategories.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        Loading Bar Charts...
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <h4 style={{ marginBottom: '1rem' }}>BMD and BMDL Bar Charts (Top 20 Pathways)</h4>
      <Row gutter={[16, 16]}>
        {styledCharts.map((chart, index) => (
          <Col xs={24} lg={12} key={index}>
            <Plot
              data={chart.data}
              layout={{
                title: {
                  text: chart.title,
                  font: { size: 14 },
                },
                xaxis: {
                  title: { text: 'Value' },
                  type: 'log',
                  gridcolor: DEFAULT_GRID_COLOR,
                },
                yaxis: {
                  title: '',
                  autorange: 'reversed',
                  tickfont: { size: 9 },
                  gridcolor: DEFAULT_GRID_COLOR,
                },
                barmode: 'stack',
                height: 500,
                margin: { l: 200, r: 50, t: 50, b: 50 },
                showlegend: false,
                ...DEFAULT_LAYOUT_STYLES,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}
