/**
 * Chart Appearance Types
 *
 * Semantic type system for chart visual customization.
 * Uses domain names (xAxis.titleFont) rather than Plotly's API paths (xaxis.title.font).
 * A toPlotlyLayout() conversion function maps these to Plotly layout objects.
 *
 * Three-layer cascade (like CSS specificity):
 *   Plotly defaults < App defaults (plotlyConfig.ts) < Global theme < Per-chart overrides
 */

export interface FontConfig {
  family?: string;
  size?: number;
  color?: string;
  weight?: number;
  style?: 'normal' | 'italic';
}

export interface AxisAppearance {
  titleFont?: FontConfig;
  tickFont?: FontConfig;
  tickAngle?: number;
  showGrid?: boolean;
  gridColor?: string;
  gridDash?: 'solid' | 'dot' | 'dash' | 'longdash' | 'dashdot';
  gridWidth?: number;
  showLine?: boolean;
  lineColor?: string;
  lineWidth?: number;
  showZeroline?: boolean;
  zerolineColor?: string;
  zerolineWidth?: number;
  tickFormat?: string;
  showTickLabels?: boolean;
}

export interface LegendAppearance {
  show?: boolean;
  position?: { x: number; y: number };
  orientation?: 'v' | 'h';
  font?: FontConfig;
  bgcolor?: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface ChartAppearance {
  version: number;
  name?: string;
  title?: { font?: FontConfig };
  xAxis?: AxisAppearance;
  yAxis?: AxisAppearance;
  legend?: LegendAppearance;
  colors?: {
    colorway?: string[];
    paperBgcolor?: string;
    plotBgcolor?: string;
  };
  margins?: {
    t?: number;
    b?: number;
    l?: number;
    r?: number;
    pad?: number;
  };
  dimensions?: {
    width?: number;
    height?: number;
    autosize?: boolean;
  };
  hover?: {
    mode?: string;
    font?: FontConfig;
    bgcolor?: string;
  };
  rawLayoutOverrides?: Record<string, unknown>;
}

export interface SavedTheme {
  id: string;
  name: string;
  appearance: ChartAppearance;
}

/**
 * Default chart appearance matching current hardcoded values from plotlyConfig.ts.
 * This ensures zero visual regression when charts adopt the appearance system.
 */
export const DEFAULT_CHART_APPEARANCE: ChartAppearance = {
  version: 1,
  name: 'Default',
  colors: {
    paperBgcolor: 'white',
    plotBgcolor: '#fafafa',
  },
  xAxis: {
    showGrid: true,
    gridColor: '#e0e0e0',
  },
  yAxis: {
    showGrid: true,
    gridColor: '#e0e0e0',
  },
};

/** Current appearance schema version for migrations */
export const CHART_APPEARANCE_VERSION = 1;
