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
import { Alert, Select } from 'antd';
import { useClusterColors, getClusterIdForCategory } from './utils/clusterColors';
import ClusterLegend from './ClusterLegend';
import { createPlotlyConfigWithExport, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';
import { parseSemicolonNumericList } from 'Frontend/utils/dtoParsingUtils';

const { Option } = Select;

export default function ViolinPlotPerCategory() {
  const data = useSelector(selectChartData);
  const [selectedMetric, setSelectedMetric] = useState<'bmd' | 'bmdl' | 'bmdu'>('bmd');
  const [hiddenClusters, setHiddenClusters] = useState<Set<string | number>>(new Set());

  // Get cluster colors using shared utility
  const clusterColors = useClusterColors();

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

      const values = parseSemicolonNumericList(bmdListStr);

      values.forEach(v => {
        if (v < globalMin) globalMin = v;
        if (v > globalMax) globalMax = v;
      });
    });

    // Filter out categories from hidden clusters
    const visibleData = data.filter((row) => {
      const categoryId = row.categoryId || '';
      const clusterId = getClusterIdForCategory(categoryId);
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

      // Parse semicolon-separated values using shared utility
      const values = parseSemicolonNumericList(bmdListStr);

      if (values.length === 0) return;

      // Get cluster color
      const clusterId = getClusterIdForCategory(categoryId);
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
          ...DEFAULT_LAYOUT_STYLES,
          showlegend: false, // Each violin is unique, no need for legend
          violinmode: 'group',
        } as any}
        config={createPlotlyConfigWithExport('violin_plot_per_category', 'wide') as any}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />

      {/* Cluster Color Legend */}
      <ClusterLegend
        clusterColors={clusterColors}
        hiddenClusters={hiddenClusters}
        onToggleCluster={toggleCluster}
      />

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
