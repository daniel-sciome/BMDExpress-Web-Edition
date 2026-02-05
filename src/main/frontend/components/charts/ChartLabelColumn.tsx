/**
 * ChartLabelColumn Component
 *
 * Renders a column of hoverable labels that align with chart rows.
 * Used alongside Plotly charts to provide full-text tooltips for truncated labels.
 *
 * @example
 * ```tsx
 * <div style={{ display: 'flex' }}>
 *   <ChartLabelColumn
 *     labels={labels}
 *     rowHeight={22}
 *     topMargin={50}
 *     bottomMargin={40}
 *   />
 *   <Plot ... />
 * </div>
 * ```
 */

import React from 'react';
import type { FormattedLabel } from './utils/categoryLabelUtils';

export interface ChartLabelColumnProps {
  /** Array of formatted labels with full and truncated versions */
  labels: FormattedLabel[];
  /** Height of each row in pixels (should match chart row height) */
  rowHeight: number;
  /** Top margin in pixels (should match chart's layout.margin.t) */
  topMargin: number;
  /** Bottom margin in pixels (should match chart's layout.margin.b) */
  bottomMargin: number;
  /** Font size in pixels (default: 10) */
  fontSize?: number;
  /** Font family (default: monospace) */
  fontFamily?: string;
  /** Right padding between labels and chart (default: 8) */
  paddingRight?: number;
  /** Optional click handler for labels */
  onLabelClick?: (index: number, label: FormattedLabel) => void;
  /** Optional: reverse the label order (for charts with reversed y-axis) */
  reversed?: boolean;
}

const DEFAULT_FONT_FAMILY = 'Consolas, Monaco, "Courier New", monospace';

export default function ChartLabelColumn({
  labels,
  rowHeight,
  topMargin,
  bottomMargin,
  fontSize = 10,
  fontFamily = DEFAULT_FONT_FAMILY,
  paddingRight = 8,
  onLabelClick,
  reversed = false,
}: ChartLabelColumnProps) {
  const displayLabels = reversed ? [...labels].reverse() : labels;

  return (
    <table
      style={{
        borderCollapse: 'collapse',
        marginTop: topMargin,
        marginBottom: bottomMargin,
        flexShrink: 0,
      }}
    >
      <tbody>
        {displayLabels.map((label, idx) => {
          const originalIndex = reversed ? labels.length - 1 - idx : idx;

          return (
            <tr key={idx}>
              <td
                title={label.full}
                onClick={onLabelClick ? () => onLabelClick(originalIndex, label) : undefined}
                style={{
                  height: rowHeight,
                  fontFamily,
                  fontSize,
                  whiteSpace: 'nowrap',
                  paddingRight,
                  paddingLeft: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  verticalAlign: 'middle',
                  textAlign: 'left',
                  cursor: onLabelClick ? 'pointer' : 'default',
                  border: 'none',
                }}
              >
                {label.truncated}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * Calculate the row height for a label column based on chart dimensions.
 *
 * @param chartHeight - Total chart height in pixels
 * @param topMargin - Chart's top margin
 * @param bottomMargin - Chart's bottom margin
 * @param rowCount - Number of rows/categories
 */
export function calculateRowHeight(
  chartHeight: number,
  topMargin: number,
  bottomMargin: number,
  rowCount: number
): number {
  const chartAreaHeight = chartHeight - topMargin - bottomMargin;
  return chartAreaHeight / rowCount;
}
