import React from 'react';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { selectChartData } from '../../store/slices/categoryResultsSlice';

export default function BMDBoxPlot() {
  const data = useSelector(selectChartData);
  const selectedCategoryIds = useSelector((state: RootState) => state.categoryResults.selectedCategoryIds);

  const hasSelection = selectedCategoryIds.size > 0;

  // Filter data into selected and unselected
  const selectedData = data.filter(row => selectedCategoryIds.has(row.categoryId || ''));
  const unselectedData = data.filter(row => !selectedCategoryIds.has(row.categoryId || ''));

  // Extract BMD values (filter out null/undefined)
  const getBMDValues = (dataset: typeof data) => ({
    bmd: dataset.map(row => row.bmdMean).filter((val): val is number => val !== undefined && val !== null && !isNaN(val)),
    bmdl: dataset.map(row => row.bmdlMean).filter((val): val is number => val !== undefined && val !== null && !isNaN(val)),
    bmdu: dataset.map(row => row.bmduMean).filter((val): val is number => val !== undefined && val !== null && !isNaN(val)),
  });

  const allValues = getBMDValues(data);
  const selectedValues = getBMDValues(selectedData);
  const unselectedValues = getBMDValues(unselectedData);

  // Build traces
  const traces: any[] = [];

  if (hasSelection) {
    // Selected data box plots
    if (selectedValues.bmd.length > 0) {
      traces.push({
        y: selectedValues.bmd,
        type: 'box',
        name: 'BMD (Selected)',
        marker: { color: '#1890ff' },
        boxmean: 'sd',
      });
    }
    if (selectedValues.bmdl.length > 0) {
      traces.push({
        y: selectedValues.bmdl,
        type: 'box',
        name: 'BMDL (Selected)',
        marker: { color: '#52c41a' },
        boxmean: 'sd',
      });
    }
    if (selectedValues.bmdu.length > 0) {
      traces.push({
        y: selectedValues.bmdu,
        type: 'box',
        name: 'BMDU (Selected)',
        marker: { color: '#fa8c16' },
        boxmean: 'sd',
      });
    }

    // Unselected data box plots (dimmed)
    if (unselectedValues.bmd.length > 0) {
      traces.push({
        y: unselectedValues.bmd,
        type: 'box',
        name: 'BMD (Unselected)',
        marker: { color: 'rgba(24, 144, 255, 0.3)' },
        boxmean: 'sd',
      });
    }
    if (unselectedValues.bmdl.length > 0) {
      traces.push({
        y: unselectedValues.bmdl,
        type: 'box',
        name: 'BMDL (Unselected)',
        marker: { color: 'rgba(82, 196, 26, 0.3)' },
        boxmean: 'sd',
      });
    }
    if (unselectedValues.bmdu.length > 0) {
      traces.push({
        y: unselectedValues.bmdu,
        type: 'box',
        name: 'BMDU (Unselected)',
        marker: { color: 'rgba(250, 140, 22, 0.3)' },
        boxmean: 'sd',
      });
    }
  } else {
    // No selection - show all data
    if (allValues.bmd.length > 0) {
      traces.push({
        y: allValues.bmd,
        type: 'box',
        name: 'BMD Mean',
        marker: { color: '#1890ff' },
        boxmean: 'sd',
      });
    }
    if (allValues.bmdl.length > 0) {
      traces.push({
        y: allValues.bmdl,
        type: 'box',
        name: 'BMDL Mean',
        marker: { color: '#52c41a' },
        boxmean: 'sd',
      });
    }
    if (allValues.bmdu.length > 0) {
      traces.push({
        y: allValues.bmdu,
        type: 'box',
        name: 'BMDU Mean',
        marker: { color: '#fa8c16' },
        boxmean: 'sd',
      });
    }
  }

  // Calculate statistics for subtitle
  const getStats = (values: number[]) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return { median, mean, count: values.length };
  };

  const bmdStats = getStats(hasSelection ? selectedValues.bmd : allValues.bmd);
  const subtitle = bmdStats
    ? `BMD Statistics: Median=${bmdStats.median.toFixed(3)}, Mean=${bmdStats.mean.toFixed(3)}, N=${bmdStats.count}`
    : '';

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Plot
        data={traces}
        layout={{
          title: hasSelection
            ? `BMD Distribution (Selected vs Unselected)<br><sub>${subtitle}</sub>`
            : `BMD Distribution<br><sub>${subtitle}</sub>`,
          yaxis: {
            title: 'Dose Value',
            gridcolor: '#e0e0e0',
          },
          xaxis: {
            title: '',
          },
          plot_bgcolor: '#fafafa',
          paper_bgcolor: 'white',
          margin: { l: 60, r: 30, t: 80, b: 60 },
          showlegend: true,
          legend: {
            x: 1,
            y: 1,
            xanchor: 'right',
            yanchor: 'top',
          },
          boxmode: 'group',
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
  );
}
