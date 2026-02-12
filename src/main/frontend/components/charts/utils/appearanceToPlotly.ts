/**
 * Appearance-to-Plotly Conversion
 *
 * Maps semantic ChartAppearance fields to Plotly layout objects.
 * Pure functions, unit-testable.
 */

import type { ChartAppearance, FontConfig, AxisAppearance, LegendAppearance } from 'Frontend/types/chartAppearance';

/**
 * Convert a semantic FontConfig to a Plotly font object.
 */
function toPlotlyFont(font: FontConfig | undefined): Record<string, unknown> | undefined {
  if (!font) return undefined;

  const result: Record<string, unknown> = {};
  if (font.family !== undefined) result.family = font.family;
  if (font.size !== undefined) result.size = font.size;
  if (font.color !== undefined) result.color = font.color;
  // Plotly doesn't have weight/style directly on font, but some properties accept them
  // We include them for potential future use or rawLayoutOverrides
  if (font.weight !== undefined) result.weight = font.weight;
  if (font.style !== undefined) result.style = font.style;

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Convert a semantic AxisAppearance to a partial Plotly axis object.
 */
function toPlotlyAxis(axis: AxisAppearance | undefined): Record<string, unknown> {
  if (!axis) return {};

  const result: Record<string, unknown> = {};

  const titleFont = toPlotlyFont(axis.titleFont);
  if (titleFont) result.title = { font: titleFont };

  const tickFont = toPlotlyFont(axis.tickFont);
  if (tickFont) result.tickfont = tickFont;

  if (axis.tickAngle !== undefined) result.tickangle = axis.tickAngle;
  if (axis.showGrid !== undefined) result.showgrid = axis.showGrid;
  if (axis.gridColor !== undefined) result.gridcolor = axis.gridColor;
  if (axis.gridDash !== undefined) result.griddash = axis.gridDash;
  if (axis.gridWidth !== undefined) result.gridwidth = axis.gridWidth;
  if (axis.showLine !== undefined) result.showline = axis.showLine;
  if (axis.lineColor !== undefined) result.linecolor = axis.lineColor;
  if (axis.lineWidth !== undefined) result.linewidth = axis.lineWidth;
  if (axis.showZeroline !== undefined) result.zeroline = axis.showZeroline;
  if (axis.zerolineColor !== undefined) result.zerolinecolor = axis.zerolineColor;
  if (axis.zerolineWidth !== undefined) result.zerolinewidth = axis.zerolineWidth;
  if (axis.tickFormat !== undefined) result.tickformat = axis.tickFormat;
  if (axis.showTickLabels !== undefined) result.showticklabels = axis.showTickLabels;

  return result;
}

/**
 * Convert a semantic LegendAppearance to a partial Plotly legend object.
 */
function toPlotlyLegend(legend: LegendAppearance | undefined): Record<string, unknown> | undefined {
  if (!legend) return undefined;

  const result: Record<string, unknown> = {};

  if (legend.show !== undefined) result.visible = legend.show;
  if (legend.position) {
    result.x = legend.position.x;
    result.y = legend.position.y;
  }
  if (legend.orientation !== undefined) result.orientation = legend.orientation;
  const font = toPlotlyFont(legend.font);
  if (font) result.font = font;
  if (legend.bgcolor !== undefined) result.bgcolor = legend.bgcolor;
  if (legend.borderColor !== undefined) result.bordercolor = legend.borderColor;
  if (legend.borderWidth !== undefined) result.borderwidth = legend.borderWidth;

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Deep merge two objects. Source values override target values.
 * Arrays are replaced, not concatenated.
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const result = { ...target } as Record<string, unknown>;

  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = result[key];

    if (
      sourceVal !== null &&
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      targetVal !== undefined &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }

  return result as T;
}

/**
 * Convert a ChartAppearance to a partial Plotly layout object.
 * Does NOT include chart-specific content (axis titles, data ranges, etc.).
 *
 * @param appearance - The resolved ChartAppearance (already merged global + per-chart)
 * @returns Partial Plotly layout object
 */
export function appearanceToPlotlyLayout(appearance: ChartAppearance): Record<string, unknown> {
  const layout: Record<string, unknown> = {};

  // Title font
  if (appearance.title?.font) {
    const font = toPlotlyFont(appearance.title.font);
    if (font) layout.title = { font };
  }

  // Axes
  const xaxis = toPlotlyAxis(appearance.xAxis);
  if (Object.keys(xaxis).length > 0) layout.xaxis = xaxis;

  const yaxis = toPlotlyAxis(appearance.yAxis);
  if (Object.keys(yaxis).length > 0) layout.yaxis = yaxis;

  // Legend
  const legend = toPlotlyLegend(appearance.legend);
  if (legend) {
    layout.legend = legend;
    if (appearance.legend?.show === false) {
      layout.showlegend = false;
    }
  }

  // Colors
  if (appearance.colors) {
    if (appearance.colors.colorway) layout.colorway = appearance.colors.colorway;
    if (appearance.colors.paperBgcolor) layout.paper_bgcolor = appearance.colors.paperBgcolor;
    if (appearance.colors.plotBgcolor) layout.plot_bgcolor = appearance.colors.plotBgcolor;
  }

  // Margins
  if (appearance.margins) {
    layout.margin = {};
    const m = layout.margin as Record<string, unknown>;
    if (appearance.margins.t !== undefined) m.t = appearance.margins.t;
    if (appearance.margins.b !== undefined) m.b = appearance.margins.b;
    if (appearance.margins.l !== undefined) m.l = appearance.margins.l;
    if (appearance.margins.r !== undefined) m.r = appearance.margins.r;
    if (appearance.margins.pad !== undefined) m.pad = appearance.margins.pad;
  }

  // Dimensions
  if (appearance.dimensions) {
    if (appearance.dimensions.width !== undefined) layout.width = appearance.dimensions.width;
    if (appearance.dimensions.height !== undefined) layout.height = appearance.dimensions.height;
    if (appearance.dimensions.autosize !== undefined) layout.autosize = appearance.dimensions.autosize;
  }

  // Hover
  if (appearance.hover) {
    if (appearance.hover.mode !== undefined) layout.hovermode = appearance.hover.mode;
    if (appearance.hover.font || appearance.hover.bgcolor) {
      const hoverlabel: Record<string, unknown> = {};
      const font = toPlotlyFont(appearance.hover.font);
      if (font) hoverlabel.font = font;
      if (appearance.hover.bgcolor) hoverlabel.bgcolor = appearance.hover.bgcolor;
      layout.hoverlabel = hoverlabel;
    }
  }

  return layout;
}

/**
 * Apply a ChartAppearance to a chart's inline layout.
 *
 * Merge order (later wins):
 *   1. Appearance-derived layout (theme defaults)
 *   2. Chart's inline layout (chart-specific content like axis titles, data ranges)
 *   3. rawLayoutOverrides (escape hatch, always wins)
 *
 * This ensures chart-specific content (axis titles, ranges, etc.) is preserved
 * while theme styling is applied as defaults underneath.
 */
export function applyAppearanceToLayout(
  appearance: ChartAppearance,
  chartLayout: Record<string, unknown>
): Record<string, unknown> {
  const appearanceLayout = appearanceToPlotlyLayout(appearance);

  // Appearance goes first (as base), chart layout wins for conflicts
  let merged = deepMerge(appearanceLayout, chartLayout);

  // Apply raw overrides last (escape hatch always wins)
  if (appearance.rawLayoutOverrides) {
    merged = deepMerge(merged, appearance.rawLayoutOverrides);
  }

  return merged;
}

/**
 * Deep merge two ChartAppearance objects (for cascading global + per-chart).
 */
export function mergeAppearances(
  base: ChartAppearance,
  overrides: Partial<ChartAppearance>
): ChartAppearance {
  return deepMerge(
    base as unknown as Record<string, unknown>,
    overrides as unknown as Record<string, unknown>
  ) as unknown as ChartAppearance;
}

export { deepMerge };
