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
  modeBarButtonsToRemove: ['select2d', 'lasso2d'] as any,
  responsive: true,
};

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

/**
 * Log Scale with Zero Handling
 *
 * Provides utilities for displaying log-scale axes that include zero values.
 * Zero is plotted at a pseudo-position (one decade below minimum non-zero value)
 * and labeled appropriately using custom tick marks.
 */

/**
 * Prepare values for log scale display, handling zeros.
 * Zero values are replaced with a pseudo-value one decade below the minimum non-zero value.
 *
 * @param values - Array of numeric values (may include zeros)
 * @returns Object with transformed values and the pseudo-zero position
 *
 * @example
 * const { transformedValues, zeroPosition, minNonZero } = prepareLogScaleValues([0, 0.1, 1, 10]);
 * // zeroPosition = 0.01 (one decade below 0.1)
 * // transformedValues = [0.01, 0.1, 1, 10]
 */
export function prepareLogScaleValues(values: number[]): {
  transformedValues: number[];
  zeroPosition: number | null;
  minNonZero: number | null;
  maxValue: number | null;
} {
  const nonZeroValues = values.filter(v => v > 0 && isFinite(v));

  if (nonZeroValues.length === 0) {
    return {
      transformedValues: values,
      zeroPosition: null,
      minNonZero: null,
      maxValue: null,
    };
  }

  const minNonZero = Math.min(...nonZeroValues);
  const maxValue = Math.max(...nonZeroValues);
  // Place zero one decade below the minimum non-zero value
  const zeroPosition = minNonZero / 10;

  const transformedValues = values.map(v =>
    (v === 0 || !isFinite(v) || v < 0) ? zeroPosition : v
  );

  return {
    transformedValues,
    zeroPosition,
    minNonZero,
    maxValue,
  };
}

/**
 * Generate log scale axis configuration with proper handling of zero.
 * Creates custom tick values and labels so zero appears correctly labeled.
 *
 * @param values - Array of values to be plotted on this axis
 * @param options - Configuration options
 * @returns Plotly axis configuration object
 *
 * @example
 * const xAxisConfig = createLogAxisWithZero(doseValues, {
 *   title: 'Dose',
 *   zeroLabel: 'Control',
 * });
 */
export function createLogAxisWithZero(
  values: number[],
  options: {
    title?: string;
    zeroLabel?: string;
    showGrid?: boolean;
  } = {}
): {
  axisConfig: any;
  zeroPosition: number | null;
  transformedValues: number[];
} {
  const { title, zeroLabel = '0', showGrid = true } = options;
  const { transformedValues, zeroPosition, minNonZero, maxValue } = prepareLogScaleValues(values);

  if (zeroPosition === null || minNonZero === null || maxValue === null) {
    // No valid data, return basic config
    return {
      axisConfig: {
        title: title ? { text: title } : undefined,
        type: 'log',
        gridcolor: showGrid ? DEFAULT_GRID_COLOR : undefined,
        showgrid: showGrid,
      },
      zeroPosition: null,
      transformedValues,
    };
  }

  // Generate tick values: zero position + decade ticks
  const tickvals: number[] = [];
  const ticktext: string[] = [];

  // Check if any original values were zero
  const hasZeros = values.some(v => v === 0);

  if (hasZeros) {
    tickvals.push(zeroPosition);
    ticktext.push(zeroLabel);
  }

  // Add decade ticks from min to max
  const minDecade = Math.floor(Math.log10(minNonZero));
  const maxDecade = Math.ceil(Math.log10(maxValue));

  for (let decade = minDecade; decade <= maxDecade; decade++) {
    const tickValue = Math.pow(10, decade);
    // Don't duplicate if very close to zero position
    if (!hasZeros || Math.abs(Math.log10(tickValue) - Math.log10(zeroPosition)) > 0.5) {
      tickvals.push(tickValue);
      // Format nicely: 0.01, 0.1, 1, 10, 100, etc.
      ticktext.push(tickValue >= 1 ? tickValue.toString() : tickValue.toFixed(-decade + 1));
    }
  }

  // Calculate range to include zero position with some padding
  const rangeMin = Math.log10(zeroPosition) - 0.3;
  const rangeMax = Math.log10(maxValue) + 0.3;

  return {
    axisConfig: {
      title: title ? { text: title } : undefined,
      type: 'log',
      range: [rangeMin, rangeMax],
      tickmode: 'array',
      tickvals,
      ticktext,
      gridcolor: showGrid ? DEFAULT_GRID_COLOR : undefined,
      showgrid: showGrid,
    },
    zeroPosition,
    transformedValues,
  };
}

/**
 * Simple log axis configuration for data without zeros.
 * Use this for BMD values which should always be positive.
 *
 * @param options - Configuration options
 * @returns Plotly axis configuration object
 */
export function createSimpleLogAxis(options: {
  title?: string;
  showGrid?: boolean;
  range?: [number, number];
} = {}): any {
  const { title, showGrid = true, range } = options;

  return {
    title: title ? { text: title } : undefined,
    type: 'log',
    gridcolor: showGrid ? DEFAULT_GRID_COLOR : undefined,
    showgrid: showGrid,
    ...(range ? { range: range.map(v => Math.log10(v)) } : { autorange: true }),
  };
}
