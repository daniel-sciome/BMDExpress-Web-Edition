/**
 * Violin Plot Per Category Component
 *
 * Displays BMD distribution for each individual category as a violin plot.
 * Each category shows the distribution of BMD values from its gene list.
 * Categories are colored by their UMAP cluster assignment.
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 *
 * LOCATION: Used in CategoryResultsView as one of the visualization options.
 *
 * NAVIGATION PATH: Sidebar → Analysis Result → Charts → Violin Plot Per Category
 */

import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { Alert, Checkbox, Select, Space } from 'antd';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { getClusterIdForCategory, getClusterColor } from './utils/clusterColors';
import { createPlotlyConfigWithExport, DEFAULT_LAYOUT_STYLES } from './utils/plotlyConfig';
import { parseSemicolonNumericList } from 'Frontend/utils/dtoParsingUtils';

const { Option } = Select;

export default function ViolinPlotPerCategory() {
  const { data, shouldHidePoint } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const [selectedMetric, setSelectedMetric] = useState<'bmd' | 'bmdl' | 'bmdu'>('bmd');
  const [useLogScale, setUseLogScale] = useState(true);

  const hasSelection = categoryState.selectedIds.size > 0;

  // Parse BMD list and prepare violin plot data
  const { violinData, yTickVals, yTickText } = useMemo(() => {
    // Filter based on displayMode
    const visibleData = data.filter((row) => {
      // Filter by displayMode (isolate mode hides out-of-focus)
      if (shouldHidePoint(row.inFocus)) return false;
      return true;
    });

    // Sort by BMD median descending and take top 5
    const MAX_CATEGORIES = 5;
    const sortedData = [...visibleData].sort((a, b) => {
      const aMedian = a.bmdMedian || 0;
      const bMedian = b.bmdMedian || 0;
      return bMedian - aMedian; // Descending order
    });
    const limitedData = sortedData.slice(0, MAX_CATEGORIES);

    // Build traces - one per category with numeric y positions
    const traces: any[] = [];
    const yTickVals: number[] = [];
    const yTickText: { desc: string; suffix: string }[] = [];

    limitedData.forEach((row, index) => {
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

      // Get cluster-based color for this category
      const clusterId = getClusterIdForCategory(categoryId);
      const baseColor = getClusterColor(clusterId);
      const isSelected = categoryState.selectedIds.has(categoryId);

      // Determine opacity - keep minimum of 0.7 for visibility
      let opacity: number;
      if (isSelected && hasSelection) {
        opacity = 1.0;
      } else if (hasSelection) {
        opacity = 0.4; // Dim non-selected but keep visible
      } else {
        opacity = 0.7; // Default opacity for good visibility
      }

      // Store description and gene count separately for smart wrapping
      const geneCountSuffix = `(${values.length} genes in category)`;
      const labelWithCount = { desc: categoryDesc, suffix: geneCountSuffix };

      // Use numeric y position
      const yPos = index;
      yTickVals.push(yPos);
      yTickText.push(labelWithCount);

      // Create horizontal violin trace with numeric y position
      traces.push({
        type: 'violin',
        x: values,
        y0: yPos,
        name: categoryDesc,
        orientation: 'h',
        width: 0.8,
        scalemode: 'width', // Each violin uses full width - better for comparing shapes
        box: {
          visible: true
        },
        meanline: {
          visible: true
        },
        marker: {
          color: baseColor
        },
        line: {
          color: baseColor,
          width: isSelected && hasSelection ? 3 : 1,
        },
        fillcolor: baseColor,
        opacity: opacity,
        hoverinfo: 'x+name',
        hovertemplate: `<b>${categoryDesc}</b><br>Value: %{x:.4f}<extra></extra>`,
      });
    });

    return { violinData: traces, yTickVals, yTickText };
  }, [data, selectedMetric, shouldHidePoint, categoryState.selectedIds, hasSelection]);

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

  // Helper to wrap text at specified character width, keeping suffix intact
  const wrapTextWithSuffix = (text: string, suffix: string, maxWidth: number): string => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    // Check if suffix fits on current line
    if (currentLine.length + suffix.length + 1 <= maxWidth) {
      currentLine += ' ' + suffix;
      lines.push(currentLine);
    } else {
      if (currentLine) lines.push(currentLine);
      lines.push(suffix);
    }

    return lines.join('<br>');
  };

  // Create annotations for centered y-axis labels with wrapped text
  const yAxisAnnotations = yTickVals.map((yVal, i) => ({
    x: 0,
    y: yVal,
    xref: 'paper' as const,
    yref: 'y' as const,
    text: wrapTextWithSuffix(yTickText[i].desc, yTickText[i].suffix, 35),
    showarrow: false,
    xanchor: 'center' as const,
    yanchor: 'middle' as const,
    align: 'center' as const,
    font: { size: 11 },
    xshift: -140,  // Center in the margin area
  }));

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
        <Checkbox checked={useLogScale} onChange={(e) => setUseLogScale(e.target.checked)}>
          Log₁₀ Scale
        </Checkbox>
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
            title: { text: `${metricLabel} Value` },
            type: useLogScale ? 'log' : 'linear',
            autorange: true,
            showgrid: true,
            gridcolor: '#d0d0d0',
            gridwidth: 1,
          },
          yaxis: {
            title: { text: '' },
            showticklabels: false,
            ticklen: 0,
            range: [-0.5, Math.max(4, yTickVals.length - 0.5)],
          },
          annotations: yAxisAnnotations,
          autosize: true,
          margin: { l: 280, r: 50, t: 80, b: 60 },
          ...DEFAULT_LAYOUT_STYLES,
          showlegend: false,
        } as any}
        config={createPlotlyConfigWithExport('violin_plot_per_category', 'wide') as any}
        style={{ width: '100%', height: '500px' }}
        useResizeHandler={true}
      />

      <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
        <p><strong>About this chart:</strong></p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Each violin shows the distribution of {metricLabel} values across genes within that category</li>
          <li>Colors correspond to UMAP cluster assignments (same as sidebar cluster picker)</li>
          <li>Box plot inside each violin shows median and quartiles</li>
          <li>Mean line is displayed as a dashed line</li>
          <li>In-focus categories appear at full opacity; out-of-focus are dimmed/hidden based on display mode</li>
        </ul>
      </div>
    </div>
  );
}
