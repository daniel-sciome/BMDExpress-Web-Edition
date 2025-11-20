/**
 * Number Padding Utilities
 *
 * Provides functions to calculate and apply padding to numeric values
 * so that decimal points align vertically in table columns.
 */

import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

/**
 * Statistics about a numeric column's formatting requirements
 */
export interface ColumnPaddingInfo {
  maxBeforeDecimal: number;
  maxAfterDecimal: number;
}

/**
 * Map of column field names to their padding requirements
 */
export type PaddingMap = Record<string, ColumnPaddingInfo>;

/**
 * Analyze a numeric value to determine digits before and after decimal
 */
function analyzeNumber(value: number | null | undefined): { before: number; after: number } {
  if (value == null || isNaN(value)) {
    return { before: 1, after: 0 }; // for "-" or "0"
  }

  const str = value.toString();
  const absStr = Math.abs(value).toString();

  // Handle scientific notation
  if (absStr.includes('e')) {
    // For scientific notation, just use the formatted version
    return { before: str.length, after: 0 };
  }

  const parts = absStr.split('.');
  const beforeDecimal = parts[0].length;
  const afterDecimal = parts.length > 1 ? parts[1].length : 0;

  return { before: beforeDecimal, after: afterDecimal };
}

/**
 * Calculate padding requirements for all numeric columns in a dataset
 *
 * @param data - Array of category analysis results
 * @param numericFields - List of numeric field names to analyze
 * @returns Map of field names to padding info
 */
export function calculatePaddingMap(
  data: CategoryAnalysisResultDto[],
  numericFields: string[]
): PaddingMap {
  const paddingMap: PaddingMap = {};

  for (const field of numericFields) {
    let maxBefore = 0;
    let maxAfter = 0;

    for (const row of data) {
      const value = (row as any)[field];
      if (typeof value === 'number') {
        const { before, after } = analyzeNumber(value);
        maxBefore = Math.max(maxBefore, before);
        maxAfter = Math.max(maxAfter, after);
      }
    }

    // Minimum of 1 digit before decimal
    paddingMap[field] = {
      maxBeforeDecimal: Math.max(1, maxBefore),
      maxAfterDecimal: maxAfter,
    };
  }

  return paddingMap;
}

/**
 * Format a number with padding to align decimal points
 *
 * @param value - The numeric value to format
 * @param paddingInfo - Padding requirements for this column
 * @param decimals - Number of decimal places to show (optional)
 * @returns Padded string with non-breaking spaces
 */
export function padNumber(
  value: number | null | undefined,
  paddingInfo: ColumnPaddingInfo,
  decimals?: number
): string {
  if (value == null || isNaN(value)) {
    // Pad empty values to align with valid numbers
    const totalWidth = paddingInfo.maxBeforeDecimal +
                      (paddingInfo.maxAfterDecimal > 0 ? 1 + paddingInfo.maxAfterDecimal : 0);
    return '\u00A0'.repeat(totalWidth); // non-breaking spaces
  }

  // Format the number
  let formatted: string;
  if (decimals !== undefined) {
    formatted = value.toFixed(decimals);
  } else {
    formatted = value.toString();
  }

  // Handle scientific notation - don't pad it
  if (formatted.includes('e')) {
    return formatted;
  }

  const parts = formatted.split('.');
  const beforeDecimal = parts[0];
  const afterDecimal = parts.length > 1 ? parts[1] : '';

  // Calculate padding needed before decimal
  const beforePadding = paddingInfo.maxBeforeDecimal - beforeDecimal.length;

  // Calculate padding needed after decimal
  const afterPadding = paddingInfo.maxAfterDecimal - afterDecimal.length;

  // Build padded string with non-breaking spaces
  let result = '\u00A0'.repeat(Math.max(0, beforePadding)) + beforeDecimal;

  if (paddingInfo.maxAfterDecimal > 0) {
    result += '.';
    result += afterDecimal;
    result += '\u00A0'.repeat(Math.max(0, afterPadding));
  }

  return result;
}

/**
 * List of all numeric field names in CategoryAnalysisResultDto
 * This should be kept in sync with the DTO definition
 */
export const NUMERIC_FIELDS = [
  // Gene counts
  'genesThatPassedAllFilters',
  'geneAllCount',
  'percentage',
  'geneCountSignificantANOVA',

  // Fisher's test
  'fishersA',
  'fishersB',
  'fishersC',
  'fishersD',
  'fishersExactLeftPValue',
  'fishersExactRightPValue',
  'fishersExactTwoTailPValue',

  // BMD statistics
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

  // Percentiles
  'bmdFifthPercentileTotalGenes',
  'bmdTenthPercentileTotalGenes',
  'bmdlFifthPercentileTotalGenes',
  'bmdlTenthPercentileTotalGenes',
  'bmduFifthPercentileTotalGenes',
  'bmduTenthPercentileTotalGenes',

  // Filter counts (all numeric)
  'numGenesPassedBMDLessEqualHighDose',
  'numGenesPassedBMDPValueGreaterEqual',
  'numGenesPassedFoldChangeAbove',
  'numGenesPassedRSquared',
  'numGenesPassedBMDBMDLRatio',
  'numGenesPassedBMDUBMDLRatio',
  'numGenesPassedBMDUBMDRatio',
  'numGenesPassedNFoldBelow',
  'numGenesPassedPrefilterPValue',
  'numGenesPassedPrefilterAdjustedPValue',
  'numGenesPassedNotStepFunction',
  'numGenesPassedNotStepFunctionBMDL',
  'numGenesPassedNotAdverse',
  'numGenesPassedAbsZScore',
  'numGenesPassedAbsModelFC',

  // Directional statistics
  'bmdMeanUP',
  'bmdMedianUP',
  'bmdSDUP',
  'bmdlMeanUP',
  'bmdlMedianUP',
  'bmdlSDUP',
  'bmduMeanUP',
  'bmduMedianUP',
  'bmduSDUP',
  'bmdMeanDOWN',
  'bmdMedianDOWN',
  'bmdSDDOWN',
  'bmdlMeanDOWN',
  'bmdlMedianDOWN',
  'bmdlSDDOWN',
  'bmduMeanDOWN',
  'bmduMedianDOWN',
  'bmduSDDOWN',
  'percentUP',
  'percentDOWN',
  'percentConflicting',

  // Fold change statistics
  'foldChangeTotal',
  'foldChangeMean',
  'foldChangeMedian',
  'foldChangeMax',
  'foldChangeMin',
  'foldChangeStdDev',

  // Z-score statistics
  'zScoreMin',
  'zScoreMedian',
  'zScoreMax',
  'zScoreMean',

  // Model fold change statistics
  'modelFoldChangeMin',
  'modelFoldChangeMedian',
  'modelFoldChangeMax',
  'modelFoldChangeMean',
];
