/**
 * Range Plot Component
 *
 * Displays BMD with confidence intervals (BMDL-BMDU) for top 20 categories.
 * Each point shows the BMD median with error bars extending to BMDL and BMDU.
 *
 * Uses inFocus-based display mode styling (highlight/dim/isolate).
 */

import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { Select } from 'antd';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterColors, getClusterIdForCategory, getClusterLabel } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';
import { hexToRgba } from './utils/displayModeStyles';

const TOP_N_OPTIONS = [10, 20, 50, 100, 200, 'All'] as const;

export default function RangePlot() {
  const { data, displayMode, getPointStyle, shouldHidePoint } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const clusterColors = useClusterColors();
  const hasSelection = categoryState.selectedIds.size > 0;
  const [topN, setTopN] = useState<number | 'All'>(20);

  // Filter top N categories by p-value, then sort alphabetically for display
  // Track p-value rank for each category
  const topCategories = useMemo(() => {
    if (!data || data.length === 0) return [];

    const validData = data.filter(row =>
      row.bmdMedian != null &&
      row.bmdlMedian != null &&
      row.bmduMedian != null &&
      row.bmdMedian > 0 &&
      row.bmdlMedian > 0 &&
      row.bmduMedian > 0
    );

    // First sort by p-value to get top N most significant
    const sortedByPValue = [...validData].sort((a, b) => {
      const pA = a.fishersExactTwoTailPValue ?? 1;
      const pB = b.fishersExactTwoTailPValue ?? 1;
      return pA - pB;
    });

    // Take top N and assign p-value rank
    const topN_categories = (topN === 'All' ? sortedByPValue : sortedByPValue.slice(0, topN))
      .map((row, index) => ({
        ...row,
        pValueRank: index + 1, // 1-based rank
      }));

    // Then sort alphabetically by category description for display
    return topN_categories.sort((a, b) => {
      const nameA = (a.categoryDescription || a.categoryId || '').toLowerCase();
      const nameB = (b.categoryDescription || b.categoryId || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [data, topN]);

  // Calculate max display name length from ALL valid categories (not just topN)
  // This ensures consistent axis width regardless of how many categories are shown
  const maxDisplayNameLen = useMemo(() => {
    if (!data || data.length === 0) return 0;

    const validData = data.filter(row =>
      row.bmdMedian != null &&
      row.bmdlMedian != null &&
      row.bmduMedian != null &&
      row.bmdMedian > 0 &&
      row.bmdlMedian > 0 &&
      row.bmduMedian > 0
    );

    // Calculate what the longest label would be if ALL categories were shown
    // Format: "N. Category Name (R)" where N could be up to validData.length digits
    const maxIndex = validData.length;
    const maxIndexDigits = String(maxIndex).length;

    let maxLen = 0;
    validData.forEach((row, idx) => {
      const baseName = row.categoryDescription || row.categoryId || 'Unknown';
      // Simulate the full format with max possible index width
      const indexStr = String(idx + 1).padStart(maxIndexDigits, ' ');
      const rankStr = String(idx + 1); // Rank could also be up to maxIndex
      const displayName = `${indexStr}. ${baseName} (${rankStr})`;
      if (displayName.length > maxLen) {
        maxLen = displayName.length;
      }
    });

    return maxLen;
  }, [data]);

  // Truncated width for display (1/3 of full width)
  const truncatedDisplayLen = Math.ceil(maxDisplayNameLen / 3);

  // Build display names for current selection (truncated for axis, full for hover)
  const displayNamesList = useMemo(() => {
    const maxIndexDigits = String(topCategories.length).length;
    return topCategories.map((row, idx) => {
      const baseName = row.categoryDescription || row.categoryId || 'Unknown';
      const indexStr = String(idx + 1).padStart(maxIndexDigits, ' ');
      const fullName = `${indexStr}. ${baseName} (${row.pValueRank})`;
      // Truncate to 1/3 width, add ellipsis if needed
      if (fullName.length > truncatedDisplayLen) {
        return fullName.substring(0, truncatedDisplayLen - 3) + '...';
      }
      return fullName.padEnd(truncatedDisplayLen, ' ');
    });
  }, [topCategories, truncatedDisplayLen]);

  // Group categories by cluster with inFocus state
  // Format display names with alphabetical index and p-value rank
  const clusterData = useMemo(() => {
    const byCluster = new Map<number, Array<{
      categoryId: string;
      categoryName: string;
      displayName: string;
      fullDisplayName: string;
      bmd: number;
      bmdl: number;
      bmdu: number;
      inFocus: boolean;
      alphabeticalIndex: number;
      pValueRank: number;
    }>>();

    const maxIndexDigits = String(topCategories.length).length;

    topCategories.forEach((row, alphabeticalIndex) => {
      const clusterId = getClusterIdForCategory(row.categoryId);
      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      const baseName = row.categoryDescription || row.categoryId || 'Unknown';
      // Format: "N. Category Name (R)" where N is alphabetical order, R is p-value rank
      const indexStr = String(alphabeticalIndex + 1).padStart(maxIndexDigits, ' ');
      const fullDisplayName = `${indexStr}. ${baseName} (${row.pValueRank})`;

      // Truncate for axis display (1/3 width)
      let displayName: string;
      if (fullDisplayName.length > truncatedDisplayLen) {
        displayName = fullDisplayName.substring(0, truncatedDisplayLen - 3) + '...';
      } else {
        displayName = fullDisplayName.padEnd(truncatedDisplayLen, ' ');
      }

      byCluster.get(clusterId)!.push({
        categoryId: row.categoryId || '',
        categoryName: baseName,
        displayName,
        fullDisplayName,
        bmd: row.bmdMedian!,
        bmdl: row.bmdlMedian!,
        bmdu: row.bmduMedian!,
        inFocus: row.inFocus,
        alphabeticalIndex: alphabeticalIndex + 1,
        pValueRank: row.pValueRank
      });
    });

    return byCluster;
  }, [topCategories, truncatedDisplayLen]);

  // Create traces with inFocus-based per-point styling
  const plotData = useMemo(() => {
    const traces: any[] = [];

    // Sort clusters (outliers last)
    const sortedClusters = Array.from(clusterData.keys()).sort((a, b) => {
      if (a === -1) return 1;
      if (b === -1) return -1;
      return a - b;
    });

    sortedClusters.forEach(clusterId => {
      const items = clusterData.get(clusterId)!;
      const baseColor = clusterColors[clusterId] || '#999999';

      // Filter points based on displayMode (isolate mode hides out-of-focus)
      const visibleItems = items.filter(item => !shouldHidePoint(item.inFocus));

      if (visibleItems.length === 0) {
        return; // Skip empty cluster traces
      }

      // Per-point styling arrays - use RGBA colors with opacity embedded
      const markerColors: string[] = [];
      const markerSizes: number[] = [];
      const markerLineWidths: number[] = [];
      const markerLineColors: string[] = [];
      const errorBarColors: string[] = [];

      visibleItems.forEach(item => {
        const isSelected = categoryState.selectedIds.has(item.categoryId);
        const style = getPointStyle(item.inFocus, baseColor);

        if (isSelected && hasSelection) {
          // Selected: full opacity with white border
          markerColors.push(baseColor);
          markerSizes.push(12);
          markerLineWidths.push(2);
          markerLineColors.push('white');
          errorBarColors.push(baseColor);
        } else {
          // Use RGBA to embed opacity directly in color
          markerColors.push(hexToRgba(baseColor, style.opacity));
          markerSizes.push(style.size);
          markerLineWidths.push(style.lineWidth);
          markerLineColors.push(style.lineColor);
          errorBarColors.push(hexToRgba(baseColor, style.opacity));
        }
      });

      // Calculate error bar extents
      const errorMinus = visibleItems.map(item => item.bmd - item.bmdl);
      const errorPlus = visibleItems.map(item => item.bmdu - item.bmd);

      // Create individual traces per point to support per-point error bar colors
      visibleItems.forEach((item, idx) => {
        traces.push({
          type: 'scatter',
          mode: 'markers',
          x: [item.bmd],
          y: [item.displayName],
          error_x: {
            type: 'data',
            symmetric: false,
            array: [errorPlus[idx]],
            arrayminus: [errorMinus[idx]],
            thickness: 2,
            width: 4,
            color: errorBarColors[idx],
          },
          marker: {
            color: markerColors[idx],
            size: markerSizes[idx],
            symbol: 'circle',
            line: {
              color: markerLineColors[idx],
              width: markerLineWidths[idx],
            },
          },
          name: getClusterLabel(clusterId),
          hovertemplate:
            `<b>${item.fullDisplayName}</b><br>` +
            `${item.categoryName}<br>` +
            `${getClusterLabel(clusterId)}<br>` +
            `Alphabetical: #${item.alphabeticalIndex} | P-value Rank: #${item.pValueRank}<br>` +
            'BMD: %{x:.4f}<br>' +
            `BMDL: ${item.bmdl.toFixed(4)}<br>` +
            `BMDU: ${item.bmdu.toFixed(4)}<br>` +
            '<extra></extra>',
          showlegend: false,
        });
      });
    });

    return traces;
  }, [clusterData, clusterColors, categoryState.selectedIds, hasSelection, displayMode, getPointStyle, shouldHidePoint]);

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

  // Calculate height based on topCategories count (not visible items) for consistent spacing
  const plotHeight = Math.max(300, topCategories.length * 22 + 80);

  // Get all display names for consistent y-axis (maintains spacing across display modes)
  // Use truncated names padded to consistent width for left-justified appearance
  const paddedDisplayNames = displayNamesList.map(name => name.padEnd(truncatedDisplayLen, ' '));
  const reversedNames = [...paddedDisplayNames].reverse(); // A at top

  const titleText = topN === 'All'
    ? 'Range Plot: BMD with Confidence Intervals (All Pathways)'
    : `Range Plot: BMD with Confidence Intervals (Top ${topN} Pathways)`;

  const layout: any = {
    title: {
      text: titleText,
      font: { size: 14 },
    },
    xaxis: {
      title: { text: 'BMD Value' },
      type: 'log',
      autorange: true,
      gridcolor: DEFAULT_GRID_COLOR,
    },
    yaxis: {
      title: '',
      type: 'category',
      categoryorder: 'array',
      categoryarray: reversedNames,
      range: [-0.5, reversedNames.length - 0.5], // Tight range around categories
      gridcolor: DEFAULT_GRID_COLOR,
      showticklabels: false, // Hide tick labels - we'll render them as HTML for hover support
    },
    height: plotHeight,
    margin: { l: 10, r: 30, t: 50, b: 40 }, // Minimal left margin, automargin handles the rest
    hovermode: 'closest',
    ...DEFAULT_LAYOUT_STYLES,
    showlegend: false,
  };

  // Calculate dimensions for the HTML label column
  const topMargin = 50; // Must match layout.margin.t
  const bottomMargin = 40; // Must match layout.margin.b
  const chartAreaHeight = plotHeight - topMargin - bottomMargin;
  const rowHeight = chartAreaHeight / topCategories.length;

  // Build labels to match chart order (A at top)
  // Chart's categoryarray is reversedNames = [...alphabetical].reverse() = [Z...A]
  // Plotly places categoryarray[0] at bottom, so A ends up at top
  // HTML table: first row is at top, so we need [A...Z] order (don't reverse)
  const labelsForDisplay = useMemo(() => {
    const maxIndexDigits = String(topCategories.length).length;
    return topCategories.map((row, idx) => {
      const baseName = row.categoryDescription || row.categoryId || 'Unknown';
      const indexStr = String(idx + 1).padStart(maxIndexDigits, ' ');
      const fullName = `${indexStr}. ${baseName} (${row.pValueRank})`;
      const truncated = fullName.length > truncatedDisplayLen
        ? fullName.substring(0, truncatedDisplayLen - 3) + '...'
        : fullName;
      return { truncated, fullName };
    });
  }, [topCategories, truncatedDisplayLen]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <span style={{ marginRight: '0.5rem' }}>Show:</span>
        <Select
          value={topN}
          onChange={setTopN}
          style={{ width: 100 }}
          size="small"
          options={TOP_N_OPTIONS.map(opt => ({
            value: opt,
            label: opt === 'All' ? 'All' : `Top ${opt}`,
          }))}
        />
      </div>
      <div style={{ display: 'flex', width: '100%' }}>
        {/* HTML table label column with hover tooltips */}
        <table style={{
          borderCollapse: 'collapse',
          marginTop: topMargin,
          marginBottom: bottomMargin,
          flexShrink: 0,
        }}>
          <tbody>
            {labelsForDisplay.map((label, idx) => (
              <tr key={idx}>
                <td
                  title={label.fullName}
                  style={{
                    height: rowHeight,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: 10,
                    whiteSpace: 'nowrap',
                    paddingRight: 8,
                    paddingLeft: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    verticalAlign: 'middle',
                    textAlign: 'left',
                    cursor: 'default',
                    border: 'none',
                  }}
                >
                  {label.truncated}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Plotly chart */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Plot
            data={plotData}
            layout={layout}
            config={createPlotlyConfig()}
            style={{ width: '100%', height: plotHeight }}
            useResizeHandler={true}
          />
        </div>
      </div>
    </div>
  );
}
