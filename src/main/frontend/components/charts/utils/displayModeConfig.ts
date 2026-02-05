/**
 * Display Mode Configuration
 *
 * Single source of truth for display mode visual properties.
 * Defines how selected/unselected items are rendered in charts.
 */

import type { ReactiveStyleMode } from 'Frontend/types/reactiveTypes';
import type { DisplayMode } from 'Frontend/types/visibilityTypes';

/**
 * Visual style properties for unselected items in each mode
 */
export interface DisplayModeStyle {
  opacity: number;
  visible: boolean;
}

/**
 * Chart-level display mode names
 */
export type NonSelectedDisplayMode = 'full' | 'outline' | 'hidden';

/**
 * Display mode configuration with visual properties
 */
interface DisplayModeConfig {
  /** Global display mode ID */
  displayMode: DisplayMode;
  /** Reactive style mode for chart utilities */
  reactiveMode: ReactiveStyleMode;
  /** Chart-level mode name */
  chartMode: NonSelectedDisplayMode;
  /** Label for UI */
  label: string;
  /** Opacity for unselected items */
  unselectedOpacity: number;
  /** Whether unselected items are visible */
  unselectedVisible: boolean;
}

/**
 * Display mode configurations
 */
export const DISPLAY_MODE_CONFIG: DisplayModeConfig[] = [
  {
    displayMode: 'highlight',
    reactiveMode: 'highlight',
    chartMode: 'full',
    label: 'Highlight',
    unselectedOpacity: 1.0,
    unselectedVisible: true,
  },
  {
    displayMode: 'dim',
    reactiveMode: 'dim',
    chartMode: 'outline',
    label: 'Dim',
    unselectedOpacity: 0.15,
    unselectedVisible: true,
  },
  {
    displayMode: 'isolate',
    reactiveMode: 'hide',
    chartMode: 'hidden',
    label: 'Isolate',
    unselectedOpacity: 0,
    unselectedVisible: false,
  },
];

/**
 * Selected item visual properties (constant across all modes)
 */
export const SELECTED_STYLE = {
  opacity: 1.0,
  markerLineWidth: 2,
  markerLineColor: '#fff',
  sizeMultiplier: 1.2,
} as const;

/**
 * Lookup helpers
 */
const BY_DISPLAY_MODE = new Map(DISPLAY_MODE_CONFIG.map(c => [c.displayMode, c]));
const BY_REACTIVE_MODE = new Map(DISPLAY_MODE_CONFIG.map(c => [c.reactiveMode, c]));
const BY_CHART_MODE = new Map(DISPLAY_MODE_CONFIG.map(c => [c.chartMode, c]));

/**
 * Get config by global display mode
 */
export function getDisplayModeConfig(mode: DisplayMode): DisplayModeConfig {
  return BY_DISPLAY_MODE.get(mode) ?? DISPLAY_MODE_CONFIG[1]; // Default to 'dim'
}

/**
 * Get config by reactive style mode
 */
export function getReactiveModeConfig(mode: ReactiveStyleMode): DisplayModeConfig {
  return BY_REACTIVE_MODE.get(mode) ?? DISPLAY_MODE_CONFIG[1];
}

/**
 * Get config by chart mode
 */
export function getChartModeConfig(mode: NonSelectedDisplayMode): DisplayModeConfig {
  return BY_CHART_MODE.get(mode) ?? DISPLAY_MODE_CONFIG[1];
}

/**
 * Map global display mode to chart-level mode
 */
export function displayModeToChartMode(mode: DisplayMode): NonSelectedDisplayMode {
  return getDisplayModeConfig(mode).chartMode;
}

/**
 * Map reactive style mode to opacity
 */
export function reactiveModeToOpacity(mode: ReactiveStyleMode): number {
  return getReactiveModeConfig(mode).unselectedOpacity;
}

/**
 * Get opacity for unselected item based on reactive mode
 */
export function getUnselectedOpacity(mode: ReactiveStyleMode): number {
  return getReactiveModeConfig(mode).unselectedOpacity;
}

/**
 * Check if unselected items should be visible in this mode
 */
export function isUnselectedVisible(mode: ReactiveStyleMode): boolean {
  return getReactiveModeConfig(mode).unselectedVisible;
}
