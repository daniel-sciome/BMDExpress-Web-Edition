import React, { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useAppSelector } from '../../store/hooks';
import { selectChartData } from '../../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterLegendInteraction, getClusterMarkerStyle } from './hooks/useClusterLegendInteraction';
import { useClusterColors, getClusterIdForCategory, getClusterLabel } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function RangePlot() {
  const data = useAppSelector(selectChartData);
  const categoryState = useReactiveState('categoryId');

  // Get cluster colors using shared utility
  const clusterColors = useClusterColors();

  // Filter and sort top 20 categories
  const topCategories = useMemo(() => {
    if (!data || data.length === 0) return [];

    const validData = data.filter((row: CategoryAnalysisResultDto) =>
      row.bmdMedian != null &&
      row.bmdlMedian != null &&
      row.bmduMedian != null &&
      row.bmdMedian > 0 &&
      row.bmdlMedian > 0 &&
      row.bmduMedian > 0
    );

    return validData
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

  // Create base traces (without reactive styling)
  const baseTraces = useMemo(() => {
    const traces: any[] = [];

    clusterData.forEach((clusterRows, clusterId) => {
      const categories = clusterRows.map((row: CategoryAnalysisResultDto) =>
        row.categoryDescription || 'Unknown'
      );
      const bmdValues = clusterRows.map((row: CategoryAnalysisResultDto) => row.bmdMedian!);
      const bmdlValues = clusterRows.map((row: CategoryAnalysisResultDto) => row.bmdlMedian!);
      const bmduValues = clusterRows.map((row: CategoryAnalysisResultDto) => row.bmduMedian!);

      // Calculate error bar extents (distance from BMD to BMDL and BMDU)
      const errorMinus = bmdValues.map((bmd, i) => bmd - bmdlValues[i]);
      const errorPlus = bmduValues.map((bmdu, i) => bmdu - bmdValues[i]);

      traces.push({
        type: 'scatter',
        mode: 'markers',
        x: bmdValues,
        y: categories,
        error_x: {
          type: 'data',
          symmetric: false,
          array: errorPlus,
          arrayminus: errorMinus,
          thickness: 2,
          width: 4,
        },
        marker: {}, // Will be filled with reactive styling
        name: getClusterLabel(clusterId),
        hovertemplate:
          '<b>%{y}</b><br>' +
          `${getClusterLabel(clusterId)}<br>` +
          'BMD: %{x:.4f}<br>' +
          'BMDL: %{customdata[0]:.4f}<br>' +
          'BMDU: %{customdata[1]:.4f}<br>' +
          '<extra></extra>',
        customdata: clusterRows.map((row: CategoryAnalysisResultDto) => [
          row.bmdlMedian,
          row.bmduMedian,
        ]),
        showlegend: true,
        legendgroup: `cluster_${clusterId}`,
      });
    });

    return traces;
  }, [clusterData]);

  // Set up cluster legend interaction
  const { handleLegendClick, nonSelectedDisplayMode, hasSelection } = useClusterLegendInteraction({
    traces: baseTraces,
    categoryState,
    allData: topCategories,
    getClusterIdFromCategory: (row) => getClusterIdForCategory(row.categoryId),
    getCategoryId: (row) => row.categoryId,
    sourceName: 'RangePlot',
  });

  // Apply reactive styling to traces
  const plotData = useMemo(() => {
    const sortedClusters = Array.from(clusterData.keys()).sort((a, b) => {
      if (a === -1) return 1;
      if (b === -1) return -1;
      return Number(a) - Number(b);
    });

    return baseTraces.map((trace, index) => {
      const clusterId = sortedClusters[index];
      const clusterRows = clusterData.get(clusterId)!;
      const baseColor = clusterColors[clusterId] || '#999999';

      // Check if ANY category from this cluster is selected
      const isClusterSelected = hasSelection &&
        clusterRows.some(row => categoryState.isSelected(row.categoryId));

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
          size: 8,
          symbol: 'circle',
          opacity: markerStyle.opacity,
          line: {
            color: markerStyle.lineColor,
            width: markerStyle.lineWidth || 1,
          },
        },
        error_x: {
          ...trace.error_x,
          color: markerStyle.color,
        },
      };
    });
  }, [baseTraces, clusterData, clusterColors, hasSelection, categoryState.selectedIds, nonSelectedDisplayMode]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No data available for Range Plot
      </div>
    );
  }

  if (plotData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        No valid BMD/BMDL/BMDU data available
      </div>
    );
  }

  const layout: any = {
    title: {
      text: 'Range Plot: BMD with Confidence Intervals (Top 20 Pathways)',
      font: { size: 16 },
    },
    xaxis: {
      title: { text: 'BMD Value' },
      type: 'log',
      autorange: true,
      gridcolor: DEFAULT_GRID_COLOR,
    },
    yaxis: {
      title: { text: 'Pathway/Category' },
      autorange: 'reversed', // Most significant at top
      gridcolor: DEFAULT_GRID_COLOR,
      tickfont: { size: 10 },
    },
    height: Math.max(500, plotData[0]?.y?.length * 25 || 500),
    margin: { l: 300, r: 50, t: 80, b: 80 },
    hovermode: 'closest',
    ...DEFAULT_LAYOUT_STYLES,
    showlegend: true,
    legend: {
      x: 1.02,
      xanchor: 'left',
      y: 1,
    },
  };

  const config = createPlotlyConfig();

  return (
    <div style={{ width: '100%' }}>
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
        onLegendClick={handleLegendClick}
      />
    </div>
  );
}
