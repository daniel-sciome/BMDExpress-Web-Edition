import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import { Button } from 'antd';
import { selectChartData } from '../../store/slices/categoryResultsSlice';
import { umapDataService } from 'Frontend/data/umapDataService';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import type { RootState } from '../../store/store';

export default function BMDBoxPlot() {
  const data = useSelector(selectChartData);
  const selectedCategoryIds = useSelector((state: RootState) => state.categoryResults.selectedCategoryIds);
  const [useFixedScale, setUseFixedScale] = useState(true);

  // Get cluster colors (same as UMAP, AccumulationCharts, and RangePlot)
  const clusterColors = useMemo(() => {
    const clusters = umapDataService.getAllClusterIds();
    const colors: Record<string | number, string> = {};

    const palette = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
      '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5',
      '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173',
      '#5254a3', '#8ca252', '#bd9e39', '#ad494a', '#a55194',
      '#6b6ecf', '#b5cf6b', '#e7ba52', '#d6616b', '#ce6dbd',
      '#9c9ede', '#cedb9c', '#e7cb94', '#e7969c', '#de9ed6'
    ];

    clusters.forEach((clusterId, index) => {
      if (clusterId === -1) {
        colors[clusterId] = '#999999';
      } else {
        colors[clusterId] = palette[index % palette.length];
      }
    });

    return colors;
  }, []);

  // Extract BMD values (filter out null/undefined) and track category IDs
  const getBMDValuesWithCategories = (dataset: CategoryAnalysisResultDto[]) => ({
    bmd: dataset.map(row => ({ value: row.bmdMean, categoryId: row.categoryId })).filter(item => item.value !== undefined && item.value !== null && !isNaN(item.value)),
    bmdl: dataset.map(row => ({ value: row.bmdlMean, categoryId: row.categoryId })).filter(item => item.value !== undefined && item.value !== null && !isNaN(item.value)),
    bmdu: dataset.map(row => ({ value: row.bmduMean, categoryId: row.categoryId })).filter(item => item.value !== undefined && item.value !== null && !isNaN(item.value)),
  });

  const allValuesWithCategories = getBMDValuesWithCategories(data);

  // Extract just the values for box plots
  const allValues = {
    bmd: allValuesWithCategories.bmd.map(item => item.value!),
    bmdl: allValuesWithCategories.bmdl.map(item => item.value!),
    bmdu: allValuesWithCategories.bmdu.map(item => item.value!),
  };

  // Filter for selected categories only (for rescaling)
  const hasSelection = selectedCategoryIds.size > 0;
  const selectedValuesWithCategories = useMemo(() => {
    if (!hasSelection) return allValuesWithCategories;

    return {
      bmd: allValuesWithCategories.bmd.filter(item => selectedCategoryIds.has(item.categoryId || '')),
      bmdl: allValuesWithCategories.bmdl.filter(item => selectedCategoryIds.has(item.categoryId || '')),
      bmdu: allValuesWithCategories.bmdu.filter(item => selectedCategoryIds.has(item.categoryId || '')),
    };
  }, [allValuesWithCategories, selectedCategoryIds, hasSelection]);

  const selectedValues = {
    bmd: selectedValuesWithCategories.bmd.map(item => item.value!),
    bmdl: selectedValuesWithCategories.bmdl.map(item => item.value!),
    bmdu: selectedValuesWithCategories.bmdu.map(item => item.value!),
  };

  // Build traces
  const traces: any[] = [];

  // Create black box plots (no individual points shown by box)
  if (allValues.bmd.length > 0) {
    traces.push({
      x: Array(allValues.bmd.length).fill(0),
      y: allValues.bmd,
      type: 'box',
      name: 'BMD Mean',
      marker: { color: 'black' },
      line: { color: 'black' },
      fillcolor: 'rgba(0, 0, 0, 0.1)',
      boxpoints: false, // Don't show points on box itself
      boxmean: 'sd',
      showlegend: true,
      legendgroup: 'bmd',
      legendgrouptitle: { text: 'Categories' },
    });
  }
  if (allValues.bmdl.length > 0) {
    traces.push({
      x: Array(allValues.bmdl.length).fill(1),
      y: allValues.bmdl,
      type: 'box',
      name: 'BMDL Mean',
      marker: { color: 'black' },
      line: { color: 'black' },
      fillcolor: 'rgba(0, 0, 0, 0.1)',
      boxpoints: false,
      boxmean: 'sd',
      showlegend: true,
      legendgroup: 'bmdl',
    });
  }
  if (allValues.bmdu.length > 0) {
    traces.push({
      x: Array(allValues.bmdu.length).fill(2),
      y: allValues.bmdu,
      type: 'box',
      name: 'BMDU Mean',
      marker: { color: 'black' },
      line: { color: 'black' },
      fillcolor: 'rgba(0, 0, 0, 0.1)',
      boxpoints: false,
      boxmean: 'sd',
      showlegend: true,
      legendgroup: 'bmdu',
    });
  }

  // Add cluster-colored scatter points on top with manual horizontal jitter
  type DataPoint = { value: number; categoryId: string | undefined; x: number };

  const addClusterPoints = (items: { value: number | undefined; categoryId: string | undefined }[], xPosition: number, categoryName: string) => {
    // Group by cluster
    const byCluster = new Map<string | number, DataPoint[]>();

    items.forEach(item => {
      if (item.value === undefined) return;

      const umapItem = umapDataService.getByGoId(item.categoryId || '');
      const clusterId = umapItem?.cluster_id ?? -1;

      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push({
        value: item.value,
        categoryId: item.categoryId,
        x: xPosition
      });
    });

    // Create scatter trace for each cluster with manual jitter
    byCluster.forEach((points, clusterId) => {
      const color = clusterColors[clusterId] || '#999999';

      // Add random jitter to x positions (±0.15 around the box position)
      const jitteredX = points.map(() => xPosition + (Math.random() - 0.5) * 0.3);

      traces.push({
        x: jitteredX,
        y: points.map(p => p.value),
        type: 'scatter',
        mode: 'markers',
        marker: {
          color: color,
          size: 6,
          symbol: 'circle',
          line: {
            color: 'white',
            width: 1
          }
        },
        name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
        hovertemplate: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}<br>Value: %{y:.4f}<extra></extra>`,
        showlegend: false, // Hide from legend but link to category
        legendgroup: categoryName, // Link to category box plot
      });
    });
  };

  // Add scatter points for each box plot category
  addClusterPoints(allValuesWithCategories.bmd, 0, 'bmd'); // BMD at x=0
  addClusterPoints(allValuesWithCategories.bmdl, 1, 'bmdl'); // BMDL at x=1
  addClusterPoints(allValuesWithCategories.bmdu, 2, 'bmdu'); // BMDU at x=2

  // Add cluster color legend (display only, non-interactive)
  // Get all unique cluster IDs from the data
  const clustersInData = new Set<string | number>();
  allValuesWithCategories.bmd.forEach(item => {
    const umapItem = umapDataService.getByGoId(item.categoryId || '');
    const clusterId = umapItem?.cluster_id ?? -1;
    clustersInData.add(clusterId);
  });
  allValuesWithCategories.bmdl.forEach(item => {
    const umapItem = umapDataService.getByGoId(item.categoryId || '');
    const clusterId = umapItem?.cluster_id ?? -1;
    clustersInData.add(clusterId);
  });
  allValuesWithCategories.bmdu.forEach(item => {
    const umapItem = umapDataService.getByGoId(item.categoryId || '');
    const clusterId = umapItem?.cluster_id ?? -1;
    clustersInData.add(clusterId);
  });

  // Sort cluster IDs (outliers last)
  const sortedClusters = Array.from(clustersInData).sort((a, b) => {
    if (a === -1) return 1;
    if (b === -1) return -1;
    return Number(a) - Number(b);
  });

  // Add dummy traces for cluster legend (visible in legend only)
  sortedClusters.forEach((clusterId, index) => {
    const color = clusterColors[clusterId] || '#999999';
    const isFirst = index === 0;

    traces.push({
      x: [null],
      y: [null],
      type: 'scatter',
      mode: 'markers',
      marker: {
        color: color,
        size: 8,
        symbol: 'circle',
      },
      name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
      showlegend: true,
      legendgroup: 'clusters',
      legendgrouptitle: isFirst ? { text: 'Cluster Colors' } : undefined,
    });
  });

  // Calculate y-axis range - use selected data when available, otherwise all data
  const yAxisRange = useMemo(() => {
    const dataToUse = hasSelection ? selectedValues : allValues;
    const allBMDValues = [...dataToUse.bmd, ...dataToUse.bmdl, ...dataToUse.bmdu];
    if (allBMDValues.length === 0) return undefined;
    const yMin = Math.min(...allBMDValues);
    const yMax = Math.max(...allBMDValues);
    const padding = (yMax - yMin) * 0.1;
    return [Math.max(0, yMin - padding), yMax + padding];
  }, [allValues, selectedValues, hasSelection]);

  // Calculate statistics for subtitle
  const getStats = (values: number[]) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return { median, mean, count: values.length };
  };

  const bmdStats = getStats(allValues.bmd);
  const subtitle = bmdStats
    ? `BMD Statistics: Median=${bmdStats.median.toFixed(3)}, Mean=${bmdStats.mean.toFixed(3)}, N=${bmdStats.count}`
    : '';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '8px' }}>
        <Button
          size="small"
          onClick={() => setUseFixedScale(!useFixedScale)}
        >
          {useFixedScale ? 'Auto Scale' : 'Fixed Scale'}
        </Button>
      </div>
      <div style={{ width: '100%', height: '500px' }}>
        <Plot
        data={traces}
        layout={{
          title: `BMD Distribution (Colored by Cluster)<br><sub>${subtitle}</sub>`,
          yaxis: {
            title: 'Dose Value',
            gridcolor: '#e0e0e0',
            ...(useFixedScale && yAxisRange ? { range: yAxisRange } : { autorange: true }),
          },
          xaxis: {
            title: '',
            tickmode: 'array',
            tickvals: [0, 1, 2],
            ticktext: ['BMD Mean', 'BMDL Mean', 'BMDU Mean'],
          },
          plot_bgcolor: '#fafafa',
          paper_bgcolor: 'white',
          margin: { l: 60, r: 30, t: 80, b: 60 },
          showlegend: true,
          legend: {
            x: 1.02,
            y: 1,
            xanchor: 'left',
            yanchor: 'top',
          },
          boxmode: 'overlay', // Allow scatter points to overlay boxes
        } as any}
        config={{
          displayModeBar: true,
          displaylogo: false,
          toImageButtonOptions: {
            format: 'png',
            filename: 'bmd_box_plot',
            height: 1000,
            width: 1200,
            scale: 2,
          },
        }}
        style={{ width: '100%', height: '100%' }}
      />
      </div>
    </div>
  );
}
