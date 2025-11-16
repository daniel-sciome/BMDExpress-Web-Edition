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
 * Performs deep merge for Advanced column groups with ColumnGroup structure.
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

    // Deep merge for Advanced column groups (which have {all, columns} structure)
    const merged: ColumnVisibility = { ...DEFAULT_COLUMN_VISIBILITY };

    // Simple boolean columns (Essential and Statistics)
    if (typeof parsed.geneCounts === 'boolean') merged.geneCounts = parsed.geneCounts;
    if (typeof parsed.fishersFull === 'boolean') merged.fishersFull = parsed.fishersFull;
    if (typeof parsed.bmdExtended === 'boolean') merged.bmdExtended = parsed.bmdExtended;
    if (typeof parsed.bmdConfidence === 'boolean') merged.bmdConfidence = parsed.bmdConfidence;
    if (typeof parsed.bmdlStats === 'boolean') merged.bmdlStats = parsed.bmdlStats;
    if (typeof parsed.bmdlConfidence === 'boolean') merged.bmdlConfidence = parsed.bmdlConfidence;
    if (typeof parsed.bmduStats === 'boolean') merged.bmduStats = parsed.bmduStats;
    if (typeof parsed.bmduConfidence === 'boolean') merged.bmduConfidence = parsed.bmduConfidence;

    // ColumnGroup structure columns (Advanced groups)
    if (parsed.filterCounts && typeof parsed.filterCounts === 'object') {
      merged.filterCounts = {
        all: typeof parsed.filterCounts.all === 'boolean' ? parsed.filterCounts.all : DEFAULT_COLUMN_VISIBILITY.filterCounts.all,
        columns: { ...DEFAULT_COLUMN_VISIBILITY.filterCounts.columns, ...parsed.filterCounts.columns }
      };
    }

    if (parsed.percentiles && typeof parsed.percentiles === 'object') {
      merged.percentiles = {
        all: typeof parsed.percentiles.all === 'boolean' ? parsed.percentiles.all : DEFAULT_COLUMN_VISIBILITY.percentiles.all,
        columns: { ...DEFAULT_COLUMN_VISIBILITY.percentiles.columns, ...parsed.percentiles.columns }
      };
    }

    if (parsed.directionalUp && typeof parsed.directionalUp === 'object') {
      merged.directionalUp = {
        all: typeof parsed.directionalUp.all === 'boolean' ? parsed.directionalUp.all : DEFAULT_COLUMN_VISIBILITY.directionalUp.all,
        columns: { ...DEFAULT_COLUMN_VISIBILITY.directionalUp.columns, ...parsed.directionalUp.columns }
      };
    }

    if (parsed.directionalDown && typeof parsed.directionalDown === 'object') {
      merged.directionalDown = {
        all: typeof parsed.directionalDown.all === 'boolean' ? parsed.directionalDown.all : DEFAULT_COLUMN_VISIBILITY.directionalDown.all,
        columns: { ...DEFAULT_COLUMN_VISIBILITY.directionalDown.columns, ...parsed.directionalDown.columns }
      };
    }

    if (parsed.directionalAnalysis && typeof parsed.directionalAnalysis === 'object') {
      merged.directionalAnalysis = {
        all: typeof parsed.directionalAnalysis.all === 'boolean' ? parsed.directionalAnalysis.all : DEFAULT_COLUMN_VISIBILITY.directionalAnalysis.all,
        columns: { ...DEFAULT_COLUMN_VISIBILITY.directionalAnalysis.columns, ...parsed.directionalAnalysis.columns }
      };
    }

    if (parsed.foldChange && typeof parsed.foldChange === 'object') {
      merged.foldChange = {
        all: typeof parsed.foldChange.all === 'boolean' ? parsed.foldChange.all : DEFAULT_COLUMN_VISIBILITY.foldChange.all,
        columns: { ...DEFAULT_COLUMN_VISIBILITY.foldChange.columns, ...parsed.foldChange.columns }
      };
    }

    if (parsed.zScores && typeof parsed.zScores === 'object') {
      merged.zScores = {
        all: typeof parsed.zScores.all === 'boolean' ? parsed.zScores.all : DEFAULT_COLUMN_VISIBILITY.zScores.all,
        columns: { ...DEFAULT_COLUMN_VISIBILITY.zScores.columns, ...parsed.zScores.columns }
      };
    }

    if (parsed.modelFoldChange && typeof parsed.modelFoldChange === 'object') {
      merged.modelFoldChange = {
        all: typeof parsed.modelFoldChange.all === 'boolean' ? parsed.modelFoldChange.all : DEFAULT_COLUMN_VISIBILITY.modelFoldChange.all,
        columns: { ...DEFAULT_COLUMN_VISIBILITY.modelFoldChange.columns, ...parsed.modelFoldChange.columns }
      };
    }

    if (parsed.geneLists && typeof parsed.geneLists === 'object') {
      merged.geneLists = {
        all: typeof parsed.geneLists.all === 'boolean' ? parsed.geneLists.all : DEFAULT_COLUMN_VISIBILITY.geneLists.all,
        columns: { ...DEFAULT_COLUMN_VISIBILITY.geneLists.columns, ...parsed.geneLists.columns }
      };
    }

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
    // Simple boolean columns
    geneCounts: true,
    fishersFull: true,
    bmdExtended: true,
    bmdConfidence: true,
    bmdlStats: true,
    bmdlConfidence: true,
    bmduStats: true,
    bmduConfidence: true,

    // Advanced groups - set all: true to show all columns
    filterCounts: {
      all: true,
      columns: DEFAULT_COLUMN_VISIBILITY.filterCounts.columns,
    },
    percentiles: {
      all: true,
      columns: DEFAULT_COLUMN_VISIBILITY.percentiles.columns,
    },
    directionalUp: {
      all: true,
      columns: DEFAULT_COLUMN_VISIBILITY.directionalUp.columns,
    },
    directionalDown: {
      all: true,
      columns: DEFAULT_COLUMN_VISIBILITY.directionalDown.columns,
    },
    directionalAnalysis: {
      all: true,
      columns: DEFAULT_COLUMN_VISIBILITY.directionalAnalysis.columns,
    },
    foldChange: {
      all: true,
      columns: DEFAULT_COLUMN_VISIBILITY.foldChange.columns,
    },
    zScores: {
      all: true,
      columns: DEFAULT_COLUMN_VISIBILITY.zScores.columns,
    },
    modelFoldChange: {
      all: true,
      columns: DEFAULT_COLUMN_VISIBILITY.modelFoldChange.columns,
    },
    geneLists: {
      all: true,
      columns: DEFAULT_COLUMN_VISIBILITY.geneLists.columns,
    },
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
