/**
 * Plotly Configuration Utilities
 *
 * Centralized management of Plotly.js chart configurations to ensure
 * consistent behavior and styling across all chart components.
 */

import type { Config } from 'plotly.js';

/**
 * Default Plotly configuration used across all charts
 */
export const DEFAULT_PLOTLY_CONFIG: Partial<Config> = {
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['select2d', 'lasso2d'],
  responsive: true,
} as const;

/**
 * Default layout background colors and styles
 */
export const DEFAULT_LAYOUT_STYLES = {
  plot_bgcolor: '#fafafa',
  paper_bgcolor: 'white',
} as const;

/**
 * Default grid color for axes
 */
export const DEFAULT_GRID_COLOR = '#e0e0e0';

/**
 * Standard dimensions for image export
 */
export const IMAGE_EXPORT_DIMENSIONS = {
  standard: { width: 1200, height: 1000 },
  wide: { width: 1600, height: 1000 },
  tall: { width: 1200, height: 1400 },
} as const;

/**
 * Create Plotly config with optional overrides
 *
 * @param overrides - Optional config properties to override defaults
 * @returns Complete Plotly config object
 *
 * @example
 * const config = createPlotlyConfig();
 *
 * @example
 * const config = createPlotlyConfig({
 *   modeBarButtonsToRemove: ['zoom2d', 'pan2d']
 * });
 */
export function createPlotlyConfig(
  overrides?: Partial<Config>
): Partial<Config> {
  return {
    ...DEFAULT_PLOTLY_CONFIG,
    ...overrides,
  };
}

/**
 * Create image export button options
 *
 * @param filename - Base filename for exported image (without extension)
 * @param size - Preset size or custom dimensions
 * @returns Image export configuration object
 *
 * @example
 * const config = createPlotlyConfig({
 *   toImageButtonOptions: createImageExportConfig('violin_plot', 'wide')
 * });
 *
 * @example
 * const config = createPlotlyConfig({
 *   toImageButtonOptions: createImageExportConfig('custom_chart', { width: 1800, height: 1200 })
 * });
 */
export function createImageExportConfig(
  filename: string,
  size: keyof typeof IMAGE_EXPORT_DIMENSIONS | { width: number; height: number } = 'standard'
) {
  const dimensions = typeof size === 'string'
    ? IMAGE_EXPORT_DIMENSIONS[size]
    : size;

  return {
    format: 'png' as const,
    filename,
    width: dimensions.width,
    height: dimensions.height,
    scale: 2,
  };
}

/**
 * Create Plotly config with image export enabled
 *
 * @param filename - Base filename for exported image
 * @param size - Preset size or custom dimensions
 * @param configOverrides - Additional config overrides
 * @returns Complete Plotly config with image export
 *
 * @example
 * const config = createPlotlyConfigWithExport('scatter_plot', 'standard');
 */
export function createPlotlyConfigWithExport(
  filename: string,
  size: keyof typeof IMAGE_EXPORT_DIMENSIONS | { width: number; height: number } = 'standard',
  configOverrides?: Partial<Config>
): Partial<Config> {
  return createPlotlyConfig({
    toImageButtonOptions: createImageExportConfig(filename, size),
    ...configOverrides,
  });
}

/**
 * Create axis configuration with default grid styling
 *
 * @param overrides - Optional axis-specific properties
 * @returns Axis configuration object
 *
 * @example
 * layout={{
 *   xaxis: createAxisConfig({ title: 'Time', type: 'linear' }),
 *   yaxis: createAxisConfig({ title: 'Value', type: 'log' })
 * }}
 */
export function createAxisConfig(overrides?: any) {
  return {
    gridcolor: DEFAULT_GRID_COLOR,
    ...overrides,
  };
}
