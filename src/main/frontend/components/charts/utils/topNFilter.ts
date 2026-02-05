/**
 * Top N Filtering Utilities
 *
 * Provides display-mode-aware Top N filtering for charts.
 * In isolate mode, Top N is computed from focused items only.
 * In other modes, Top N is computed from all items.
 */

import type { DisplayMode } from 'Frontend/types/visibilityTypes';
import { computeTopNWithRank, type WithBmdRank } from './bmdRankUtils';

/**
 * Item with inFocus state (matches CategoryWithFocus pattern)
 */
interface FocusableItem {
  inFocus: boolean;
}

/**
 * Get the effective data source for Top N computation based on display mode.
 *
 * In 'isolate' mode: returns only inFocus items (Top N of focused subset)
 * In other modes: returns all items (Top N of everything)
 *
 * @param data - Array of items with inFocus property
 * @param displayMode - Current display mode ('highlight' | 'dim' | 'isolate')
 * @returns Filtered data to use for Top N computation
 *
 * @example
 * ```tsx
 * const { data, displayMode } = useFocusAwareStyling();
 *
 * const topCategories = useMemo(() => {
 *   const sourceData = getTopNSourceData(data, displayMode);
 *
 *   const validData = sourceData.filter(row => row.bmdMedian != null);
 *   const sorted = [...validData].sort((a, b) => a.bmdMedian - b.bmdMedian);
 *   return sorted.slice(0, topN);
 * }, [data, displayMode, topN]);
 * ```
 */
export function getTopNSourceData<T extends FocusableItem>(
  data: T[],
  displayMode: DisplayMode
): T[] {
  if (displayMode === 'isolate') {
    return data.filter(item => item.inFocus);
  }
  return data;
}

/**
 * Compute Top N items with display-mode-aware filtering.
 *
 * This is a convenience function that combines:
 * 1. Display mode filtering (isolate mode uses only focused items)
 * 2. Custom validation filter
 * 3. Sorting
 * 4. Top N slicing
 *
 * @param data - Array of items with inFocus property
 * @param displayMode - Current display mode
 * @param options - Configuration options
 * @returns Top N items after all filtering and sorting
 *
 * @example
 * ```tsx
 * const topCategories = useMemo(() => computeTopN(
 *   data,
 *   displayMode,
 *   {
 *     n: topN,
 *     isValid: (row) => row.bmdMedian != null && row.bmdMedian > 0,
 *     sortBy: (a, b) => (a.bmdMedian ?? Infinity) - (b.bmdMedian ?? Infinity),
 *   }
 * ), [data, displayMode, topN]);
 * ```
 */
export function computeTopN<T extends FocusableItem>(
  data: T[],
  displayMode: DisplayMode,
  options: {
    /** Number of items to return, or 'All' for no limit */
    n: number | 'All';
    /** Filter function to validate items (e.g., has required fields) */
    isValid: (item: T) => boolean;
    /** Sort comparator (applied before taking Top N) */
    sortBy: (a: T, b: T) => number;
  }
): T[] {
  const { n, isValid, sortBy } = options;

  // Step 1: Get source data based on display mode
  const sourceData = getTopNSourceData(data, displayMode);

  // Step 2: Filter to valid items
  const validData = sourceData.filter(isValid);

  // Step 3: Sort
  const sorted = [...validData].sort(sortBy);

  // Step 4: Take Top N
  if (n === 'All') {
    return sorted;
  }
  return sorted.slice(0, n);
}

/**
 * Compute Top N items with BMD rank, respecting display mode.
 *
 * Combines:
 * 1. Display mode filtering (isolate mode uses only focused items)
 * 2. BMD-based ranking (rank 1 = smallest value)
 * 3. Top N slicing
 *
 * @param data - Array of items with inFocus property
 * @param displayMode - Current display mode
 * @param getValue - Function to extract BMD value for ranking
 * @param n - Number of items to return, or 'All'
 * @returns Top N items with bmdRank property attached
 *
 * @example
 * ```tsx
 * const topCategories = useMemo(() => computeTopNRanked(
 *   data,
 *   displayMode,
 *   (row) => bmd.getValue(row),
 *   topN
 * ), [data, displayMode, bmd, topN]);
 *
 * // topCategories[0].bmdRank === 1 (smallest BMD in the filtered set)
 * ```
 */
export function computeTopNRanked<T extends FocusableItem>(
  data: T[],
  displayMode: DisplayMode,
  getValue: (item: any) => number | undefined | null,
  n: number | 'All'
): WithBmdRank<T>[] {
  // Step 1: Get source data based on display mode
  const sourceData = getTopNSourceData(data, displayMode);

  // Step 2: Compute rank and take Top N
  return computeTopNWithRank(sourceData, getValue, n);
}

// Re-export for convenience
export { computeBmdRank, computeTopNWithRank, type WithBmdRank } from './bmdRankUtils';
