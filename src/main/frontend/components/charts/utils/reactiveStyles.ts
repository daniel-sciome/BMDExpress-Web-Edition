// reactiveStyles.ts
// Generic utilities for applying reactive visual styles to chart data
// Phase 4: Chart Reactivity Infrastructure

import type { ReactiveStyleMode, ReactiveStyleProps } from 'Frontend/types/reactiveTypes';

/**
 * Apply reactive styles to chart data based on selection state
 *
 * @template T - Data type
 * @param data - Array of data items
 * @param idField - Field name containing the ID to match against selection
 * @param selectedIds - Set of selected IDs
 * @param mode - How to render unselected items ('highlight', 'dim', or 'hide')
 * @returns Array of style objects matching data array length
 *
 * @example
 * const styles = applyReactiveStyles(
 *   categories,
 *   'categoryId',
 *   selectedIds,
 *   'dim'
 * );
 * // Apply styles[i] to each plotly trace
 */
export function applyReactiveStyles<T>(
  data: T[],
  idField: keyof T,
  selectedIds: Set<any>,
  mode: ReactiveStyleMode = 'dim'
): ReactiveStyleProps[] {
  const hasSelection = selectedIds.size > 0;

  return data.map((item) => {
    const id = item[idField];
    const isSelected = selectedIds.has(id);

    if (!hasSelection) {
      // No selection - all items full opacity
      return {
        opacity: 1.0,
        marker: { opacity: 1.0, line: { width: 0 } },
      };
    }

    if (isSelected) {
      // Selected - highlight with border
      return {
        opacity: 1.0,
        marker: {
          opacity: 1.0,
          line: { width: 2, color: '#fff' },
        },
      };
    }

    // Not selected - apply mode
    switch (mode) {
      case 'highlight':
        return {
          opacity: 1.0,
          marker: { opacity: 1.0 },
        };
      case 'dim':
        return {
          opacity: 0.15,
          marker: { opacity: 0.15 },
        };
      case 'hide':
        return {
          opacity: 0,
          marker: { opacity: 0 },
        };
    }
  });
}

/**
 * Get reactive opacity for a single item
 *
 * @param id - Item ID to check
 * @param selectedIds - Set of selected IDs
 * @param mode - How to render if unselected
 * @returns Opacity value (0-1)
 */
export function getReactiveOpacity(
  id: any,
  selectedIds: Set<any>,
  mode: ReactiveStyleMode = 'dim'
): number {
  const hasSelection = selectedIds.size > 0;

  if (!hasSelection) return 1.0;
  if (selectedIds.has(id)) return 1.0;

  switch (mode) {
    case 'highlight':
      return 1.0;
    case 'dim':
      return 0.15;
    case 'hide':
      return 0;
  }
}

/**
 * Get reactive color for an item (optionally different when selected)
 *
 * @param id - Item ID to check
 * @param selectedIds - Set of selected IDs
 * @param baseColor - Base color to use
 * @param highlightColor - Optional different color when selected
 * @returns Color string
 */
export function getReactiveColor(
  id: any,
  selectedIds: Set<any>,
  baseColor: string,
  highlightColor?: string
): string {
  const hasSelection = selectedIds.size > 0;

  if (!hasSelection) return baseColor;

  if (selectedIds.has(id)) {
    return highlightColor || baseColor;
  }

  return baseColor;
}

/**
 * Get marker size with reactive scaling (larger when selected)
 *
 * @param id - Item ID to check
 * @param selectedIds - Set of selected IDs
 * @param baseSize - Base marker size
 * @param highlightSize - Size when selected (defaults to baseSize * 1.5)
 * @returns Marker size
 */
export function getReactiveMarkerSize(
  id: any,
  selectedIds: Set<any>,
  baseSize: number,
  highlightSize?: number
): number {
  const hasSelection = selectedIds.size > 0;

  if (!hasSelection) return baseSize;

  if (selectedIds.has(id)) {
    return highlightSize || baseSize * 1.5;
  }

  return baseSize;
}

/**
 * Create Plotly marker style with reactive properties
 *
 * @param id - Item ID
 * @param selectedIds - Set of selected IDs
 * @param baseColor - Base marker color
 * @param baseSize - Base marker size
 * @param mode - Reactive mode for unselected items
 * @returns Plotly marker style object
 */
export function createReactiveMarker(
  id: any,
  selectedIds: Set<any>,
  baseColor: string,
  baseSize: number = 8,
  mode: ReactiveStyleMode = 'dim'
) {
  const hasSelection = selectedIds.size > 0;
  const isSelected = selectedIds.has(id);

  if (!hasSelection) {
    return {
      size: baseSize,
      color: baseColor,
      opacity: 1.0,
      line: { width: 0 },
    };
  }

  if (isSelected) {
    return {
      size: baseSize * 1.2,
      color: baseColor,
      opacity: 1.0,
      line: { width: 2, color: '#fff' },
    };
  }

  // Not selected
  const opacity = getReactiveOpacity(id, selectedIds, mode);
  return {
    size: baseSize,
    color: baseColor,
    opacity,
    line: { width: 0 },
  };
}
