/**
 * Display Mode Styling Utilities
 *
 * Centralized styling logic for the three display modes:
 * - highlight: Show all items (in-focus and out-of-focus) at full opacity
 * - dim: In-focus items shown normally, out-of-focus items dimmed
 * - isolate: In-focus items shown, out-of-focus items hidden
 *
 * Key concepts:
 * - inFocus: Whether a category passes the user's filter criteria
 * - displayMode: How to render out-of-focus items
 *
 * Used by tables, charts, and any component that needs to visualize focus state.
 */

import type { DisplayMode } from 'Frontend/types/visibilityTypes';

/**
 * Marker style configuration for Plotly charts
 */
export interface MarkerStyle {
  color: string;
  opacity: number;
  size: number;
  lineWidth: number;
  lineColor: string;
}

/**
 * Row/element style configuration for tables and DOM elements
 */
export interface ElementStyle {
  opacity: number;
  visible: boolean;
  className: string;
}

/**
 * Style multipliers for each display mode
 * These define how out-of-focus items are styled relative to in-focus items
 */
const displayModeConfig: Record<DisplayMode, {
  outOfFocusOpacity: number;
  useOutline: boolean;
  visible: boolean;
}> = {
  highlight: {
    outOfFocusOpacity: 1.0,  // Show out-of-focus items normally (full context)
    useOutline: false,
    visible: true,
  },
  dim: {
    outOfFocusOpacity: 0.2,  // Dim out-of-focus items
    useOutline: true,
    visible: true,
  },
  isolate: {
    outOfFocusOpacity: 0,    // Hide out-of-focus items completely
    useOutline: false,
    visible: false,
  },
};

// Alias for backward compatibility
const nonSelectedOpacityAlias = (mode: DisplayMode) => displayModeConfig[mode].outOfFocusOpacity;

/**
 * Get marker style for a chart point based on selection state and display mode
 *
 * @param isSelected - Whether this specific point is selected
 * @param hasAnySelection - Whether any selection exists
 * @param displayMode - Current display mode
 * @param baseColor - Base color for this point (hex format)
 * @param options - Optional configuration for sizes
 */
export function getMarkerStyle(
  isSelected: boolean,
  hasAnySelection: boolean,
  displayMode: DisplayMode,
  baseColor: string,
  options: {
    selectedSize?: number;
    normalSize?: number;
    /** For cluster-aware styling: is this point in a cluster that has selections? */
    isInSelectedCluster?: boolean;
  } = {}
): MarkerStyle {
  const {
    selectedSize = 10,
    normalSize = 8,
    isInSelectedCluster = false,
  } = options;

  // No selection - show everything normally
  if (!hasAnySelection) {
    return {
      color: baseColor,
      opacity: 1.0,
      size: normalSize,
      lineWidth: 0,
      lineColor: 'white',
    };
  }

  // Selected point - always full highlight with white border
  if (isSelected) {
    return {
      color: baseColor,
      opacity: 1.0,
      size: selectedSize,
      lineWidth: 2,
      lineColor: 'white',
    };
  }

  // Non-selected point - apply display mode styling
  const config = displayModeConfig[displayMode];

  // For dim mode with cluster awareness: outline same-cluster points
  if (displayMode === 'dim' && isInSelectedCluster) {
    const rgb = hexToRgb(baseColor);
    return {
      color: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`, // Transparent fill
      opacity: 1.0,
      size: normalSize,
      lineWidth: 1,
      lineColor: baseColor, // Colored border
    };
  }

  // Standard non-selected styling
  return {
    color: baseColor,
    opacity: config.outOfFocusOpacity,
    size: normalSize,
    lineWidth: config.useOutline ? 1 : 0,
    lineColor: config.useOutline ? baseColor : 'white',
  };
}

/**
 * Get marker style for a chart point based on inFocus state and display mode.
 *
 * This is the PRIMARY function for styling based on filter criteria.
 *
 * @param inFocus - Whether this category passes the user's filter criteria
 * @param displayMode - Current display mode (highlight, dim, isolate)
 * @param baseColor - Base color for this point (hex format)
 * @param options - Optional configuration for sizes
 */
export function getMarkerStyleByFocus(
  inFocus: boolean,
  displayMode: DisplayMode,
  baseColor: string,
  options: {
    focusedSize?: number;
    normalSize?: number;
  } = {}
): MarkerStyle {
  const {
    focusedSize = 10,
    normalSize = 8,
  } = options;

  // In-focus point - always full visibility
  if (inFocus) {
    return {
      color: baseColor,
      opacity: 1.0,
      size: focusedSize,
      lineWidth: 0,
      lineColor: 'white',
    };
  }

  // Out-of-focus point - apply display mode styling
  const config = displayModeConfig[displayMode];

  return {
    color: baseColor,
    opacity: config.outOfFocusOpacity,
    size: normalSize,
    lineWidth: config.useOutline ? 1 : 0,
    lineColor: config.useOutline ? baseColor : 'white',
  };
}

/**
 * Get CSS class name for table row based on selection state and display mode
 * @deprecated Use getRowClassNameByFocus for inFocus-based styling
 */
export function getRowClassName(
  isSelected: boolean,
  hasAnySelection: boolean,
  displayMode: DisplayMode
): string {
  if (!hasAnySelection) {
    return '';
  }

  if (isSelected) {
    return 'highlighted-row';
  }

  const classMap: Record<DisplayMode, string> = {
    highlight: 'normal-row',
    dim: 'dimmed-row',
    isolate: 'hidden-row',
  };

  return classMap[displayMode];
}

/**
 * Get CSS class name for table row based on inFocus state and display mode.
 *
 * This is the PRIMARY function for styling rows based on filter criteria.
 *
 * @param inFocus - Whether this category passes the user's filter criteria
 * @param displayMode - Current display mode (highlight, dim, isolate)
 */
export function getRowClassNameByFocus(
  inFocus: boolean,
  displayMode: DisplayMode
): string {
  // In-focus rows are always shown normally
  if (inFocus) {
    return 'in-focus-row';
  }

  // Out-of-focus rows styled based on display mode
  const classMap: Record<DisplayMode, string> = {
    highlight: 'out-of-focus-row',      // Shown normally (full context)
    dim: 'out-of-focus-row dimmed-row', // Dimmed
    isolate: 'out-of-focus-row hidden-row', // Hidden
  };

  return classMap[displayMode];
}

/**
 * Get element style for generic DOM elements
 * @deprecated Use getElementStyleByFocus for inFocus-based styling
 */
export function getElementStyle(
  isSelected: boolean,
  hasAnySelection: boolean,
  displayMode: DisplayMode
): ElementStyle {
  if (!hasAnySelection) {
    return { opacity: 1, visible: true, className: '' };
  }

  if (isSelected) {
    return { opacity: 1, visible: true, className: 'visibility-highlighted' };
  }

  const config = displayModeConfig[displayMode];
  const classMap: Record<DisplayMode, string> = {
    highlight: 'visibility-normal',
    dim: 'visibility-dimmed',
    isolate: 'visibility-hidden',
  };

  return {
    opacity: config.outOfFocusOpacity,
    visible: config.visible,
    className: classMap[displayMode],
  };
}

/**
 * Get element style for generic DOM elements based on inFocus state.
 *
 * This is the PRIMARY function for styling elements based on filter criteria.
 *
 * @param inFocus - Whether this category passes the user's filter criteria
 * @param displayMode - Current display mode (highlight, dim, isolate)
 */
export function getElementStyleByFocus(
  inFocus: boolean,
  displayMode: DisplayMode
): ElementStyle {
  // In-focus elements are always fully visible
  if (inFocus) {
    return { opacity: 1, visible: true, className: 'in-focus' };
  }

  // Out-of-focus elements styled based on display mode
  const config = displayModeConfig[displayMode];
  const classMap: Record<DisplayMode, string> = {
    highlight: 'out-of-focus',
    dim: 'out-of-focus dimmed',
    isolate: 'out-of-focus hidden',
  };

  return {
    opacity: config.outOfFocusOpacity,
    visible: config.visible,
    className: classMap[displayMode],
  };
}

/**
 * Helper: Convert hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/**
 * Helper: Convert hex color to rgba string
 */
export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
