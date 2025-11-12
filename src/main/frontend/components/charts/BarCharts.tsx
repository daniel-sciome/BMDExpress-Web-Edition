import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Row, Col } from 'antd';
import { useAppSelector } from '../../store/hooks';
import { selectChartData } from '../../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterLegendInteraction, getClusterMarkerStyle } from './hooks/useClusterLegendInteraction';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function BarCharts() {
  const data = useAppSelector(selectChartData);
  const categoryState = useReactiveState('categoryId');
  const clusterColors = useClusterColors();

  // Get top 20 categories sorted by p-value
  const topCategories = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter((row: CategoryAnalysisResultDto) => row.fishersExactTwoTailPValue != null)
      .sort((a: CategoryAnalysisResultDto, b: CategoryAnalysisResultDto) => {
        const pA = a.fishersExactTwoTailPValue ?? 1;
        const pB = b.fishersExactTwoTailPValue ?? 1;
        return pA - pB;
      })
      .slice(0, 20);
  }, [data]);

  // Group categories by cluster
  const clusterData = useMemo(() => {
    const byCluster = new Map<string | number, CategoryAnalysisResultDto[]>();

    topCategories.forEach((row: CategoryAnalysisResultDto) => {
      const clusterId = getClusterIdForCategory(row.categoryId);
      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push(row);
    });

    return byCluster;
  }, [topCategories]);

  // Define chart configs
  const chartConfigs = [
    { title: 'BMD Median', field: 'bmdMedian' as const },
    { title: 'BMDL Median', field: 'bmdlMedian' as const },
    { title: 'BMDU Median', field: 'bmduMedian' as const },
    { title: 'BMD Mean', field: 'bmdMean' as const },
    { title: 'BMDL Mean', field: 'bmdlMean' as const },
    { title: 'BMDU Mean', field: 'bmduMean' as const },
  ];

  // Create base traces for each chart (grouped by cluster)
  const charts = useMemo(() => {
    return chartConfigs.map(config => {
      const baseTraces: any[] = [];

      // Create a trace for each cluster
      clusterData.forEach((clusterRows, clusterId) => {
        const categories = clusterRows.map(row => row.categoryDescription || 'Unknown');
        const values = clusterRows.map(row => row[config.field] ?? 0);

        baseTraces.push({
          type: 'bar',
          y: categories,
          x: values,
          orientation: 'h',
          name: getClusterLabel(clusterId),
          marker: {}, // Will be filled with reactive styling
          hovertemplate: '<b>%{y}</b><br>' +
            `${getClusterLabel(clusterId)}<br>` +
            'Value: %{x:.4f}<extra></extra>',
          showlegend: true,
          legendgroup: `cluster_${clusterId}`,
          clusterId: clusterId,
          categoryIds: clusterRows.map(row => row.categoryId || ''),
        });
      });

      return {
        title: config.title,
        baseTraces: baseTraces,
      };
    });
  }, [chartConfigs, clusterData]);

  // Set up cluster legend interaction (use traces from first chart as representative)
  const { handleLegendClick, nonSelectedDisplayMode, hasSelection } = useClusterLegendInteraction({
    traces: charts[0]?.baseTraces || [],
    categoryState,
    allData: topCategories,
    getClusterIdFromCategory: (row) => getClusterIdForCategory(row.categoryId),
    getCategoryId: (row) => row.categoryId,
    sourceName: 'BarCharts',
  });

  // Apply reactive styling to all charts
  const styledCharts = useMemo(() => {
    return charts.map(chart => {
      const styledTraces = chart.baseTraces.map((trace) => {
        const clusterId = trace.clusterId;
        const baseColor = clusterColors[clusterId] || '#999999';

        // Check if ANY category from this cluster is selected
        const isClusterSelected = hasSelection &&
          trace.categoryIds.some((catId: string) => categoryState.isSelected(catId));

        // Get reactive marker styling
        const markerStyle = getClusterMarkerStyle(
          clusterId,
          baseColor,
          isClusterSelected,
          hasSelection,
          nonSelectedDisplayMode
        );

        return {
          ...trace,
          marker: {
            color: markerStyle.color,
            opacity: markerStyle.opacity,
            line: {
              color: markerStyle.lineColor,
              width: markerStyle.lineWidth || 0,
            },
          },
        };
      });

      return {
        title: chart.title,
        data: styledTraces,
      };
    });
  }, [charts, clusterColors, hasSelection, categoryState.selectedIds, nonSelectedDisplayMode]);

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
                showlegend: true,
                legend: {
                  x: 1.02,
                  xanchor: 'left',
                  y: 1,
                },
                ...DEFAULT_LAYOUT_STYLES,
              } as any}
              config={createPlotlyConfig() as any}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
              onLegendClick={handleLegendClick}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}
