/**
 * Utility to apply master filters to category analysis data
 * Extracted from categoryResultsSlice selectFilteredData logic
 * Used by comparison components that load data independently
 */

import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

interface PrimaryFilters {
  bmdMin?: number;
  bmdMax?: number;
  pValueMax?: number;
  minGenesInCategory?: number;
  fisherPValueMax?: number;
  foldChangeMin?: number;
  // Primary Filter fields (Phase 1)
  percentageMin?: number;
  genesPassedFiltersMin?: number;
  allGenesMin?: number;
  allGenesMax?: number;
}

/**
 * Apply master filters to an array of category analysis results
 * @param data - Array of category analysis results
 * @param filters - Master filter values
 * @param analysisType - Analysis type (e.g., "GO_BP", "GENE")
 * @returns Filtered array
 */
export function applyPrimaryFilters(
  data: CategoryAnalysisResultDto[],
  filters: PrimaryFilters,
  analysisType?: string | null
): CategoryAnalysisResultDto[] {
  return data.filter(row => {
    if (filters.bmdMin !== undefined && row.bmdMean !== undefined && row.bmdMean < filters.bmdMin) return false;
    if (filters.bmdMax !== undefined && row.bmdMean !== undefined && row.bmdMean > filters.bmdMax) return false;
    if (filters.pValueMax !== undefined && row.fishersExactTwoTailPValue !== undefined && row.fishersExactTwoTailPValue > filters.pValueMax) return false;
    if (filters.minGenesInCategory !== undefined && row.genesThatPassedAllFilters !== undefined && row.genesThatPassedAllFilters < filters.minGenesInCategory) return false;
    if (filters.fisherPValueMax !== undefined && row.fishersExactTwoTailPValue !== undefined && row.fishersExactTwoTailPValue > filters.fisherPValueMax) return false;

    // Primary Filter fields (Phase 1) - skip for GENE analyses
    if (analysisType !== 'GENE') {
      if (filters.percentageMin !== undefined && row.percentage !== undefined && row.percentage < filters.percentageMin) return false;
      if (filters.genesPassedFiltersMin !== undefined && row.genesThatPassedAllFilters !== undefined && row.genesThatPassedAllFilters < filters.genesPassedFiltersMin) return false;
      if (filters.allGenesMin !== undefined && row.geneAllCount !== undefined && row.geneAllCount < filters.allGenesMin) return false;
      if (filters.allGenesMax !== undefined && row.geneAllCount !== undefined && row.geneAllCount > filters.allGenesMax) return false;
    }

    return true;
  });
}
