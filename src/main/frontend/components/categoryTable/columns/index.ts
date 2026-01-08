/**
 * Category Results Table - Column Definitions Index
 *
 * This file exports all column definition functions from their respective modules
 * for easy importing throughout the application.
 */

// Fixed columns (always visible)
export { getFixedColumns } from './fixedColumns';

// Primary filter columns (analysis-type dependent)
export { getPrimaryFilterColumns, getPrimaryFilterColumnKeys } from './primaryFilterColumns';

// Pre-filter columns (ANOVA, Williams, Curve Fit, etc.)
export { getPreFilterColumns } from './preFilterColumns';

// Gene count columns (legacy - will be replaced by primary filter columns)
export { getGeneCountsColumns, getSignificantANOVAColumn } from './geneCountColumns';

// Fisher's exact test columns
export { getFishersEssentialColumn, getFishersFullColumns } from './fishersColumns';

// BMD statistics columns
export {
  getBMDEssentialColumns,
  getBMDExtendedColumns,
  getBMDConfidenceColumns,
  getBMDLColumns,
  getBMDLConfidenceColumns,
  getBMDUColumns,
  getBMDUConfidenceColumns,
} from './bmdStatisticsColumns';

// Filter and percentile columns
export {
  getFilterCountsColumns,
  getPercentilesColumns,
} from './filterAndPercentileColumns';

// Directional analysis columns
export {
  getDirectionalUpColumns,
  getDirectionalDownColumns,
  getDirectionalAnalysisColumns,
} from './directionalColumns';

// Advanced analysis columns
export {
  getZScoresColumns,
  getModelFoldChangeColumns,
  getGeneListsColumns,
} from './advancedColumns';

// Fold change columns
export { getFoldChangeColumns } from './foldChangeColumns';

// Rank columns
export {
  getBMDRankColumns,
  getBMDLRankColumns,
  getBMDURankColumns,
} from './rankColumns';
