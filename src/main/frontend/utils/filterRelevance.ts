/**
 * Primary Filter Relevance by Analysis Type
 *
 * This file defines which filter fields are relevant for each category analysis type.
 * Different analysis types have different meaningful filters - for example, GENE analysis
 * doesn't need gene count filters since each "category" is just a single gene.
 */

import type { FilterableFieldName } from '../types/filterTypes';
import { isMultiGeneAnalysisType } from '../types/filterTypes';

// Re-export AnalysisType for backward compatibility
export type { AnalysisType } from '../types/filterTypes';

/**
 * Filter fields that apply to single-gene analysis (GENE type)
 * These represent properties of a single gene.
 */
const SINGLE_GENE_FILTERS: FilterableFieldName[] = [
  // Core BMD statistics for the gene
  'bmdMean',
  'bmdMedian',
  'bmdMinimum',
  'bmdSD',
  'bmdWMean',
  'bmdWSD',
  'bmdLower95',
  'bmdUpper95',
  // BMDL statistics
  'bmdlMean',
  'bmdlMedian',
  'bmdlMinimum',
  'bmdlSD',
  'bmdlWMean',
  'bmdlWSD',
  'bmdlLower95',
  'bmdlUpper95',
  // BMDU statistics
  'bmduMean',
  'bmduMedian',
  'bmduMinimum',
  'bmduSD',
  'bmduWMean',
  'bmduWSD',
  'bmduLower95',
  'bmduUpper95',
  // Fisher's test for the gene
  'fishersExactLeftPValue',
  'fishersExactRightPValue',
  'fishersExactTwoTailPValue',
];

/**
 * Filter fields that only make sense for multi-gene categories
 * These represent aggregations or counts across multiple genes.
 */
const MULTI_GENE_CATEGORY_FILTERS: FilterableFieldName[] = [
  // Gene counts - only meaningful when a category contains multiple genes
  'geneAllCount',
  'geneCountSignificantANOVA',
  'genesThatPassedAllFilters',
  'percentage',
  // Filter result counts - how many genes meet various criteria
  'genesWithBMDLessEqualHighDose',
  'genesWithBMDpValueGreaterEqualValue',
  'genesWithFoldChangeAboveValue',
  'genesWithBMDRSquaredValueGreaterEqualValue',
  'genesWithBMDBMDLRatioBelowValue',
  'genesWithBMDUBMDLRatioBelowValue',
  'genesWithBMDUBMDRatioBelowValue',
  'genesWithNFoldBelowLowPostiveDoseValue',
  'genesWithPrefilterPValueAboveValue',
  'genesWithPrefilterAdjustedPValueAboveValue',
  'genesNotStepFunction',
  'genesNotStepFunctionWithBMDLower',
  'genesNotAdverseDirection',
  'genesWithABSZScoreAboveValue',
  'genesWithABSModelFCAboveValue',
  // Fold change aggregations across genes
  'totalFoldChange',
  'meanFoldChange',
  'medianFoldChange',
  'maxFoldChange',
  'minFoldChange',
  'stdDevFoldChange',
  // Z-score aggregations across genes
  'minZScore',
  'medianZScore',
  'maxZScore',
  'meanZScore',
  // Model fold change aggregations
  'minModelFoldChange',
  'medianModelFoldChange',
  'maxModelFoldChange',
  'meanModelFoldChange',
  // Directional analysis - requires multiple genes
  'overallDirection',
  'percentWithOverallDirectionUP',
  'percentWithOverallDirectionDOWN',
  'percentWithOverallDirectionConflict',
  // Directional BMD statistics - for genes grouped by direction
  'genesUpBMDMean',
  'genesUpBMDMedian',
  'genesUpBMDSD',
  'genesUpBMDLMean',
  'genesUpBMDLMedian',
  'genesUpBMDLSD',
  'genesUpBMDUMean',
  'genesUpBMDUMedian',
  'genesUpBMDUSD',
  'genesDownBMDMean',
  'genesDownBMDMedian',
  'genesDownBMDSD',
  'genesDownBMDLMean',
  'genesDownBMDLMedian',
  'genesDownBMDLSD',
  'genesDownBMDUMean',
  'genesDownBMDUMedian',
  'genesDownBMDUSD',
  // Percentiles across genes in category
  'bmdFifthPercentileTotalGenes',
  'bmdTenthPercentileTotalGenes',
  'bmdlFifthPercentileTotalGenes',
  'bmdlTenthPercentileTotalGenes',
  'bmduFifthPercentileTotalGenes',
  'bmduTenthPercentileTotalGenes',
];

/**
 * Determine which filter fields are relevant for a given analysis type
 *
 * @param analysisType - The type of category analysis
 * @returns Array of filter field names that are relevant for this analysis type
 */
export function getRelevantFilters(analysisType: string | null): FilterableFieldName[] {
  // Multi-gene analysis types get all filters
  if (isMultiGeneAnalysisType(analysisType)) {
    return [...SINGLE_GENE_FILTERS, ...MULTI_GENE_CATEGORY_FILTERS];
  }

  // Single-gene analysis (GENE type) - only single-gene filters are relevant
  // Gene counts, aggregations, and multi-gene statistics don't make sense when each row IS a gene
  return SINGLE_GENE_FILTERS;
}

/**
 * Check if a specific filter field is relevant for the given analysis type
 *
 * @param fieldName - The filter field name to check
 * @param analysisType - The type of category analysis
 * @returns true if the filter is relevant, false otherwise
 */
export function isFilterRelevant(
  fieldName: FilterableFieldName,
  analysisType: string | null
): boolean {
  const relevantFilters = getRelevantFilters(analysisType);
  return relevantFilters.includes(fieldName);
}

/**
 * Get a human-readable explanation of why certain filters are hidden
 *
 * @param analysisType - The type of category analysis
 * @returns Explanation text for the user
 */
export function getFilterRelevanceExplanation(analysisType: string | null): string {
  if (isMultiGeneAnalysisType(analysisType)) {
    return 'All applicable filters are available for this category type.';
  }

  return 'Gene-level analysis: Multi-gene aggregation filters (gene counts, directional statistics, etc.) are hidden because each row represents a single gene.';
}

/**
 * Group relevant filters by category for the given analysis type
 *
 * This is useful for building UI that organizes filters by category
 * while only showing relevant fields.
 *
 * @param analysisType - The type of category analysis
 * @returns Map of category names to relevant filter field names
 */
export function getRelevantFiltersByCategory(
  analysisType: string | null
): Record<string, FilterableFieldName[]> {
  const relevantFilters = getRelevantFilters(analysisType);

  // Define category mappings
  const categoryMap: Record<string, FilterableFieldName[]> = {
    BMD: [],
    BMDL: [],
    BMDU: [],
    Fisher: [],
    Genes: [],
    FoldChange: [],
    ZScore: [],
    Direction: [],
    Other: [],
  };

  // Categorize each relevant filter
  relevantFilters.forEach((fieldName) => {
    // BMD fields
    if (
      fieldName.startsWith('bmd') &&
      !fieldName.startsWith('bmdl') &&
      !fieldName.startsWith('bmdu')
    ) {
      categoryMap.BMD.push(fieldName);
    }
    // BMDL fields
    else if (fieldName.startsWith('bmdl')) {
      categoryMap.BMDL.push(fieldName);
    }
    // BMDU fields
    else if (fieldName.startsWith('bmdu')) {
      categoryMap.BMDU.push(fieldName);
    }
    // Fisher's test
    else if (fieldName.includes('fishers')) {
      categoryMap.Fisher.push(fieldName);
    }
    // Gene counts
    else if (
      fieldName.includes('gene') &&
      (fieldName.includes('Count') || fieldName.includes('Passed') || fieldName === 'percentage')
    ) {
      categoryMap.Genes.push(fieldName);
    }
    // Fold change
    else if (fieldName.includes('FoldChange') || fieldName.includes('ModelFC')) {
      categoryMap.FoldChange.push(fieldName);
    }
    // Z-score
    else if (fieldName.includes('ZScore')) {
      categoryMap.ZScore.push(fieldName);
    }
    // Direction
    else if (fieldName.includes('Direction') || fieldName.includes('irection')) {
      categoryMap.Direction.push(fieldName);
    }
    // Everything else
    else {
      categoryMap.Other.push(fieldName);
    }
  });

  // Remove empty categories
  return Object.fromEntries(
    Object.entries(categoryMap).filter(([, fields]) => fields.length > 0)
  );
}
