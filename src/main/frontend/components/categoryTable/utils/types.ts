/**
 * Category Results Table - Type Definitions
 *
 * This file contains all types and interfaces used by the CategoryResultsGrid component.
 */

/**
 * Individual column group with master toggle
 */
export interface ColumnGroup<T extends string> {
  /** Master toggle - enables/disables all columns in the group */
  all: boolean;
  /** Individual column visibility flags */
  columns: Record<T, boolean>;
}

/**
 * Column visibility state interface
 *
 * Controls which column groups and individual columns are visible in the table.
 * Essential and Statistics columns use simple boolean toggles.
 * Advanced columns use ColumnGroup structure for individual column control.
 */
export interface ColumnVisibility {
  /** Gene Counts columns (Passed, All, %) */
  geneCounts: boolean;

  /** Fisher's Exact Test columns (7 columns: A, B, C, D, Left P, Right P, Two-Tail P) */
  fishersFull: boolean;

  /** Extended BMD Statistics columns (Mean, Median, Min, SD, Weighted Mean, Weighted SD) */
  bmdExtended: boolean;

  /** BMD 95% Confidence Interval columns (Lower, Upper) */
  bmdConfidence: boolean;

  /** BMDL Statistics columns (Mean, Median, Min, SD, Weighted Mean, Weighted SD) */
  bmdlStats: boolean;

  /** BMDL 95% Confidence Interval columns (Lower, Upper) */
  bmdlConfidence: boolean;

  /** BMDU Statistics columns (Mean, Median, Min, SD, Weighted Mean, Weighted SD) */
  bmduStats: boolean;

  /** BMDU 95% Confidence Interval columns (Lower, Upper) */
  bmduConfidence: boolean;

  /** Filter Counts columns - individual selection */
  filterCounts: ColumnGroup<
    | 'bmdLessEqualHighDose'
    | 'bmdPValueGreaterEqual'
    | 'foldChangeAbove'
    | 'rSquared'
    | 'bmdBmdlRatio'
    | 'bmduBmdlRatio'
    | 'bmduBmdRatio'
    | 'nFoldBelow'
    | 'prefilterPValue'
    | 'prefilterAdjustedPValue'
    | 'notStepFunction'
    | 'notStepFunctionBMDL'
    | 'notAdverse'
    | 'absZScore'
    | 'absModelFC'
  >;

  /** Percentile columns - individual selection */
  percentiles: ColumnGroup<
    | 'bmd5th'
    | 'bmd10th'
    | 'bmdl5th'
    | 'bmdl10th'
    | 'bmdu5th'
    | 'bmdu10th'
  >;

  /** Directional Up statistics - individual selection */
  directionalUp: ColumnGroup<
    | 'bmdMean'
    | 'bmdMedian'
    | 'bmdSD'
    | 'bmdlMean'
    | 'bmdlMedian'
    | 'bmdlSD'
    | 'bmduMean'
    | 'bmduMedian'
    | 'bmduSD'
  >;

  /** Directional Down statistics - individual selection */
  directionalDown: ColumnGroup<
    | 'bmdMean'
    | 'bmdMedian'
    | 'bmdSD'
    | 'bmdlMean'
    | 'bmdlMedian'
    | 'bmdlSD'
    | 'bmduMean'
    | 'bmduMedian'
    | 'bmduSD'
  >;

  /** Directional Analysis - individual selection */
  directionalAnalysis: ColumnGroup<
    | 'overallDirection'
    | 'percentUP'
    | 'percentDOWN'
    | 'percentConflict'
  >;

  /** Fold Change statistics - individual selection */
  foldChange: ColumnGroup<
    | 'total'
    | 'mean'
    | 'median'
    | 'max'
    | 'min'
    | 'stdDev'
  >;

  /** Z-Score statistics - individual selection */
  zScores: ColumnGroup<
    | 'min'
    | 'median'
    | 'max'
    | 'mean'
  >;

  /** Model Fold Change statistics - individual selection */
  modelFoldChange: ColumnGroup<
    | 'min'
    | 'median'
    | 'max'
    | 'mean'
  >;

  /** Gene Lists - individual selection */
  geneLists: ColumnGroup<
    | 'genes'
    | 'geneSymbols'
    | 'bmdList'
    | 'bmdlList'
    | 'bmduList'
  >;
}

/**
 * Default column visibility settings
 *
 * By default, only show Gene Counts columns to avoid overwhelming users
 * with many columns. Users can expand column groups as needed.
 */
export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  geneCounts: true,
  fishersFull: false,
  bmdExtended: false,
  bmdConfidence: false,
  bmdlStats: false,
  bmdlConfidence: false,
  bmduStats: false,
  bmduConfidence: false,
  filterCounts: {
    all: false,
    columns: {
      bmdLessEqualHighDose: false,
      bmdPValueGreaterEqual: false,
      foldChangeAbove: false,
      rSquared: false,
      bmdBmdlRatio: false,
      bmduBmdlRatio: false,
      bmduBmdRatio: false,
      nFoldBelow: false,
      prefilterPValue: false,
      prefilterAdjustedPValue: false,
      notStepFunction: false,
      notStepFunctionBMDL: false,
      notAdverse: false,
      absZScore: false,
      absModelFC: false,
    },
  },
  percentiles: {
    all: false,
    columns: {
      bmd5th: false,
      bmd10th: false,
      bmdl5th: false,
      bmdl10th: false,
      bmdu5th: false,
      bmdu10th: false,
    },
  },
  directionalUp: {
    all: false,
    columns: {
      bmdMean: false,
      bmdMedian: false,
      bmdSD: false,
      bmdlMean: false,
      bmdlMedian: false,
      bmdlSD: false,
      bmduMean: false,
      bmduMedian: false,
      bmduSD: false,
    },
  },
  directionalDown: {
    all: false,
    columns: {
      bmdMean: false,
      bmdMedian: false,
      bmdSD: false,
      bmdlMean: false,
      bmdlMedian: false,
      bmdlSD: false,
      bmduMean: false,
      bmduMedian: false,
      bmduSD: false,
    },
  },
  directionalAnalysis: {
    all: false,
    columns: {
      overallDirection: false,
      percentUP: false,
      percentDOWN: false,
      percentConflict: false,
    },
  },
  foldChange: {
    all: false,
    columns: {
      total: false,
      mean: false,
      median: false,
      max: false,
      min: false,
      stdDev: false,
    },
  },
  zScores: {
    all: false,
    columns: {
      min: false,
      median: false,
      max: false,
      mean: false,
    },
  },
  modelFoldChange: {
    all: false,
    columns: {
      min: false,
      median: false,
      max: false,
      mean: false,
    },
  },
  geneLists: {
    all: false,
    columns: {
      genes: false,
      geneSymbols: false,
      bmdList: false,
      bmdlList: false,
      bmduList: false,
    },
  },
};

/**
 * localStorage key for persisting column visibility preferences
 */
export const COLUMN_VISIBILITY_STORAGE_KEY = 'categoryTable_visibleColumns';
