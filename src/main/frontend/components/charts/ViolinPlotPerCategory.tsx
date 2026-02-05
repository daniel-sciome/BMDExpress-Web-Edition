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
import { Alert, Checkbox, Select, Space, Typography } from 'antd';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useBmdMetric } from './hooks/useBmdMetric';
import { BmdStatSelector } from './BmdMetricSelector';
import { getClusterIdForCategory, getClusterColor } from './utils/clusterColors';
import { createPlotlyConfigWithExport, DEFAULT_LAYOUT_STYLES } from './utils/plotlyConfig';
import { parseSemicolonNumericList } from 'Frontend/utils/dtoParsingUtils';
import type { BmdBaseType } from './utils/bmdMetricConfig';

const { Option } = Select;
const { Text } = Typography;

export default function ViolinPlotPerCategory() {
  const { data, shouldHidePoint } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const [selectedBase, setSelectedBase] = useState<BmdBaseType>('bmd');
  const [useLogScale, setUseLogScale] = useState(true);
  const [numCategories, setNumCategories] = useState(5);

  // BMD metric for sorting (uses selected base + stat)
  const { stat, setStat, getValue: getSortValue, label: metricLabel } = useBmdMetric(selectedBase, 'fifthPercentile');

  const hasSelection = categoryState.selectedIds.size > 0;

  // Parse BMD list and prepare violin plot data
  const { violinData, yTickVals, yTickText, inFocusCount, dimmedCount } = useMemo(() => {
    // Filter based on displayMode
    const visibleData = data.filter((row) => {
      // Filter by displayMode (isolate mode hides out-of-focus)
      if (shouldHidePoint(row.inFocus)) return false;
      return true;
    });

    // Sort by selected metric ascending and take N categories with lowest values
    const sortedData = [...visibleData].sort((a, b) => {
      const aValue = getSortValue(a) || Infinity;
      const bValue = getSortValue(b) || Infinity;
      return aValue - bValue; // Ascending order (lowest first)
    });
    const limitedData = sortedData.slice(0, numCategories);

    // Build traces - one per category with numeric y positions
    const traces: any[] = [];
    const yTickVals: number[] = [];
    const yTickText: { desc: string; suffix: string }[] = [];
    let inFocusCount = 0;
    let dimmedCount = 0;

    limitedData.forEach((row, index) => {
      const categoryId = row.categoryId || '';
      const categoryDesc = row.categoryDescription || categoryId || 'Unknown';

      // Get the appropriate BMD list based on selected base
      let bmdListStr: string | undefined;
      switch (selectedBase) {
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

      // Calculate min/max for this category's values (for span constraint)
      let catMin = Infinity;
      let catMax = -Infinity;
      for (const v of values) {
        if (v > 0 && isFinite(v)) {
          if (v < catMin) catMin = v;
          if (v > catMax) catMax = v;
        }
      }

      // Get cluster-based color for this category
      const clusterId = getClusterIdForCategory(categoryId);
      const baseColor = getClusterColor(clusterId);
      const isSelected = categoryState.selectedIds.has(categoryId);

      // Track counts for the info box based on whether category is in selected experiment
      const isInSelectedExperiment = row.inFocus;
      if (isInSelectedExperiment) {
        inFocusCount++;
      } else {
        dimmedCount++;
      }

      // Categories not in selected experiment get gray fill (regardless of display mode)
      // Outline always stays cluster color
      const fillColor = isInSelectedExperiment ? baseColor : '#b0b0b0';
      const outlineColor = baseColor;

      // Determine line width based on selection
      const lineWidth = isSelected && hasSelection ? 3 : 1.5;

      // Opacity for selection state (not focus state - that's handled by fill color)
      let opacity = 0.7;
      if (isSelected && hasSelection) {
        opacity = 1.0;
      } else if (hasSelection) {
        opacity = 0.4;
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
        side: 'both',
        width: 0.8,
        scalemode: 'width', // Each violin uses full width - better for comparing shapes
        span: [catMin, catMax], // Constrain KDE to actual data range (no negative values)
        spanmode: 'hard', // Hard cutoff at span boundaries
        box: {
          visible: true
        },
        meanline: {
          visible: true
        },
        marker: {
          color: fillColor
        },
        line: {
          color: outlineColor,  // Outline always cluster color
          width: lineWidth,
        },
        fillcolor: fillColor,  // White for dimmed, cluster color for in-focus
        opacity: opacity,
        hoverinfo: 'x+name',
        hovertemplate: `<b>${categoryDesc}</b><br>Value: %{x:.4f}<extra></extra>`,
        cliponaxis: false,
      });
    });

    return { violinData: traces, yTickVals, yTickText, inFocusCount, dimmedCount };
  }, [data, selectedBase, getSortValue, shouldHidePoint, categoryState.selectedIds, hasSelection, numCategories]);

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
        <h4 style={{ margin: 0 }}>Violin Plot Per Category</h4>
        <Space>
          <Text>Base:</Text>
          <Select
            value={selectedBase}
            onChange={setSelectedBase}
            style={{ width: 90 }}
          >
            <Option value="bmd">BMD</Option>
            <Option value="bmdl">BMDL</Option>
            <Option value="bmdu">BMDU</Option>
          </Select>
        </Space>
        <Space>
          <Text>Statistic:</Text>
          <BmdStatSelector stat={stat} onStatChange={setStat} />
        </Space>
        <Select
          value={numCategories}
          onChange={setNumCategories}
          style={{ width: 150 }}
        >
          <Option value={3}>3 categories</Option>
          <Option value={5}>5 categories</Option>
          <Option value={10}>10 categories</Option>
          <Option value={15}>15 categories</Option>
          <Option value={20}>20 categories</Option>
          <Option value={50}>50 categories</Option>
          <Option value={Infinity}>All categories</Option>
        </Select>
        <Checkbox checked={useLogScale} onChange={(e) => setUseLogScale(e.target.checked)}>
          Log₁₀ Scale
        </Checkbox>
      </div>

      {(data.length > numCategories || dimmedCount > 0) && (
        <Alert
          message={`Showing ${violinData.length} of ${data.length} categories`}
          description={
            <>
              {data.length > numCategories && (
                <div>Displaying the {numCategories === Infinity ? 'all' : numCategories} categories with lowest {metricLabel} values.</div>
              )}
              {inFocusCount > 0 && dimmedCount > 0 && (
                <div style={{ marginTop: '0.25rem' }}>
                  <strong>{inFocusCount}</strong> in selected experiment, <strong>{dimmedCount}</strong> not in selected experiment (shown with <span style={{ color: '#b0b0b0', fontWeight: 'bold' }}>gray</span> fill with cluster color border).
                </div>
              )}
              {inFocusCount === 0 && dimmedCount > 0 && (
                <div style={{ marginTop: '0.25rem' }}>
                  All <strong>{dimmedCount}</strong> categories are not in the selected experiment (shown with <span style={{ color: '#b0b0b0', fontWeight: 'bold' }}>gray</span> fill with cluster color border).
                </div>
              )}
            </>
          }
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
            text: `${selectedBase.toUpperCase()} Gene Distribution by Category (${numCategories === Infinity ? 'All' : `${numCategories} Lowest by ${metricLabel}`})`,
            font: { size: 14 },
          },
          xaxis: {
            title: { text: `${selectedBase.toUpperCase()} Value` },
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
            range: [yTickVals.length - 0.5, -0.5],  // Reversed so lowest BMD is at top
          },
          annotations: yAxisAnnotations,
          autosize: true,
          margin: { l: 280, r: 50, t: 80, b: 60 },
          ...DEFAULT_LAYOUT_STYLES,
          showlegend: false,
        } as any}
        config={createPlotlyConfigWithExport('violin_plot_per_category', 'wide') as any}
        style={{ width: '100%', height: `${Math.max(300, yTickVals.length * 80 + 140)}px` }}
        useResizeHandler={true}
      />

      <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
        <p><strong>About this chart:</strong></p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>Each violin shows the distribution of individual gene {selectedBase.toUpperCase()} values within that category</li>
          <li>Categories are ranked by {metricLabel} (ascending){numCategories !== Infinity && ` to select ${numCategories} with lowest values`}</li>
          <li>Colors correspond to UMAP cluster assignments (same as sidebar cluster picker)</li>
          <li>Box plot inside each violin shows median and quartiles</li>
          <li>Mean line is displayed as a dashed line</li>
        </ul>
      </div>
    </div>
  );
}
