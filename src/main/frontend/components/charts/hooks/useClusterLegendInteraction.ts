/**
 * useClusterLegendInteraction Hook
 *
 * Provides reusable cluster-based legend interaction for Plotly charts.
 * Handles legend clicks to select/deselect entire clusters and cycle through
 * display modes for non-selected clusters.
 *
 * Features:
 * - Click cluster legend to select all categories in that cluster
 * - Cmd/Ctrl+Click for multi-select (add/remove clusters)
 * - Cycles through display modes: outline -> hidden -> deselect
 * - Synchronizes with reactive state infrastructure
 * - Works with any chart that has cluster-grouped traces
 *
 * Usage:
 * ```tsx
 * const { handleLegendClick, nonSelectedDisplayMode } = useClusterLegendInteraction({
 *   traces,
 *   categoryState,
 *   allData,
 *   getClusterIdFromCategory: (row) => getClusterIdForCategory(row.categoryId),
 * });
 *
 * <Plot
 *   data={traces}
 *   onLegendClick={handleLegendClick}
 *   ...
 * />
 * ```
 */

import { useCallback } from 'react';
import { useNonSelectedDisplayMode } from './useNonSelectedDisplayMode';

/** Type for the return value of useReactiveState hook */
export interface ReactiveStateReturn {
  selectedIds: Set<any>;
  source: string | null;
  isSelected: (id: any) => boolean;
  isAnythingSelected: boolean;
  handleSelect: (id: any, isMultiSelect: boolean, source: string) => void;
  handleMultiSelect: (ids: any[], source: string) => void;
  handleClear: () => void;
}

export interface ClusterLegendInteractionConfig<T = any> {
  /** Plotly traces array */
  traces: any[];

  /** Reactive state for category selection */
  categoryState: ReactiveStateReturn;

  /** All data items (filtered by master filter) */
  allData: T[];

  /** Function to extract cluster ID from a data row */
  getClusterIdFromCategory: (row: T) => number;

  /** Function to extract category ID from a data row */
  getCategoryId: (row: T) => string | undefined;

  /** Optional: source name for logging (default: 'chart') */
  sourceName?: string;

  /** Optional: special handler for specific legend items (e.g., Reference Space, Outliers) */
  specialLegendHandlers?: {
    [legendItemName: string]: () => boolean | void;
  };
}

/**
 * Custom hook for cluster-based legend interaction
 * Returns legend click handler and display mode state
 */
export function useClusterLegendInteraction<T = any>(
  config: ClusterLegendInteractionConfig<T>
) {
  const {
    traces,
    categoryState,
    allData,
    getClusterIdFromCategory,
    getCategoryId,
    sourceName = 'chart',
    specialLegendHandlers = {},
  } = config;

  const hasSelection = categoryState.selectedIds.size > 0;
  const [nonSelectedDisplayMode, setNonSelectedDisplayMode] = useNonSelectedDisplayMode(hasSelection);

  /**
   * Handle legend click events
   * Implements the standard cluster selection behavior
   */
  const handleLegendClick = useCallback((event: any) => {
    if (!event || event.curveNumber === undefined) {
      return false;
    }

    // Get the trace that was clicked
    const trace = traces[event.curveNumber];
    if (!trace || !trace.name) {
      return false;
    }

    // Check for special legend item handlers
    if (specialLegendHandlers[trace.name]) {
      const result = specialLegendHandlers[trace.name]();
      // If handler returns false explicitly, prevent default; otherwise allow it
      return result === false ? false : true;
    }

    // Extract cluster ID from trace name (format: "Cluster X" or "Cluster Outliers")
    const clusterMatch = trace.name.match(/Cluster (\S+)/);
    if (!clusterMatch) {
      return false; // Not a cluster trace, allow default behavior
    }

    const clusterId = clusterMatch[1];

    // Check if Cmd (Mac) or Ctrl (Windows/Linux) key is pressed for multi-select
    const isMultiSelect = event.event?.ctrlKey || event.event?.metaKey;

    console.log(`[${sourceName}] Legend clicked for cluster:`, clusterId, 'multiselect:', isMultiSelect);

    // Find all category IDs in this cluster
    const categoriesInCluster = allData
      .filter(row => {
        const rowClusterId = getClusterIdFromCategory(row);
        return String(rowClusterId) === clusterId;
      })
      .map(row => getCategoryId(row))
      .filter(Boolean) as string[];

    console.log(`[${sourceName}] Categories in cluster:`, categoriesInCluster.length);

    // Check if this cluster is currently selected
    const isClusterSelected = categoriesInCluster.some(catId => categoryState.selectedIds.has(catId));

    if (!isClusterSelected) {
      // Cluster not selected - first click selects it AND makes non-selected markers outline
      console.log(`[${sourceName}] Selecting cluster, non-selected -> outline`);
      setNonSelectedDisplayMode('outline');

      if (isMultiSelect) {
        // Multi-select: add to existing selection
        const currentSelection = Array.from(categoryState.selectedIds);
        const mergedSelection = [...new Set([...currentSelection, ...categoriesInCluster])];
        categoryState.handleMultiSelect(mergedSelection, sourceName);
      } else {
        // Single select: replace selection
        categoryState.handleMultiSelect(categoriesInCluster, sourceName);
      }
    } else {
      // Cluster is selected - cycle through: outline -> hidden -> deselect
      if (nonSelectedDisplayMode === 'outline') {
        console.log(`[${sourceName}] Switching to hidden mode`);
        setNonSelectedDisplayMode('hidden');
      } else if (nonSelectedDisplayMode === 'hidden') {
        // hidden -> deselect
        console.log(`[${sourceName}] Deselecting cluster`);
        setNonSelectedDisplayMode('full'); // Reset for next selection

        if (isMultiSelect) {
          // Multi-select: remove from selection
          const currentSelection = Array.from(categoryState.selectedIds);
          const categoriesInClusterSet = new Set(categoriesInCluster);
          const newSelection = currentSelection.filter(catId => !categoriesInClusterSet.has(String(catId)));

          if (newSelection.length > 0) {
            categoryState.handleMultiSelect(newSelection, sourceName);
          } else {
            categoryState.handleClear();
          }
        } else {
          // Single select: clear all
          categoryState.handleClear();
        }
      } else {
        // Should not happen, but if in 'full' mode, go to outline
        console.log(`[${sourceName}] Unexpected state, switching to outline mode`);
        setNonSelectedDisplayMode('outline');
      }
    }

    // Return false to prevent default legend toggle behavior
    return false;
  }, [
    traces,
    categoryState,
    allData,
    getClusterIdFromCategory,
    getCategoryId,
    nonSelectedDisplayMode,
    setNonSelectedDisplayMode,
    sourceName,
    specialLegendHandlers,
  ]);

  return {
    handleLegendClick,
    nonSelectedDisplayMode,
    setNonSelectedDisplayMode,
    hasSelection,
  };
}

/**
 * Utility function to calculate marker styling based on cluster selection state
 *
 * @param clusterId - The cluster ID for this marker
 * @param baseColor - The base color for this cluster (hex format)
 * @param isClusterSelected - Whether this cluster contains any selected categories
 * @param hasSelection - Whether any selection exists
 * @param nonSelectedDisplayMode - Current display mode for non-selected items
 * @returns Marker style properties for Plotly
 *
 * @example
 * const markerStyle = getClusterMarkerStyle(
 *   clusterId,
 *   clusterColors[clusterId],
 *   isClusterSelected,
 *   hasSelection,
 *   nonSelectedDisplayMode
 * );
 *
 * trace.marker = {
 *   size: 8,
 *   color: markerStyle.color,
 *   opacity: markerStyle.opacity,
 *   line: {
 *     width: markerStyle.lineWidth,
 *     color: markerStyle.lineColor,
 *   }
 * };
 */
export function getClusterMarkerStyle(
  clusterId: number | string,
  baseColor: string,
  isClusterSelected: boolean,
  hasSelection: boolean,
  nonSelectedDisplayMode: 'full' | 'outline' | 'hidden'
): {
  color: string;
  opacity: number;
  lineWidth: number;
  lineColor: string;
} {
  // Default styling (no selection or this cluster is selected)
  let color = baseColor;
  let opacity = 1.0;
  let lineWidth = 0;
  let lineColor = baseColor;

  // Apply styling only if there's a selection and this cluster is NOT selected
  if (hasSelection && !isClusterSelected) {
    if (nonSelectedDisplayMode === 'outline') {
      // Outline mode: transparent fill with colored border
      const rgb = [
        parseInt(baseColor.slice(1, 3), 16),
        parseInt(baseColor.slice(3, 5), 16),
        parseInt(baseColor.slice(5, 7), 16)
      ];
      color = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`;
      lineWidth = 1;
      lineColor = baseColor;
    } else if (nonSelectedDisplayMode === 'hidden') {
      // Hidden mode: set opacity to 0 but keep trace visible for legend
      opacity = 0;
    }
  }

  return {
    color,
    opacity,
    lineWidth,
    lineColor,
  };
}
