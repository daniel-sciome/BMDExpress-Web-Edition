import React from 'react';
import Plot from 'react-plotly.js';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { selectChartData, toggleCategorySelection, setSelectedCategoryIds } from '../../store/slices/categoryResultsSlice';

export default function BMDvsPValueScatter() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector(selectChartData);
  const selectedCategoryIds = useSelector((state: RootState) => state.categoryResults.selectedCategoryIds);

  // Prepare data for plotting
  const xData = data.map(row => row.bmdMean || 0);
  const yData = data.map(row => {
    const pValue = row.fishersExactTwoTailPValue;
    if (pValue === undefined || pValue === null || pValue === 0) return 0;
    return -Math.log10(pValue);
  });
  const textData = data.map(row => row.categoryDescription || row.categoryId || 'Unknown');
  const categoryIds = data.map(row => row.categoryId || '');

  // Separate selected and unselected points for different styling
  const hasSelection = selectedCategoryIds.size > 0;

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

  if (hasSelection) {
    // Unselected points (dimmed)
    if (unselectedIndices.length > 0) {
      traces.push({
        x: unselectedIndices.map(i => xData[i]),
        y: unselectedIndices.map(i => yData[i]),
        text: unselectedIndices.map(i => textData[i]),
        customdata: unselectedIndices.map(i => categoryIds[i]),
        type: 'scatter',
        mode: 'markers',
        marker: {
          color: 'rgba(100, 100, 100, 0.3)',
          size: 8,
          line: {
            color: 'rgba(100, 100, 100, 0.5)',
            width: 1,
          },
        },
        hovertemplate: '<b>%{text}</b><br>BMD Mean: %{x:.4f}<br>-log10(p): %{y:.4f}<extra></extra>',
        name: 'Unselected',
        showlegend: true,
      });
    }

    // Selected points (highlighted)
    if (selectedIndices.length > 0) {
      traces.push({
        x: selectedIndices.map(i => xData[i]),
        y: selectedIndices.map(i => yData[i]),
        text: selectedIndices.map(i => textData[i]),
        customdata: selectedIndices.map(i => categoryIds[i]),
        type: 'scatter',
        mode: 'markers',
        marker: {
          color: '#1890ff',
          size: 12,
          line: {
            color: '#0050b3',
            width: 2,
          },
        },
        hovertemplate: '<b>%{text}</b><br>BMD Mean: %{x:.4f}<br>-log10(p): %{y:.4f}<extra></extra>',
        name: 'Selected',
        showlegend: true,
      });
    }
  } else {
    // No selection - all points same style
    traces.push({
      x: xData,
      y: yData,
      text: textData,
      customdata: categoryIds,
      type: 'scatter',
      mode: 'markers',
      marker: {
        color: '#1890ff',
        size: 8,
        line: {
          color: '#0050b3',
          width: 1,
        },
      },
      hovertemplate: '<b>%{text}</b><br>BMD Mean: %{x:.4f}<br>-log10(p): %{y:.4f}<extra></extra>',
      showlegend: false,
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
          title: 'BMD vs Fisher Exact P-Value',
          xaxis: {
            title: 'BMD Mean',
            gridcolor: '#e0e0e0',
          },
          yaxis: {
            title: '-log10(Fisher Exact P-Value)',
            gridcolor: '#e0e0e0',
          },
          hovermode: 'closest',
          plot_bgcolor: '#fafafa',
          paper_bgcolor: 'white',
          margin: { l: 60, r: 30, t: 50, b: 60 },
          showlegend: hasSelection,
          legend: {
            x: 1,
            y: 1,
            xanchor: 'right',
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
