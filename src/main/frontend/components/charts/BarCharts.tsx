/**
 * Bar Charts Component
 *
 * Displays horizontal bar charts showing BMD/BMDL/BMDU values for top 20 categories.
 * Each bar represents one category, colored by UMAP cluster assignment.
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 */

import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { Checkbox, Row, Col, Select, Space, Typography } from 'antd';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useBmdMetricTriple } from './hooks/useBmdMetric';
import { BmdStatSelector } from './BmdMetricSelector';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { useChartAppearance } from './hooks/useChartAppearance';
import ExportDropdown from './ExportDropdown';
import { getTopNSourceData } from './utils/topNFilter';

const { Text } = Typography;

const TOP_N_OPTIONS = [10, 20, 50, 100, 200, 'All'] as const;

export default function BarCharts({ chartId }: { chartId?: string }) {
  const { data, displayMode, getPointStyle } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const clusterColors = useClusterColors();
  const hasSelection = categoryState.selectedIds.size > 0;
  const [useLogScale, setUseLogScale] = useState(true);
  const [topN, setTopN] = useState<number | 'All'>(20);
  const resolvedId = chartId ?? 'bar-charts';
  const { plotRef } = useChartAppearance(resolvedId);
  const bmdApp = useChartAppearance(undefined, { parentId: resolvedId, key: 'bmd' });
  const bmdlApp = useChartAppearance(undefined, { parentId: resolvedId, key: 'bmdl' });
  const bmduApp = useChartAppearance(undefined, { parentId: resolvedId, key: 'bmdu' });
  const subplotApps = [bmdApp, bmdlApp, bmduApp];

  // BMD metric selection (all three bases share the same stat)
  const { stat, setStat, bmd, bmdl, bmdu } = useBmdMetricTriple('median');

  // Get top N categories sorted by BMD value (smallest first)
  // In isolate mode, Top N is computed from focused items only
  const topCategories = useMemo(() => {
    if (!data || data.length === 0) return [];

    // In isolate mode, compute Top N from focused items only
    const sourceData = getTopNSourceData(data, displayMode);

    const validData = sourceData.filter(row => {
      const bmdVal = bmd.getValue(row);
      return bmdVal != null && bmdVal > 0;
    });

    // Sort by BMD value ascending (smallest = most sensitive pathways first)
    const sorted = [...validData].sort((a, b) => {
      const bmdA = bmd.getValue(a) ?? Infinity;
      const bmdB = bmd.getValue(b) ?? Infinity;
      return bmdA - bmdB;
    });

    return topN === 'All' ? sorted : sorted.slice(0, topN);
  }, [data, displayMode, topN, bmd]);

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

        if (items.length === 0) {
          return; // Skip empty cluster traces
        }

        // Per-bar styling arrays
        const barColors: string[] = [];
        const barOpacities: number[] = [];
        const barLineWidths: number[] = [];
        const barLineColors: string[] = [];

        items.forEach(item => {
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
          y: items.map(item => item.categoryName),
          x: items.map(item => config.getVal(item)),
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
  }, [clusterData, clusterColors, categoryState.selectedIds, hasSelection, displayMode, getPointStyle, bmd.label, bmdl.label, bmdu.label]);

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
        <h4 style={{ margin: 0 }}>
          BMD Bar Charts ({topN === 'All' ? 'All Pathways' : `Top ${topN} Pathways`})
        </h4>
        <Space>
          <Text>BMD Statistic:</Text>
          <BmdStatSelector stat={stat} onStatChange={setStat} />
        </Space>
        <Checkbox checked={useLogScale} onChange={(e) => setUseLogScale(e.target.checked)}>
          Log₁₀ Scale
        </Checkbox>
        <Space>
          <Text>Show:</Text>
          <Select
            value={topN}
            onChange={setTopN}
            style={{ width: 100 }}
            size="small"
            options={TOP_N_OPTIONS.map(opt => ({
              value: opt,
              label: opt === 'All' ? 'All' : `Top ${opt}`,
            }))}
          />
        </Space>
        <ExportDropdown plotRef={plotRef} filename="bmd_bar_charts" />
      </div>
      <div ref={plotRef}>
        <Row gutter={[16, 16]}>
          {styledCharts.map((chart, index) => (
            <Col xs={24} lg={12} key={index}>
              <div style={{ width: '100%', aspectRatio: '2/1' }}>
                <Plot
                  data={chart.data}
                  layout={subplotApps[index].applyToLayout({
                    title: {
                      text: chart.title,
                      font: { size: 14 },
                    },
                    xaxis: {
                      title: { text: 'Value' },
                      type: useLogScale ? 'log' : 'linear',
                    },
                    yaxis: {
                      title: '',
                      autorange: 'reversed',
                      tickfont: { size: 9 },
                    },
                    barmode: 'stack',
                    height: 500,
                    margin: { l: 200, r: 50, t: 50, b: 50 },
                    showlegend: false,
                  }) as any}
                  config={subplotApps[index].getConfig('bmd_bar_charts')}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                />
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
