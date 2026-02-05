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
import { Checkbox, Select, Space, Typography } from 'antd';
import { useFocusAwareStyling } from './hooks/useFocusAwareStyling';
import { useReactiveState } from './hooks/useReactiveState';
import { useBmdMetricTriple } from './hooks/useBmdMetric';
import { BmdStatSelector } from './BmdMetricSelector';
import { useClusterColors, getClusterIdForCategory, getClusterLabel } from './utils/clusterColors';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';
import { hexToRgba } from './utils/displayModeStyles';
import { getTopNSourceData } from './utils/topNFilter';

const { Text } = Typography;

const TOP_N_OPTIONS = [10, 20, 50, 100, 200, 'All'] as const;

export default function RangePlot() {
  const { data, displayMode, getPointStyle } = useFocusAwareStyling();
  const categoryState = useReactiveState('categoryId');
  const clusterColors = useClusterColors();
  const hasSelection = categoryState.selectedIds.size > 0;
  const [topN, setTopN] = useState<number | 'All'>(20);
  const [useLogScale, setUseLogScale] = useState(true);

  // BMD metric selection (all three bases share the same stat)
  const { stat, setStat, bmd, bmdl, bmdu } = useBmdMetricTriple();

  // Filter top N categories by BMD value (smallest first), then sort alphabetically for display
  // In isolate mode, Top N is computed from focused items only
  // Track BMD rank for each category
  const topCategories = useMemo(() => {
    if (!data || data.length === 0) return [];

    // In isolate mode, compute Top N from focused items only
    const sourceData = getTopNSourceData(data, displayMode);

    const validData = sourceData.filter(row => {
      const bmdVal = bmd.getValue(row);
      const bmdlVal = bmdl.getValue(row);
      const bmduVal = bmdu.getValue(row);
      return bmdVal != null && bmdlVal != null && bmduVal != null &&
             bmdVal > 0 && bmdlVal > 0 && bmduVal > 0;
    });

    // Sort by BMD value ascending (smallest = most sensitive pathways first)
    const sortedByBmd = [...validData].sort((a, b) => {
      const bmdA = bmd.getValue(a) ?? Infinity;
      const bmdB = bmd.getValue(b) ?? Infinity;
      return bmdA - bmdB;
    });

    // Take top N (smallest BMD values) and assign BMD rank
    const topN_categories = (topN === 'All' ? sortedByBmd : sortedByBmd.slice(0, topN))
      .map((row, index) => ({
        ...row,
        bmdRank: index + 1, // 1-based rank by BMD value
      }));

    // Then sort alphabetically by category description for display
    return topN_categories.sort((a, b) => {
      const nameA = (a.categoryDescription || a.categoryId || '').toLowerCase();
      const nameB = (b.categoryDescription || b.categoryId || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [data, displayMode, topN, bmd, bmdl, bmdu]);

  // Calculate max display name length from ALL valid categories (not just topN)
  // This ensures consistent axis width regardless of how many categories are shown
  const maxDisplayNameLen = useMemo(() => {
    if (!data || data.length === 0) return 0;

    const validData = data.filter(row => {
      const bmdVal = bmd.getValue(row);
      const bmdlVal = bmdl.getValue(row);
      const bmduVal = bmdu.getValue(row);
      return bmdVal != null && bmdlVal != null && bmduVal != null &&
             bmdVal > 0 && bmdlVal > 0 && bmduVal > 0;
    });

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
  }, [data, bmd, bmdl, bmdu]);

  // Truncated width for display (1/3 of full width)
  const truncatedDisplayLen = Math.ceil(maxDisplayNameLen / 3);

  // Build display names for visible categories (truncated for axis)
  const displayNamesList = useMemo(() => {
    const maxIndexDigits = String(topCategories.length).length;
    return topCategories.map((row, idx) => {
      const baseName = row.categoryDescription || row.categoryId || 'Unknown';
      const indexStr = String(idx + 1).padStart(maxIndexDigits, ' ');
      const fullName = `${indexStr}. ${baseName} (${row.bmdRank})`;
      // Truncate to 1/3 width, add ellipsis if needed
      if (fullName.length > truncatedDisplayLen) {
        return fullName.substring(0, truncatedDisplayLen - 3) + '...';
      }
      return fullName.padEnd(truncatedDisplayLen, ' ');
    });
  }, [topCategories, truncatedDisplayLen]);

  // Group categories by cluster with inFocus state
  // Format display names with alphabetical index and BMD rank
  // topCategories is already filtered for isolate mode via getTopNSourceData
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
      bmdRank: number;
    }>>();

    const maxIndexDigits = String(topCategories.length).length;

    topCategories.forEach((row, idx) => {
      const clusterId = getClusterIdForCategory(row.categoryId);
      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      const baseName = row.categoryDescription || row.categoryId || 'Unknown';
      // Format: "N. Category Name (R)" where N is alphabetical order, R is BMD rank
      const indexStr = String(idx + 1).padStart(maxIndexDigits, ' ');
      const fullDisplayName = `${indexStr}. ${baseName} (${row.bmdRank})`;

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
        bmd: bmd.getValue(row)!,
        bmdl: bmdl.getValue(row)!,
        bmdu: bmdu.getValue(row)!,
        inFocus: row.inFocus,
        alphabeticalIndex: idx + 1,
        bmdRank: row.bmdRank
      });
    });

    return byCluster;
  }, [topCategories, truncatedDisplayLen, bmd, bmdl, bmdu]);

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

      if (items.length === 0) {
        return; // Skip empty cluster traces
      }

      // Per-point styling arrays - use RGBA colors with opacity embedded
      const markerColors: string[] = [];
      const markerSizes: number[] = [];
      const markerLineWidths: number[] = [];
      const markerLineColors: string[] = [];
      const errorBarColors: string[] = [];

      items.forEach(item => {
        const isSelected = categoryState.selectedIds.has(item.categoryId);
        const focusStyle = getPointStyle(item.inFocus, baseColor);

        // Styling priority: selection > focus
        if (isSelected && hasSelection) {
          // Selected: full opacity with white border
          markerColors.push(baseColor);
          markerSizes.push(12);
          markerLineWidths.push(2);
          markerLineColors.push('white');
          errorBarColors.push(baseColor);
        } else if (hasSelection) {
          // Not selected but something is: dim this point
          markerColors.push(hexToRgba(baseColor, 0.2));
          markerSizes.push(focusStyle.size);
          markerLineWidths.push(0);
          markerLineColors.push('white');
          errorBarColors.push(hexToRgba(baseColor, 0.2));
        } else {
          // No selection at all: use focus-based styling
          markerColors.push(hexToRgba(baseColor, focusStyle.opacity));
          markerSizes.push(focusStyle.size);
          markerLineWidths.push(focusStyle.lineWidth);
          markerLineColors.push(focusStyle.lineColor);
          errorBarColors.push(hexToRgba(baseColor, focusStyle.opacity));
        }
      });

      // Calculate error bar extents
      const errorMinus = items.map(item => item.bmd - item.bmdl);
      const errorPlus = items.map(item => item.bmdu - item.bmd);

      // Create individual traces per point to support per-point error bar colors
      items.forEach((item, idx) => {
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
            `Alphabetical: #${item.alphabeticalIndex} | BMD Rank: #${item.bmdRank}<br>` +
            `${bmd.label}: %{x:.4f}<br>` +
            `${bmdl.label}: ${item.bmdl.toFixed(4)}<br>` +
            `${bmdu.label}: ${item.bmdu.toFixed(4)}<br>` +
            '<extra></extra>',
          showlegend: false,
        });
      });
    });

    return traces;
  }, [clusterData, clusterColors, categoryState.selectedIds, hasSelection, displayMode, getPointStyle, bmd.label, bmdl.label, bmdu.label]);

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

  // Calculate height based on visible categories (topCategories)
  const visibleCount = topCategories.length;
  const plotHeight = Math.max(300, visibleCount * 22 + 80);

  // Get display names for y-axis (based on visible categories)
  // Use truncated names padded to consistent width for left-justified appearance
  const paddedDisplayNames = displayNamesList.map(name => name.padEnd(truncatedDisplayLen, ' '));
  const reversedNames = [...paddedDisplayNames].reverse(); // A at top

  const titleText = topN === 'All'
    ? `Range Plot: ${bmd.label} with Confidence Intervals (All Pathways)`
    : `Range Plot: ${bmd.label} with Confidence Intervals (Top ${topN} Pathways)`;

  const layout: any = {
    title: {
      text: titleText,
      font: { size: 14 },
    },
    xaxis: {
      title: { text: bmd.label },
      type: useLogScale ? 'log' : 'linear',
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
  const rowHeight = chartAreaHeight / visibleCount;

  // Build labels to match chart order (A at top)
  // topCategories is already filtered for isolate mode via getTopNSourceData
  // HTML table: first row is at top, matching alphabetical order
  const labelsForDisplay = useMemo(() => {
    const maxIndexDigits = String(topCategories.length).length;
    return topCategories.map((row, idx) => {
      const baseName = row.categoryDescription || row.categoryId || 'Unknown';
      const indexStr = String(idx + 1).padStart(maxIndexDigits, ' ');
      const fullName = `${indexStr}. ${baseName} (${row.bmdRank})`;
      const truncated = fullName.length > truncatedDisplayLen
        ? fullName.substring(0, truncatedDisplayLen - 3) + '...'
        : fullName;
      return { truncated, fullName };
    });
  }, [topCategories, truncatedDisplayLen]);

  return (
    <div style={{ width: '100%' }}>
      {/* Controls */}
      <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <Space>
          <Text>BMD Statistic:</Text>
          <BmdStatSelector stat={stat} onStatChange={setStat} />
        </Space>
        <Checkbox checked={useLogScale} onChange={(e) => setUseLogScale(e.target.checked)}>
          Log₁₀ Scale
        </Checkbox>
        <Space>
          <Text>Show:</Text>
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
        </Space>
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
