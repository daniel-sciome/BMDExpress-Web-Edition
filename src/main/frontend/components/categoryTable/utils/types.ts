/**
 * Category Results Table - Type Definitions
 *
 * This file contains all types and interfaces used by the CategoryResultsGrid component.
 */

/**
 * Column visibility state interface
 *
 * Controls which column groups are visible in the table.
 * Each boolean flag corresponds to a group of related columns.
 */
export interface ColumnVisibility {
  /** Gene Counts columns (Passed, All, %) */
  geneCounts: boolean;

  /** Fisher's Exact Test columns (7 columns: A, B, C, D, Left P, Right P, Two-Tail P) */
  fishersFull: boolean;

  /** Extended BMD Statistics columns (Mean, Median, Min, SD, Weighted Mean, Weighted SD) */
  bmdExtended: boolean;

  /** BMDL Statistics columns (Mean, Median, Min, SD, Weighted Mean, Weighted SD) */
  bmdlStats: boolean;

  /** BMDU Statistics columns (Mean, Median, Min, SD, Weighted Mean, Weighted SD) */
  bmduStats: boolean;

  /** Filter Counts columns (Prefilter, Not Passing P-Value, Fold Change, BMD Ratio) */
  filterCounts: boolean;

  /** Percentile columns (5th, 10th, 95th for BMD/BMDL/BMDU) */
  percentiles: boolean;

  /** Directional Up statistics (# Genes Up, Mean, Median, Min, Max, SD) */
  directionalUp: boolean;

  /** Directional Down statistics (# Genes Down, Mean, Median, Min, Max, SD) */
  directionalDown: boolean;

  /** Directional Analysis (# Conflicting, % Up, % Down) */
  directionalAnalysis: boolean;

  /** Z-Score statistics (Mean, Median, Min, Max) */
  zScores: boolean;

  /** Model Fold Change statistics (Mean, Median, Min, Max, SD) */
  modelFoldChange: boolean;

  /** Gene Lists (Entrez IDs, Gene Symbols, Probe IDs) */
  geneLists: boolean;
}

/**
 * Default column visibility settings
 *
 * By default, only show Gene Counts columns to avoid overwhelming users
 * with 94 columns. Users can expand column groups as needed.
 */
export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  geneCounts: true,
  fishersFull: false,
  bmdExtended: false,
  bmdlStats: false,
  bmduStats: false,
  filterCounts: false,
  percentiles: false,
  directionalUp: false,
  directionalDown: false,
  directionalAnalysis: false,
  zScores: false,
  modelFoldChange: false,
  geneLists: false,
};

/**
 * localStorage key for persisting column visibility preferences
 */
export const COLUMN_VISIBILITY_STORAGE_KEY = 'categoryTable_visibleColumns';
