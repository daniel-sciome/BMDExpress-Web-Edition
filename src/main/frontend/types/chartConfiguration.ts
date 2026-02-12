/**
 * Chart Configuration Types
 *
 * Defines the type system for configurable charts in BMDExpress Web.
 * Supports preset charts, configurable charts, and user-created custom charts.
 *
 * Key concepts:
 * - ChartKey: A field reference with optional transformation (log, negLog, etc.)
 * - ChartSpec: Definition of what a chart type requires (axes, options)
 * - ChartConfiguration: A saved/serializable chart configuration
 */

/**
 * Available transforms that can be applied to field values.
 * These match the transforms available in the desktop BMDExpress-3 application.
 */
export type ChartTransform = 'none' | 'log' | 'log10' | 'negLog10' | 'abs' | 'sqrt';

/**
 * Represents a field reference with optional transformation.
 * This is the fundamental unit for specifying what data to plot on an axis.
 *
 * @example
 * // Plot BMD median on log scale
 * { field: 'bmdMedian', transform: 'log10' }
 *
 * // Plot Fisher's p-value as -log10(p) for volcano-style plots
 * { field: 'fishersExactTwoTailPValue', transform: 'negLog10' }
 */
export interface ChartKey {
  /** Field name from CategoryAnalysisResultDto */
  field: string;

  /** Transform to apply to values (default: 'none') */
  transform?: ChartTransform;
}

/**
 * Axis definition for chart specifications.
 * Describes what an axis slot expects and its defaults.
 */
export interface AxisSpec {
  /** Whether this axis is required for the chart type */
  required: boolean;

  /** Human-readable label for UI (e.g., "X-Axis", "Bubble Size") */
  label: string;

  /** Default field if user doesn't specify */
  defaultField?: string;

  /** Default transform if user doesn't specify */
  defaultTransform?: ChartTransform;

  /** Whether this axis supports log scale toggle */
  supportsLogScale?: boolean;
}

/**
 * Chart type identifiers.
 * Maps to specific rendering implementations.
 */
export type ChartType =
  | 'scatter'
  | 'bubble'
  | 'histogram'
  | 'bar'
  | 'range'
  | 'violin'
  | 'accumulation'
  | 'heatmap'
  | 'curve-overlay'
  | 'venn';

/**
 * Chart specification: defines what a chart type requires and supports.
 * Used to validate configurations and generate editor UI.
 */
export interface ChartSpec {
  /** Chart type identifier */
  type: ChartType;

  /** Human-readable name */
  name: string;

  /** Brief description of what this chart shows */
  description: string;

  /** Axis specifications (which axes are required/optional) */
  axes: {
    x?: AxisSpec;
    y?: AxisSpec;
    size?: AxisSpec;      // For bubble charts
    color?: AxisSpec;     // For color-coded charts
  };

  /** Available options for this chart type */
  options?: {
    /** Whether Top N filtering is supported */
    supportsTopN?: boolean;

    /** Whether log scale toggle is supported */
    supportsLogScale?: boolean;

    /** Whether BMD metric selection (median/mean/5th percentile) is supported */
    supportsBmdMetric?: boolean;

    /** Whether this chart can be customized by users */
    isConfigurable?: boolean;
  };
}

/**
 * Chart options that can be customized per-configuration.
 * These are the runtime options that affect rendering.
 */
export interface ChartOptions {
  /** Number of items to show, or 'All' */
  topN?: number | 'All';

  /** Whether to use log scale on X axis */
  xLogScale?: boolean;

  /** Whether to use log scale on Y axis */
  yLogScale?: boolean;

  /** BMD statistic to use (for charts that support it) */
  bmdStat?: 'median' | 'mean' | 'fifthPercentile' | 'tenthPercentile';

  /** Any additional chart-specific options */
  [key: string]: unknown;
}

/**
 * Saved chart configuration.
 * This is what gets persisted to localStorage/server and used to render charts.
 */
export interface ChartConfiguration {
  /** Unique identifier for this configuration */
  id: string;

  /** User-visible name (shown in collapse headers, etc.) */
  name: string;

  /** Chart type (references ChartSpec.type) */
  chartType: ChartType;

  /** Field assignments for each axis */
  keys: {
    x?: ChartKey;
    y?: ChartKey;
    size?: ChartKey;
    color?: ChartKey;
  };

  /** Runtime options */
  options: ChartOptions;

  /** Whether this is a built-in preset (true) or user-created (false) */
  isPreset: boolean;

  /** Whether this chart is currently visible in the view */
  isVisible: boolean;

  /** Display order (lower = earlier in list) */
  order: number;

  /** Optional group ID for grouping related charts */
  groupId?: string;

  /** Per-chart appearance overrides (merged on top of global theme) */
  appearance?: Partial<import('./chartAppearance').ChartAppearance>;
}

/**
 * Chart configuration group.
 * Used to organize related charts (e.g., "BMD Statistics", "Accumulation Plots").
 */
export interface ChartConfigurationGroup {
  /** Unique identifier */
  id: string;

  /** Group name (shown in UI) */
  name: string;

  /** Display order */
  order: number;

  /** Whether this group is collapsed in the UI */
  isCollapsed: boolean;
}

/**
 * Complete chart configuration state.
 * This is what gets persisted and loaded from storage.
 */
export interface ChartConfigState {
  /** All chart configurations (presets + user-created) */
  configurations: ChartConfiguration[];

  /** Chart groups for organization */
  groups: ChartConfigurationGroup[];

  /** Timestamp of last modification (for sync) */
  lastModified: number;

  /** Version for migration support */
  version: number;

  /** Global chart appearance theme (applied to all charts) */
  globalAppearance: import('./chartAppearance').ChartAppearance;

  /** User-saved appearance themes */
  savedThemes: import('./chartAppearance').SavedTheme[];
}

/**
 * Partial configuration for creating/updating.
 * Used when users edit configurations.
 */
export type ChartConfigurationInput = Omit<ChartConfiguration, 'id' | 'order'> & {
  id?: string;
  order?: number;
};

/**
 * Apply a transform to a value.
 * Returns null if the input is invalid for the transform.
 */
export function applyTransform(value: number | null | undefined, transform: ChartTransform): number | null {
  if (value == null || !isFinite(value)) return null;

  switch (transform) {
    case 'none':
      return value;

    case 'log':
    case 'log10':
      if (value <= 0) return null;
      return Math.log10(value);

    case 'negLog10':
      if (value <= 0) return null;
      return -Math.log10(value);

    case 'abs':
      return Math.abs(value);

    case 'sqrt':
      if (value < 0) return null;
      return Math.sqrt(value);

    default:
      return value;
  }
}

/**
 * Get a human-readable label for a transform.
 */
export function getTransformLabel(transform: ChartTransform): string {
  switch (transform) {
    case 'none':
      return 'None';
    case 'log':
    case 'log10':
      return 'Log\u2081\u2080';
    case 'negLog10':
      return '-Log\u2081\u2080';
    case 'abs':
      return 'Absolute';
    case 'sqrt':
      return 'Square Root';
    default:
      return transform;
  }
}

/**
 * Generate a label for a ChartKey (field + transform).
 */
export function getChartKeyLabel(key: ChartKey, fieldLabels: Record<string, string>): string {
  const fieldLabel = fieldLabels[key.field] || key.field;
  const transform = key.transform || 'none';

  if (transform === 'none') {
    return fieldLabel;
  }

  return `${getTransformLabel(transform)}(${fieldLabel})`;
}

/** Current schema version for migrations */
export const CHART_CONFIG_VERSION = 1;
