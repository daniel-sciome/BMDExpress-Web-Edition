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
import { Row, Col, Space, Typography } from 'antd';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useBmdMetricTriple } from './hooks/useBmdMetric';
import { BmdStatSelector } from './BmdMetricSelector';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

const { Text } = Typography;

export default function BarCharts() {
  const { data, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const clusterColors = useClusterColors();
  const hasSelection = categoryState.selectedIds.size > 0;

  // BMD metric selection (all three bases share the same stat)
  const { stat, setStat, bmd, bmdl, bmdu } = useBmdMetricTriple('median');

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

  // Define chart configs based on selected stat
  const chartConfigs = useMemo(() => [
    { title: bmd.label, getValue: bmd.getValue },
    { title: bmdl.label, getValue: bmdl.getValue },
    { title: bmdu.label, getValue: bmdu.getValue },
  ], [bmd, bmdl, bmdu]);

  // Group categories by cluster with inFocus state
  const clusterData = useMemo(() => {
    const byCluster = new Map<number, Array<{
      categoryId: string;
      categoryName: string;
      bmdValue: number;
      bmdlValue: number;
      bmduValue: number;
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
        bmdValue: bmd.getValue(row) ?? 0,
        bmdlValue: bmdl.getValue(row) ?? 0,
        bmduValue: bmdu.getValue(row) ?? 0,
        inFocus: row.inFocus
      });
    });

    return byCluster;
  }, [topCategories, bmd, bmdl, bmdu]);

  // Create styled charts for each config (BMD, BMDL, BMDU)
  const styledCharts = useMemo(() => {
    const valueGetters = [
      { title: bmd.label, getVal: (item: any) => item.bmdValue },
      { title: bmdl.label, getVal: (item: any) => item.bmdlValue },
      { title: bmdu.label, getVal: (item: any) => item.bmduValue },
    ];

    return valueGetters.map(config => {
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
          const focusStyle = getPointStyle(item.inFocus, baseColor);

          // Styling priority: selection > focus
          if (isSelected && hasSelection) {
            // Selected: full opacity, white border
            barColors.push(focusStyle.color);
            barOpacities.push(1.0);
            barLineWidths.push(2);
            barLineColors.push('white');
          } else if (hasSelection) {
            // Not selected but something is: dim this bar
            barColors.push(focusStyle.color);
            barOpacities.push(0.2);
            barLineWidths.push(0);
            barLineColors.push('white');
          } else {
            // No selection at all: use focus-based styling
            barColors.push(focusStyle.color);
            barOpacities.push(focusStyle.opacity);
            barLineWidths.push(focusStyle.lineWidth);
            barLineColors.push(focusStyle.lineColor);
          }
        });

        traces.push({
          type: 'bar',
          y: visibleItems.map(item => item.categoryName),
          x: visibleItems.map(item => config.getVal(item)),
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
            `${config.title}: %{x:.4f}<extra></extra>`,
          showlegend: false,
        });
      });

      return {
        title: config.title,
        data: traces,
      };
    });
  }, [clusterData, clusterColors, categoryState.selectedIds, hasSelection, displayMode, getPointStyle, shouldHidePoint, bmd.label, bmdl.label, bmdu.label]);

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
      {/* Controls */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <h4 style={{ margin: 0 }}>BMD Bar Charts (Top 20 Pathways)</h4>
        <Space>
          <Text>BMD Statistic:</Text>
          <BmdStatSelector stat={stat} onStatChange={setStat} />
        </Space>
      </div>
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
