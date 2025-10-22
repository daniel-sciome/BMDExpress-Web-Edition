/**
 * Category Results Table - Column Visibility Helpers
 *
 * This file contains utility functions for managing column visibility state,
 * including localStorage persistence.
 */

import { ColumnVisibility, DEFAULT_COLUMN_VISIBILITY, COLUMN_VISIBILITY_STORAGE_KEY } from './types';

/**
 * Load column visibility settings from localStorage
 *
 * Merges saved settings with defaults to ensure all keys exist,
 * which handles cases where new columns are added in updates.
 *
 * @returns Column visibility settings
 */
export function loadColumnVisibility(): ColumnVisibility {
  const saved = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);

  if (!saved) {
    return { ...DEFAULT_COLUMN_VISIBILITY };
  }

  try {
    const parsed = JSON.parse(saved);
    // Merge with defaults to ensure all keys exist (in case we added new columns)
    return { ...DEFAULT_COLUMN_VISIBILITY, ...parsed };
  } catch (e) {
    console.error('Failed to parse saved column visibility:', e);
    return { ...DEFAULT_COLUMN_VISIBILITY };
  }
}

/**
 * Save column visibility settings to localStorage
 *
 * @param visibility - Column visibility settings to save
 */
export function saveColumnVisibility(visibility: ColumnVisibility): void {
  try {
    localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(visibility));
  } catch (e) {
    console.error('Failed to save column visibility:', e);
  }
}

/**
 * Reset column visibility to default settings
 *
 * @returns Default column visibility settings
 */
export function resetColumnVisibility(): ColumnVisibility {
  const defaults = { ...DEFAULT_COLUMN_VISIBILITY };
  saveColumnVisibility(defaults);
  return defaults;
}

/**
 * Toggle a specific column group visibility
 *
 * @param current - Current visibility settings
 * @param key - The column group key to toggle
 * @returns Updated visibility settings
 */
export function toggleColumnGroup(
  current: ColumnVisibility,
  key: keyof ColumnVisibility
): ColumnVisibility {
  return {
    ...current,
    [key]: !current[key],
  };
}

/**
 * Show all column groups
 *
 * @returns Visibility settings with all columns visible
 */
export function showAllColumns(): ColumnVisibility {
  return {
    geneCounts: true,
    fishersFull: true,
    bmdExtended: true,
    bmdlStats: true,
    bmduStats: true,
    filterCounts: true,
    percentiles: true,
    directionalUp: true,
    directionalDown: true,
    directionalAnalysis: true,
    zScores: true,
    modelFoldChange: true,
    geneLists: true,
  };
}

/**
 * Hide all column groups except gene counts
 *
 * @returns Visibility settings with only gene counts visible
 */
export function hideAllColumns(): ColumnVisibility {
  return { ...DEFAULT_COLUMN_VISIBILITY };
}
