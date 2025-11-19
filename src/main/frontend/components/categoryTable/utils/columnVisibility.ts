/**
 * Category Results Table - Column Visibility Helpers
 *
 * This file contains utility functions for managing column visibility state,
 * including localStorage persistence.
 */

import { ColumnVisibility, ColumnGroup, DEFAULT_COLUMN_VISIBILITY, COLUMN_VISIBILITY_STORAGE_KEY } from './types';

/**
 * List of simple boolean column visibility fields
 */
const SIMPLE_BOOLEAN_FIELDS: (keyof ColumnVisibility)[] = [
  'geneCounts',
  'fishersFull',
  'bmdExtended',
  'bmdConfidence',
  'bmdlStats',
  'bmdlConfidence',
  'bmduStats',
  'bmduConfidence',
  'bmdRanks',
  'bmdlRanks',
  'bmduRanks',
];

/**
 * List of column group fields (ColumnGroup structure with {all, columns})
 */
const COLUMN_GROUP_FIELDS: (keyof ColumnVisibility)[] = [
  'filterCounts',
  'percentiles',
  'directionalUp',
  'directionalDown',
  'directionalAnalysis',
  'foldChange',
  'zScores',
  'modelFoldChange',
  'geneLists',
];

/**
 * Merge simple boolean fields from parsed data into merged result
 *
 * @param parsed - Parsed data from localStorage
 * @param merged - Target object to merge into
 */
function mergeSimpleBooleanFields(parsed: any, merged: ColumnVisibility): void {
  SIMPLE_BOOLEAN_FIELDS.forEach(fieldName => {
    if (typeof parsed[fieldName] === 'boolean') {
      (merged[fieldName] as boolean) = parsed[fieldName];
    }
  });
}

/**
 * Merge column group fields from parsed data into merged result
 *
 * @param parsed - Parsed data from localStorage
 * @param merged - Target object to merge into
 */
function mergeColumnGroupFields(parsed: any, merged: ColumnVisibility): void {
  COLUMN_GROUP_FIELDS.forEach(fieldName => {
    if (parsed[fieldName] && typeof parsed[fieldName] === 'object') {
      const defaultGroup = DEFAULT_COLUMN_VISIBILITY[fieldName] as ColumnGroup<any>;
      const parsedGroup = parsed[fieldName];

      (merged[fieldName] as ColumnGroup<any>) = {
        all: typeof parsedGroup.all === 'boolean' ? parsedGroup.all : defaultGroup.all,
        columns: { ...defaultGroup.columns, ...parsedGroup.columns },
      };
    }
  });
}

/**
 * Load column visibility settings from localStorage
 *
 * Merges saved settings with defaults to ensure all keys exist,
 * which handles cases where new columns are added in updates.
 * Performs deep merge for Advanced column groups with ColumnGroup structure.
 *
 * Uses helper functions to eliminate code duplication.
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

    // Start with defaults
    const merged: ColumnVisibility = { ...DEFAULT_COLUMN_VISIBILITY };

    // Merge simple boolean columns
    mergeSimpleBooleanFields(parsed, merged);

    // Merge column group fields
    mergeColumnGroupFields(parsed, merged);

    return merged;
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
 * Handles both simple boolean fields and ColumnGroup fields appropriately.
 * For boolean fields, toggles the value.
 * For ColumnGroup fields, toggles the 'all' property.
 *
 * @param current - Current visibility settings
 * @param key - The column group key to toggle
 * @returns Updated visibility settings
 */
export function toggleColumnGroup(
  current: ColumnVisibility,
  key: keyof ColumnVisibility
): ColumnVisibility {
  const currentValue = current[key];

  // Check if this is a simple boolean field
  if (typeof currentValue === 'boolean') {
    return {
      ...current,
      [key]: !currentValue,
    };
  }

  // Handle ColumnGroup type (toggle the 'all' property)
  const columnGroup = currentValue as ColumnGroup<any>;
  return {
    ...current,
    [key]: {
      ...columnGroup,
      all: !columnGroup.all,
    },
  };
}

/**
 * Show all column groups
 *
 * Uses configuration-driven approach to set all columns visible.
 *
 * @returns Visibility settings with all columns visible
 */
export function showAllColumns(): ColumnVisibility {
  const result = { ...DEFAULT_COLUMN_VISIBILITY };

  // Set all simple boolean columns to true
  SIMPLE_BOOLEAN_FIELDS.forEach(fieldName => {
    (result[fieldName] as boolean) = true;
  });

  // Set all column groups to show all columns
  COLUMN_GROUP_FIELDS.forEach(fieldName => {
    const defaultGroup = DEFAULT_COLUMN_VISIBILITY[fieldName] as ColumnGroup<any>;
    (result[fieldName] as ColumnGroup<any>) = {
      all: true,
      columns: defaultGroup.columns,
    };
  });

  return result;
}

/**
 * Hide all column groups except gene counts
 *
 * @returns Visibility settings with only gene counts visible
 */
export function hideAllColumns(): ColumnVisibility {
  return { ...DEFAULT_COLUMN_VISIBILITY };
}
