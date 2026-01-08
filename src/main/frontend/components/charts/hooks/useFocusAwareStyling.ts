/**
 * useFocusAwareStyling Hook
 *
 * Provides focus-aware styling for Plotly charts based on the inFocus state
 * and global displayMode (highlight/dim/isolate).
 *
 * This hook centralizes the styling logic to avoid code duplication across
 * chart components (UmapScatterPlot, AccumulationCharts, BMDvsBMDLScatter, etc.)
 */

import { useMemo, useCallback } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { selectSortedDataWithFocus } from '../../../store/slices/categoryResultsSlice';
import type { CategoryWithFocus } from '../../../types/categoryTypes';
import { selectDisplayMode } from '../../../store/slices/visibilitySlice';
import { getMarkerStyleByFocus, type MarkerStyle } from '../utils/displayModeStyles';
import type { DisplayMode } from '../../../types/visibilityTypes';

/**
 * Input for building marker style arrays - one entry per point
 */
export interface PointStyleInput {
  inFocus: boolean;
  color: string;
}

/**
 * Output arrays for Plotly marker styling
 */
export interface MarkerArrays {
  colors: string[];
  opacities: number[];
  sizes: number[];
  lineWidths: number[];
  lineColors: string[];
}

/**
 * Result returned by the useFocusAwareStyling hook
 */
export interface FocusAwareStylingResult {
  /** All data with inFocus boolean (not filtered) */
  data: CategoryWithFocus[];
  /** Current display mode from Redux */
  displayMode: DisplayMode;
  /** Get marker style for a single point */
  getPointStyle: (inFocus: boolean, baseColor: string, options?: {
    focusedSize?: number;
    normalSize?: number;
  }) => MarkerStyle;
  /** Build Plotly marker arrays for a list of points */
  buildMarkerArrays: (points: PointStyleInput[], options?: {
    focusedSize?: number;
    normalSize?: number;
  }) => MarkerArrays;
  /** Check if isolate mode should hide a point */
  shouldHidePoint: (inFocus: boolean) => boolean;
}

/**
 * Hook that provides focus-aware styling utilities for Plotly charts.
 *
 * Usage:
 * ```tsx
 * const { data, displayMode, getPointStyle, buildMarkerArrays } = useFocusAwareStyling();
 *
 * // For single point styling:
 * const style = getPointStyle(row.inFocus, clusterColor);
 *
 * // For building per-point arrays:
 * const points = data.map(row => ({ inFocus: row.inFocus, color: getColor(row) }));
 * const { colors, opacities, sizes, lineWidths, lineColors } = buildMarkerArrays(points);
 * ```
 */
export function useFocusAwareStyling(): FocusAwareStylingResult {
  const data = useAppSelector(selectSortedDataWithFocus);
  const displayMode = useAppSelector(selectDisplayMode);

  /**
   * Get marker style for a single point based on its inFocus state
   */
  const getPointStyle = useCallback(
    (inFocus: boolean, baseColor: string, options?: {
      focusedSize?: number;
      normalSize?: number;
    }): MarkerStyle => {
      return getMarkerStyleByFocus(inFocus, displayMode, baseColor, options);
    },
    [displayMode]
  );

  /**
   * Build Plotly-compatible marker arrays for a list of points.
   * Returns arrays that can be spread into Plotly trace marker config.
   */
  const buildMarkerArrays = useCallback(
    (points: PointStyleInput[], options?: {
      focusedSize?: number;
      normalSize?: number;
    }): MarkerArrays => {
      const colors: string[] = [];
      const opacities: number[] = [];
      const sizes: number[] = [];
      const lineWidths: number[] = [];
      const lineColors: string[] = [];

      for (const point of points) {
        const style = getMarkerStyleByFocus(
          point.inFocus,
          displayMode,
          point.color,
          options
        );

        colors.push(style.color);
        opacities.push(style.opacity);
        sizes.push(style.size);
        lineWidths.push(style.lineWidth);
        lineColors.push(style.lineColor);
      }

      return { colors, opacities, sizes, lineWidths, lineColors };
    },
    [displayMode]
  );

  /**
   * Check if a point should be hidden based on displayMode and inFocus.
   * In 'isolate' mode, out-of-focus points are hidden.
   */
  const shouldHidePoint = useCallback(
    (inFocus: boolean): boolean => {
      return displayMode === 'isolate' && !inFocus;
    },
    [displayMode]
  );

  return useMemo(
    () => ({
      data,
      displayMode,
      getPointStyle,
      buildMarkerArrays,
      shouldHidePoint,
    }),
    [data, displayMode, getPointStyle, buildMarkerArrays, shouldHidePoint]
  );
}

export default useFocusAwareStyling;
