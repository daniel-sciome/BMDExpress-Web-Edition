/**
 * Category Results Table - Column Relevance by Analysis Type
 *
 * This file defines which column groups are relevant for each category analysis type.
 * Different analysis types have different meaningful columns - for example, GENE analysis
 * doesn't need gene count aggregations since each "category" is just a single gene.
 */

import type { ColumnVisibility } from './types';
import { isMultiGeneAnalysisType } from '../../../types/filterTypes';

// Re-export AnalysisType for backward compatibility
export type { AnalysisType } from '../../../types/filterTypes';

/**
 * Column groups that apply to multi-gene categories (GO, pathways, defined sets)
 * These groups represent aggregations across multiple genes in a category.
 */
const MULTI_GENE_CATEGORY_COLUMNS: (keyof ColumnVisibility)[] = [
  'primaryFilters',       // Primary filter columns (gene counts for multi-gene categories)
  'preFilters',           // Pre-filter statistics (ANOVA, Williams, Curve Fit, etc.)
  'filterCounts',         // How many genes pass various filters
  'percentiles',          // Percentile thresholds across genes
  'directionalUp',        // Statistics for up-regulated genes
  'directionalDown',      // Statistics for down-regulated genes
  'directionalAnalysis',  // Overall directional trends
  'foldChange',           // Fold change statistics across genes
  'zScores',              // Z-score statistics across genes
  'modelFoldChange',      // Model fold change statistics across genes
  'geneLists',            // Lists of genes in the category
];

/**
 * Column groups that apply to single-gene analysis (GENE type)
 * These are primarily BMD/BMDL/BMDU statistics for individual genes.
 */
const SINGLE_GENE_COLUMNS: (keyof ColumnVisibility)[] = [
  'primaryFilters',       // Primary filter columns (BMD Mean, Median for single-gene)
  'preFilters',           // Pre-filter statistics (ANOVA, Williams, Curve Fit, etc.)
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
 * Column groups that are relevant for ALL analysis types
 * These represent core BMD statistics that apply regardless of category type.
 */
const UNIVERSAL_COLUMNS: (keyof ColumnVisibility)[] = [
  'primaryFilters',       // Primary filter columns (content varies by analysis type)
  'preFilters',           // Pre-filter statistics (ANOVA, Williams, Curve Fit, etc.)
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
 * Determine which column groups are relevant for a given analysis type
 *
 * @param analysisType - The type of category analysis
 * @returns Array of column group keys that are relevant for this analysis type
 */
export function getRelevantColumns(analysisType: string | null): (keyof ColumnVisibility)[] {
  // Multi-gene analysis types get all columns
  if (isMultiGeneAnalysisType(analysisType)) {
    return [...UNIVERSAL_COLUMNS, ...MULTI_GENE_CATEGORY_COLUMNS];
  }

  // Single-gene analysis (GENE type) - only single-gene columns are relevant
  // Gene counts, aggregations, and gene lists don't make sense when each row IS a gene
  return SINGLE_GENE_COLUMNS;
}

/**
 * Check if a specific column group is relevant for the given analysis type
 *
 * @param columnKey - The column group key to check
 * @param analysisType - The type of category analysis
 * @returns true if the column is relevant, false otherwise
 */
export function isColumnRelevant(
  columnKey: keyof ColumnVisibility,
  analysisType: string | null
): boolean {
  const relevantColumns = getRelevantColumns(analysisType);
  return relevantColumns.includes(columnKey);
}

/**
 * Filter column visibility settings to only include relevant columns for the analysis type
 *
 * This is useful for:
 * - Hiding irrelevant columns in the UI
 * - Preventing users from showing columns that don't make sense
 * - Improving performance by not rendering unnecessary columns
 *
 * @param visibility - Current column visibility settings
 * @param analysisType - The type of category analysis
 * @returns Filtered visibility settings with irrelevant columns hidden
 */
export function filterRelevantColumns(
  visibility: ColumnVisibility,
  analysisType: string | null
): ColumnVisibility {
  const relevantColumns = getRelevantColumns(analysisType);
  const filtered = { ...visibility };

  // Hide all irrelevant columns
  (Object.keys(filtered) as (keyof ColumnVisibility)[]).forEach((key) => {
    if (!relevantColumns.includes(key)) {
      const value = filtered[key];

      // Handle both boolean and ColumnGroup types
      if (typeof value === 'boolean') {
        filtered[key] = false as any;
      } else if (typeof value === 'object' && value !== null) {
        // Hide the entire group
        filtered[key] = { ...value, all: false } as any;
      }
    }
  });

  return filtered;
}

/**
 * Get a human-readable explanation of why certain columns are hidden
 *
 * @param analysisType - The type of category analysis
 * @returns Explanation text for the user
 */
export function getColumnRelevanceExplanation(analysisType: string | null): string {
  if (isMultiGeneAnalysisType(analysisType)) {
    return 'All applicable columns are available for this category type.';
  }

  return 'Gene-level analysis: Category aggregation columns (gene counts, gene lists, etc.) are hidden because each row represents a single gene.';
}
