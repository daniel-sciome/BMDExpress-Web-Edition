/**
 * Violin Plot Per Category Component
 *
 * Displays BMD distribution for each individual category as a violin plot.
 * Each category shows the distribution of BMD values from its gene list.
 * Categories are colored by their UMAP cluster assignment.
 *
 * LOCATION: Used in CategoryResultsView as one of the visualization options.
 *
 * NAVIGATION PATH: Sidebar → Analysis Result → Charts → Violin Plot Per Category
 */

import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import { selectChartData } from '../../store/slices/categoryResultsSlice';
import { umapDataService } from 'Frontend/data/umapDataService';
import { Alert, Select } from 'antd';

const { Option } = Select;

export default function ViolinPlotPerCategory() {
  const data = useSelector(selectChartData);
  const [selectedMetric, setSelectedMetric] = useState<'bmd' | 'bmdl' | 'bmdu'>('bmd');
  const [hiddenClusters, setHiddenClusters] = useState<Set<string | number>>(new Set());

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

  // Toggle cluster visibility
  const toggleCluster = (clusterId: string | number) => {
    setHiddenClusters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clusterId)) {
        newSet.delete(clusterId);
      } else {
        newSet.add(clusterId);
      }
      return newSet;
    });
  };

  // Parse BMD list and prepare violin plot data
  const { violinData, yAxisRange } = useMemo(() => {
    const traces: any[] = [];
    let globalMin = Infinity;
    let globalMax = -Infinity;

    // First pass: calculate min/max from ENTIRE dataset for consistent axis range
    data.forEach((row) => {
      let bmdListStr: string | undefined;
      switch (selectedMetric) {
        case 'bmd':
          bmdListStr = row.bmdList;
          break;
        case 'bmdl':
          bmdListStr = row.bmdlList;
          break;
        case 'bmdu':
          bmdListStr = row.bmduList;
          break;
      }

      if (!bmdListStr) return;

      const values = bmdListStr
        .split(';')
        .map(v => v.trim())
        .filter(v => v !== '' && v !== 'NA')
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v) && v > 0);

      values.forEach(v => {
        if (v < globalMin) globalMin = v;
        if (v > globalMax) globalMax = v;
      });
    });

    // Filter out categories from hidden clusters
    const visibleData = data.filter((row) => {
      const categoryId = row.categoryId || '';
      const umapItem = umapDataService.getByGoId(categoryId);
      const clusterId = umapItem?.cluster_id ?? -1;
      return !hiddenClusters.has(clusterId);
    });

    // Sort by BMD median descending and take top 5
    const MAX_CATEGORIES = 5;
    const sortedData = [...visibleData].sort((a, b) => {
      const aMedian = a.bmdMedian || 0;
      const bMedian = b.bmdMedian || 0;
      return bMedian - aMedian; // Descending order
    });
    const limitedData = sortedData.slice(0, MAX_CATEGORIES);

    limitedData.forEach((row) => {
      const categoryId = row.categoryId || '';
      const categoryDesc = row.categoryDescription || categoryId || 'Unknown';

      // Get the appropriate BMD list based on selected metric
      let bmdListStr: string | undefined;
      switch (selectedMetric) {
        case 'bmd':
          bmdListStr = row.bmdList;
          break;
        case 'bmdl':
          bmdListStr = row.bmdlList;
          break;
        case 'bmdu':
          bmdListStr = row.bmduList;
          break;
      }

      if (!bmdListStr) return;

      // Parse semicolon-separated values
      const values = bmdListStr
        .split(';')
        .map(v => v.trim())
        .filter(v => v !== '' && v !== 'NA')
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v) && v > 0);

      if (values.length === 0) return;

      // Get cluster color
      const umapItem = umapDataService.getByGoId(categoryId);
      const clusterId = umapItem?.cluster_id ?? -1;
      const color = clusterColors[clusterId] || '#999999';

      // Truncate category description to 20 characters for x-axis label
      const truncatedDesc = categoryDesc.length > 20 ? categoryDesc.substring(0, 20) + '...' : categoryDesc;

      // Create violin trace for this category
      traces.push({
        type: 'violin',
        y: values,
        x: Array(values.length).fill(truncatedDesc),
        name: truncatedDesc,
        box: {
          visible: true
        },
        meanline: {
          visible: true
        },
        marker: {
          color: color
        },
        line: {
          color: color
        },
        fillcolor: color,
        opacity: 0.6,
        hoverinfo: 'y+name',
        hovertemplate: `<b>${categoryDesc}</b><br>Value: %{y:.4f}<extra></extra>`,
      });
    });

    // Calculate y-axis range with fake zero at bottom
    let yRange: [number, number] | undefined;
    if (globalMin !== Infinity && globalMax !== -Infinity) {
      // Fake zero: one order of magnitude less than the decade of the minimum value
      const minDecade = Math.floor(Math.log10(globalMin));
      const fakeZero = Math.pow(10, minDecade - 1);

      const logMin = Math.log10(fakeZero);
      const logMax = Math.log10(globalMax);
      const rangeSize = logMax - logMin;
      const bottomPadding = rangeSize * 0.05; // 5% padding at bottom to show fake zero gridline
      const topPadding = rangeSize * 0.1; // 10% padding at top
      yRange = [logMin - bottomPadding, logMax + topPadding];
    }

    return { violinData: traces, yAxisRange: yRange };
  }, [data, clusterColors, selectedMetric, hiddenClusters]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        <p><strong>No data available for Violin Plot</strong></p>
        <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
          No categories pass the current filters.
        </p>
      </div>
    );
  }

  if (violinData.length === 0) {
    return (
      <Alert
        message="No BMD List Data Available"
        description="The selected categories don't have BMD list data for violin plot visualization. BMD list data contains individual gene-level BMD values for each category."
        type="warning"
        showIcon
        style={{ margin: '2rem' }}
      />
    );
  }

  const metricLabel = selectedMetric === 'bmd' ? 'BMD' : selectedMetric === 'bmdl' ? 'BMDL' : 'BMDU';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h4 style={{ margin: 0 }}>Violin Plot Per Category - {metricLabel} Distribution</h4>
        <Select
          value={selectedMetric}
          onChange={setSelectedMetric}
          style={{ width: 120 }}
        >
          <Option value="bmd">BMD</Option>
          <Option value="bmdl">BMDL</Option>
          <Option value="bmdu">BMDU</Option>
        </Select>
      </div>

      {data.length > 5 && (
        <Alert
          message={`Showing top 5 of ${data.length} categories`}
          description="Displaying the 5 categories with highest BMD median values. Use filters to refine the selection."
          type="info"
          showIcon
          closable
          style={{ marginBottom: '1rem' }}
        />
      )}

      <Plot
        data={violinData}
        layout={{
          title: {
            text: `${metricLabel} Distribution by Category (Colored by Cluster)`,
            font: { size: 14 },
          },
          xaxis: {
            title: { text: 'Category' },
            tickangle: -45,
            automargin: true,
            ticklen: 0,
            standoff: 30,
          },
          yaxis: {
            title: { text: `${metricLabel} Value` },
            type: 'log',
            range: yAxisRange,
            showgrid: true,
            gridcolor: '#d0d0d0',
            gridwidth: 1,
            dtick: 1,
            tick0: 0,
          },
          height: 600,
          margin: { l: 70, r: 50, t: 80, b: 350 },
          plot_bgcolor: '#fafafa',
          paper_bgcolor: 'white',
          showlegend: false, // Each violin is unique, no need for legend
          violinmode: 'group',
        } as any}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['select2d', 'lasso2d'],
          toImageButtonOptions: {
            format: 'png',
            filename: 'violin_plot_per_category',
            height: 1000,
            width: 1600,
            scale: 2,
          },
        } as any}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />

      {/* Cluster Color Legend */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        background: '#f5f5f5',
        borderRadius: '4px',
        border: '1px solid #d9d9d9'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
          Cluster Colors <span style={{ fontSize: '12px', fontWeight: 400, color: '#666' }}>(click to show/hide)</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {umapDataService.getAllClusterIds().map((clusterId) => {
            const color = clusterColors[clusterId] || '#999999';
            const label = clusterId === -1 ? 'Outliers' : `Cluster ${clusterId}`;
            const isHidden = hiddenClusters.has(clusterId);
            return (
              <div
                key={clusterId}
                onClick={() => toggleCluster(clusterId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  opacity: isHidden ? 0.4 : 1,
                  transition: 'opacity 0.2s',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: isHidden ? 'transparent' : 'white',
                  border: isHidden ? '1px dashed #ccc' : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isHidden ? '#e8e8e8' : '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isHidden ? 'transparent' : 'white';
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: isHidden ? 'transparent' : color,
                  border: `2px solid ${color}`,
                  borderRadius: '2px',
                  position: 'relative'
                }}>
                  {isHidden && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(45deg)',
                      width: '1.5px',
                      height: '16px',
                      backgroundColor: color,
                    }} />
                  )}
                </div>
                <span style={{ fontSize: '13px', textDecoration: isHidden ? 'line-through' : 'none' }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
        <p><strong>About this chart:</strong></p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Each violin shows the distribution of {metricLabel} values across genes within that category</li>
          <li>Colors correspond to UMAP cluster assignments (see legend above)</li>
          <li>Box plot inside each violin shows median and quartiles</li>
          <li>Mean line is displayed as a dashed line</li>
        </ul>
      </div>
    </div>
  );
}
