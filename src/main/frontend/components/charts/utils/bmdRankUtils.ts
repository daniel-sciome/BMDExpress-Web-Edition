/**
 * BMD Rank Utilities
 *
 * Provides utilities for computing BMD-based rankings.
 * Rank 1 = smallest BMD value (most sensitive pathway).
 */

/**
 * Item with BMD rank attached
 */
export type WithBmdRank<T> = T & { bmdRank: number };

/**
 * Compute BMD rank for each item in a dataset.
 * Rank 1 is assigned to the item with the smallest value (most sensitive).
 *
 * @param data - Array of items to rank
 * @param getValue - Function to extract the ranking value from each item
 * @param options - Optional configuration
 * @returns New array with bmdRank property added to each item
 *
 * @example
 * ```tsx
 * const rankedData = computeBmdRank(
 *   categories,
 *   (cat) => bmd.getValue(cat)
 * );
 * // rankedData[0].bmdRank === 1 (smallest BMD)
 * ```
 */
export function computeBmdRank<T>(
  data: T[],
  getValue: (item: any) => number | undefined | null,
  options?: {
    /** Filter out items where getValue returns null/undefined/non-positive. Default: true */
    filterInvalid?: boolean;
  }
): WithBmdRank<T>[] {
  const { filterInvalid = true } = options ?? {};

  // Filter to valid items if requested
  const validData = filterInvalid
    ? data.filter(item => {
        const val = getValue(item);
        return val != null && val > 0 && isFinite(val);
      })
    : data;

  // Sort by value ascending (smallest = rank 1)
  const sorted = [...validData].sort((a, b) => {
    const valA = getValue(a) ?? Infinity;
    const valB = getValue(b) ?? Infinity;
    return valA - valB;
  });

  // Assign ranks (1-based)
  return sorted.map((item, index) => ({
    ...item,
    bmdRank: index + 1,
  }));
}

/**
 * Compute BMD rank and take Top N items.
 * Combines ranking with Top N selection in a single operation.
 *
 * @param data - Array of items to rank
 * @param getValue - Function to extract the ranking value
 * @param n - Number of items to return, or 'All'
 * @returns Top N items with bmdRank property (rank 1 = smallest BMD)
 *
 * @example
 * ```tsx
 * const top20 = computeTopNWithRank(
 *   categories,
 *   (cat) => bmd.getValue(cat),
 *   20
 * );
 * // top20[0].bmdRank === 1, top20[19].bmdRank === 20
 * ```
 */
export function computeTopNWithRank<T>(
  data: T[],
  getValue: (item: any) => number | undefined | null,
  n: number | 'All'
): WithBmdRank<T>[] {
  const ranked = computeBmdRank(data, getValue);

  if (n === 'All') {
    return ranked;
  }

  return ranked.slice(0, n);
}
