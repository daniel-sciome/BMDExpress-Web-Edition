import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { selectChartData, toggleCategorySelection, setSelectedCategoryIds } from '../../store/slices/categoryResultsSlice';
import { umapDataService } from 'Frontend/data/umapDataService';

export default function BMDvsPValueScatter() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector(selectChartData);
  const selectedCategoryIds = useSelector((state: RootState) => state.categoryResults.selectedCategoryIds);

  // Get cluster colors (same as other charts)
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

  // Prepare data for plotting
  const xData = data.map(row => row.bmdMean || 0);
  const yData = data.map(row => {
    const pValue = row.fishersExactTwoTailPValue;
    if (pValue === undefined || pValue === null || pValue === 0) return 0;
    return -Math.log10(pValue);
  });
  const textData = data.map(row => row.categoryDescription || row.categoryId || 'Unknown');
  const categoryIds = data.map(row => row.categoryId || '');

  const hasSelection = selectedCategoryIds.size > 0;

  // Calculate fixed axis ranges from all data
  const xRange = useMemo(() => {
    if (xData.length === 0) return undefined;
    const validX = xData.filter(x => x > 0);
    if (validX.length === 0) return undefined;
    const xMin = Math.min(...validX);
    const xMax = Math.max(...validX);
    return [Math.log10(xMin) - 0.5, Math.log10(xMax) + 0.5];
  }, [xData]);

  const yRange = useMemo(() => {
    if (yData.length === 0) return undefined;
    const validY = yData.filter(y => y > 0);
    if (validY.length === 0) return undefined;
    const yMin = Math.min(...validY);
    const yMax = Math.max(...validY);
    const padding = (yMax - yMin) * 0.1;
    return [Math.max(0, yMin - padding), yMax + padding];
  }, [yData]);

  // Separate selected and unselected indices
  const selectedIndices: number[] = [];
  const unselectedIndices: number[] = [];

  data.forEach((row, idx) => {
    if (selectedCategoryIds.has(row.categoryId || '')) {
      selectedIndices.push(idx);
    } else {
      unselectedIndices.push(idx);
    }
  });

  // Build traces
  const traces: any[] = [];

  // Layer 1: Unselected points (always shown, gray and small like UMAP)
  if (unselectedIndices.length > 0) {
    traces.push({
      x: unselectedIndices.map(i => xData[i]),
      y: unselectedIndices.map(i => yData[i]),
      text: unselectedIndices.map(i => textData[i]),
      customdata: unselectedIndices.map(i => categoryIds[i]),
      type: 'scatter',
      mode: 'markers',
      marker: {
        color: 'rgba(128, 128, 128, 0.3)',
        size: 4,
        line: {
          color: 'rgba(128, 128, 128, 0.5)',
          width: 0.5,
        },
      },
      hovertemplate: '<b>%{text}</b><br>BMD Mean: %{x:.4f}<br>-log10(p): %{y:.4f}<extra></extra>',
      name: 'Unselected',
      showlegend: false,
    });
  }

  // Layer 2: Selected points grouped by cluster (colored and normal size)
  if (hasSelection && selectedIndices.length > 0) {
    // Group selected indices by cluster
    const selectedByCluster = new Map<string | number, number[]>();

    selectedIndices.forEach(idx => {
      const row = data[idx];
      const umapItem = umapDataService.getByGoId(row.categoryId || '');
      const clusterId = umapItem?.cluster_id ?? -1;

      if (!selectedByCluster.has(clusterId)) {
        selectedByCluster.set(clusterId, []);
      }
      selectedByCluster.get(clusterId)!.push(idx);
    });

    // Create trace for each cluster with selected points
    selectedByCluster.forEach((indices, clusterId) => {
      const color = clusterColors[clusterId] || '#999999';

      traces.push({
        x: indices.map(i => xData[i]),
        y: indices.map(i => yData[i]),
        text: indices.map(i => textData[i]),
        customdata: indices.map(i => categoryIds[i]),
        type: 'scatter',
        mode: 'markers',
        marker: {
          color: color,
          size: 8,
          line: {
            color: 'white',
            width: 1,
          },
        },
        hovertemplate: `<b>%{text}</b><br>Cluster ${clusterId === -1 ? 'Outliers' : clusterId}<br>BMD Mean: %{x:.4f}<br>-log10(p): %{y:.4f}<extra></extra>`,
        name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
        showlegend: clusterId !== -1, // Hide outliers from legend
      });
    });
  } else {
    // No selection - show all points colored by cluster
    const byCluster = new Map<string | number, number[]>();

    data.forEach((row, idx) => {
      const umapItem = umapDataService.getByGoId(row.categoryId || '');
      const clusterId = umapItem?.cluster_id ?? -1;

      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push(idx);
    });

    byCluster.forEach((indices, clusterId) => {
      const color = clusterColors[clusterId] || '#999999';

      traces.push({
        x: indices.map(i => xData[i]),
        y: indices.map(i => yData[i]),
        text: indices.map(i => textData[i]),
        customdata: indices.map(i => categoryIds[i]),
        type: 'scatter',
        mode: 'markers',
        marker: {
          color: color,
          size: 8,
          line: {
            color: 'white',
            width: 1,
          },
        },
        hovertemplate: `<b>%{text}</b><br>Cluster ${clusterId === -1 ? 'Outliers' : clusterId}<br>BMD Mean: %{x:.4f}<br>-log10(p): %{y:.4f}<extra></extra>`,
        name: `Cluster ${clusterId === -1 ? 'Outliers' : clusterId}`,
        showlegend: clusterId !== -1,
      });
    });
  }

  const handlePlotClick = (event: any) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const categoryId = point.customdata;

      if (categoryId) {
        // Check if Ctrl/Cmd key is pressed for multi-select
        if (event.event?.ctrlKey || event.event?.metaKey) {
          dispatch(toggleCategorySelection(categoryId));
        } else {
          // Single select - replace selection
          dispatch(setSelectedCategoryIds([categoryId]));
        }
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Plot
        data={traces}
        layout={{
          title: 'BMD vs Fisher Exact P-Value (Colored by Cluster)',
          xaxis: {
            title: 'BMD Mean',
            type: 'log',
            range: xRange, // Fixed range based on all data
            gridcolor: '#e0e0e0',
          },
          yaxis: {
            title: '-log10(Fisher Exact P-Value)',
            range: yRange, // Fixed range based on all data
            gridcolor: '#e0e0e0',
          },
          hovermode: 'closest',
          plot_bgcolor: '#fafafa',
          paper_bgcolor: 'white',
          margin: { l: 60, r: 30, t: 50, b: 60 },
          showlegend: hasSelection, // Only show legend when there's a selection
          legend: {
            x: 1.02,
            y: 1,
            xanchor: 'left',
            yanchor: 'top',
          },
        } as any}
        config={{
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
          toImageButtonOptions: {
            format: 'png',
            filename: 'bmd_vs_pvalue_scatter',
            height: 1000,
            width: 1200,
            scale: 2,
          },
        }}
        onClick={handlePlotClick}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
