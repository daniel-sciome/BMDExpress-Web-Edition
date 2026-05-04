/**
 * Filter Field and Operator Metadata
 *
 * Provides human-readable labels, descriptions, and categories for all filterable fields
 */

import type { FieldMetadata, OperatorMetadata, FilterableFieldName, FilterOperator } from '../types/filterTypes';

/**
 * All filterable fields with metadata
 */
export const FIELD_METADATA: Record<FilterableFieldName, FieldMetadata> = {
  // Fisher's Exact Test
  fishersExactLeftPValue: {
    name: 'fishersExactLeftPValue',
    label: "Fisher's Left P-Value",
    description: 'Left-tailed Fisher exact test p-value',
    type: 'numeric',
    category: 'Fisher',
    unit: 'p-value',
  },
  fishersExactRightPValue: {
    name: 'fishersExactRightPValue',
    label: "Fisher's Right P-Value",
    description: 'Right-tailed Fisher exact test p-value',
    type: 'numeric',
    category: 'Fisher',
    unit: 'p-value',
  },
  fishersExactTwoTailPValue: {
    name: 'fishersExactTwoTailPValue',
    label: "Fisher's Two-Tail P-Value",
    description: 'Two-tailed Fisher exact test p-value',
    type: 'numeric',
    category: 'Fisher',
    unit: 'p-value',
  },

  // BMD Statistics
  bmdMean: { name: 'bmdMean', label: 'BMD Mean', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  bmdMedian: { name: 'bmdMedian', label: 'BMD Median', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  bmdMinimum: { name: 'bmdMinimum', label: 'BMD Minimum', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  bmdSD: { name: 'bmdSD', label: 'BMD Std Dev', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  bmdWMean: { name: 'bmdWMean', label: 'BMD Weighted Mean', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  bmdWSD: { name: 'bmdWSD', label: 'BMD Weighted Std Dev', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  bmdLower95: { name: 'bmdLower95', label: 'BMD Lower 95% CI', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  bmdUpper95: { name: 'bmdUpper95', label: 'BMD Upper 95% CI', type: 'numeric', category: 'BMD', unit: 'mg/kg' },

  // BMDL Statistics
  bmdlMean: { name: 'bmdlMean', label: 'BMDL Mean', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  bmdlMedian: { name: 'bmdlMedian', label: 'BMDL Median', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  bmdlMinimum: { name: 'bmdlMinimum', label: 'BMDL Minimum', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  bmdlSD: { name: 'bmdlSD', label: 'BMDL Std Dev', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  bmdlWMean: { name: 'bmdlWMean', label: 'BMDL Weighted Mean', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  bmdlWSD: { name: 'bmdlWSD', label: 'BMDL Weighted Std Dev', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  bmdlLower95: { name: 'bmdlLower95', label: 'BMDL Lower 95% CI', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  bmdlUpper95: { name: 'bmdlUpper95', label: 'BMDL Upper 95% CI', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },

  // BMDU Statistics
  bmduMean: { name: 'bmduMean', label: 'BMDU Mean', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  bmduMedian: { name: 'bmduMedian', label: 'BMDU Median', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  bmduMinimum: { name: 'bmduMinimum', label: 'BMDU Minimum', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  bmduSD: { name: 'bmduSD', label: 'BMDU Std Dev', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  bmduWMean: { name: 'bmduWMean', label: 'BMDU Weighted Mean', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  bmduWSD: { name: 'bmduWSD', label: 'BMDU Weighted Std Dev', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  bmduLower95: { name: 'bmduLower95', label: 'BMDU Lower 95% CI', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  bmduUpper95: { name: 'bmduUpper95', label: 'BMDU Upper 95% CI', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },

  // Gene Counts
  geneAllCount: { name: 'geneAllCount', label: 'Total Genes', type: 'numeric', category: 'Genes', unit: 'count' },
  geneCountSignificantANOVA: { name: 'geneCountSignificantANOVA', label: 'Significant Genes (ANOVA)', type: 'numeric', category: 'Genes', unit: 'count' },
  genesThatPassedAllFilters: { name: 'genesThatPassedAllFilters', label: 'Genes Passed All Filters', type: 'numeric', category: 'Genes', unit: 'count' },
  percentage: { name: 'percentage', label: 'Percentage', type: 'numeric', category: 'Genes', unit: '%' },

  // Fold Change
  totalFoldChange: { name: 'totalFoldChange', label: 'Total Fold Change', type: 'numeric', category: 'FoldChange' },
  meanFoldChange: { name: 'meanFoldChange', label: 'Mean Fold Change', type: 'numeric', category: 'FoldChange' },
  medianFoldChange: { name: 'medianFoldChange', label: 'Median Fold Change', type: 'numeric', category: 'FoldChange' },
  maxFoldChange: { name: 'maxFoldChange', label: 'Max Fold Change', type: 'numeric', category: 'FoldChange' },
  minFoldChange: { name: 'minFoldChange', label: 'Min Fold Change', type: 'numeric', category: 'FoldChange' },
  stdDevFoldChange: { name: 'stdDevFoldChange', label: 'Std Dev Fold Change', type: 'numeric', category: 'FoldChange' },

  // Z-Score
  minZScore: { name: 'minZScore', label: 'Min Z-Score', type: 'numeric', category: 'ZScore' },
  medianZScore: { name: 'medianZScore', label: 'Median Z-Score', type: 'numeric', category: 'ZScore' },
  maxZScore: { name: 'maxZScore', label: 'Max Z-Score', type: 'numeric', category: 'ZScore' },
  meanZScore: { name: 'meanZScore', label: 'Mean Z-Score', type: 'numeric', category: 'ZScore' },

  // Model Fold Change
  minModelFoldChange: { name: 'minModelFoldChange', label: 'Min Model FC', type: 'numeric', category: 'FoldChange' },
  medianModelFoldChange: { name: 'medianModelFoldChange', label: 'Median Model FC', type: 'numeric', category: 'FoldChange' },
  maxModelFoldChange: { name: 'maxModelFoldChange', label: 'Max Model FC', type: 'numeric', category: 'FoldChange' },
  meanModelFoldChange: { name: 'meanModelFoldChange', label: 'Mean Model FC', type: 'numeric', category: 'FoldChange' },

  // Direction
  overallDirection: {
    name: 'overallDirection',
    label: 'Overall Direction',
    description: 'Overall gene regulation direction',
    type: 'categorical',
    category: 'Direction',
  },
  percentWithOverallDirectionUP: { name: 'percentWithOverallDirectionUP', label: '% Direction UP', type: 'numeric', category: 'Direction', unit: '%' },
  percentWithOverallDirectionDOWN: { name: 'percentWithOverallDirectionDOWN', label: '% Direction DOWN', type: 'numeric', category: 'Direction', unit: '%' },
  percentWithOverallDirectionConflict: { name: 'percentWithOverallDirectionConflict', label: '% Direction Conflict', type: 'numeric', category: 'Direction', unit: '%' },

  // Directional BMD Stats - Up
  genesUpBMDMean: { name: 'genesUpBMDMean', label: 'Up-regulated BMD Mean', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  genesUpBMDMedian: { name: 'genesUpBMDMedian', label: 'Up-regulated BMD Median', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  genesUpBMDSD: { name: 'genesUpBMDSD', label: 'Up-regulated BMD SD', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  genesUpBMDLMean: { name: 'genesUpBMDLMean', label: 'Up-regulated BMDL Mean', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  genesUpBMDLMedian: { name: 'genesUpBMDLMedian', label: 'Up-regulated BMDL Median', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  genesUpBMDLSD: { name: 'genesUpBMDLSD', label: 'Up-regulated BMDL SD', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  genesUpBMDUMean: { name: 'genesUpBMDUMean', label: 'Up-regulated BMDU Mean', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  genesUpBMDUMedian: { name: 'genesUpBMDUMedian', label: 'Up-regulated BMDU Median', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  genesUpBMDUSD: { name: 'genesUpBMDUSD', label: 'Up-regulated BMDU SD', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },

  // Directional BMD Stats - Down
  genesDownBMDMean: { name: 'genesDownBMDMean', label: 'Down-regulated BMD Mean', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  genesDownBMDMedian: { name: 'genesDownBMDMedian', label: 'Down-regulated BMD Median', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  genesDownBMDSD: { name: 'genesDownBMDSD', label: 'Down-regulated BMD SD', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  genesDownBMDLMean: { name: 'genesDownBMDLMean', label: 'Down-regulated BMDL Mean', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  genesDownBMDLMedian: { name: 'genesDownBMDLMedian', label: 'Down-regulated BMDL Median', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  genesDownBMDLSD: { name: 'genesDownBMDLSD', label: 'Down-regulated BMDL SD', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  genesDownBMDUMean: { name: 'genesDownBMDUMean', label: 'Down-regulated BMDU Mean', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  genesDownBMDUMedian: { name: 'genesDownBMDUMedian', label: 'Down-regulated BMDU Median', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  genesDownBMDUSD: { name: 'genesDownBMDUSD', label: 'Down-regulated BMDU SD', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },

  // Percentiles
  bmdFifthPercentileTotalGenes: { name: 'bmdFifthPercentileTotalGenes', label: 'BMD 5th Percentile', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  bmdTenthPercentileTotalGenes: { name: 'bmdTenthPercentileTotalGenes', label: 'BMD 10th Percentile', type: 'numeric', category: 'BMD', unit: 'mg/kg' },
  bmdlFifthPercentileTotalGenes: { name: 'bmdlFifthPercentileTotalGenes', label: 'BMDL 5th Percentile', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  bmdlTenthPercentileTotalGenes: { name: 'bmdlTenthPercentileTotalGenes', label: 'BMDL 10th Percentile', type: 'numeric', category: 'BMDL', unit: 'mg/kg' },
  bmduFifthPercentileTotalGenes: { name: 'bmduFifthPercentileTotalGenes', label: 'BMDU 5th Percentile', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },
  bmduTenthPercentileTotalGenes: { name: 'bmduTenthPercentileTotalGenes', label: 'BMDU 10th Percentile', type: 'numeric', category: 'BMDU', unit: 'mg/kg' },

  // Filter Result Counts
  genesWithBMDLessEqualHighDose: { name: 'genesWithBMDLessEqualHighDose', label: 'Genes: BMD ≤ High Dose', type: 'numeric', category: 'Other', unit: 'count' },
  genesWithBMDpValueGreaterEqualValue: { name: 'genesWithBMDpValueGreaterEqualValue', label: 'Genes: BMD p-value ≥ Value', type: 'numeric', category: 'Other', unit: 'count' },
  genesWithFoldChangeAboveValue: { name: 'genesWithFoldChangeAboveValue', label: 'Genes: FC > Value', type: 'numeric', category: 'Other', unit: 'count' },
  genesWithBMDRSquaredValueGreaterEqualValue: { name: 'genesWithBMDRSquaredValueGreaterEqualValue', label: 'Genes: R² ≥ Value', type: 'numeric', category: 'Other', unit: 'count' },
  genesWithBMDBMDLRatioBelowValue: { name: 'genesWithBMDBMDLRatioBelowValue', label: 'Genes: BMD/BMDL < Value', type: 'numeric', category: 'Other', unit: 'count' },
  genesWithBMDUBMDLRatioBelowValue: { name: 'genesWithBMDUBMDLRatioBelowValue', label: 'Genes: BMDU/BMDL < Value', type: 'numeric', category: 'Other', unit: 'count' },
  genesWithBMDUBMDRatioBelowValue: { name: 'genesWithBMDUBMDRatioBelowValue', label: 'Genes: BMDU/BMD < Value', type: 'numeric', category: 'Other', unit: 'count' },
  genesWithNFoldBelowLowPostiveDoseValue: { name: 'genesWithNFoldBelowLowPostiveDoseValue', label: 'Genes: N-Fold Below Low Dose', type: 'numeric', category: 'Other', unit: 'count' },
  genesWithPrefilterPValueAboveValue: { name: 'genesWithPrefilterPValueAboveValue', label: 'Genes: Prefilter p-value > Value', type: 'numeric', category: 'Other', unit: 'count' },
  genesWithPrefilterAdjustedPValueAboveValue: { name: 'genesWithPrefilterAdjustedPValueAboveValue', label: 'Genes: Prefilter Adj. p-value > Value', type: 'numeric', category: 'Other', unit: 'count' },
  genesNotStepFunction: { name: 'genesNotStepFunction', label: 'Genes: Not Step Function', type: 'numeric', category: 'Other', unit: 'count' },
  genesNotStepFunctionWithBMDLower: { name: 'genesNotStepFunctionWithBMDLower', label: 'Genes: Not Step (BMD Lower)', type: 'numeric', category: 'Other', unit: 'count' },
  genesNotAdverseDirection: { name: 'genesNotAdverseDirection', label: 'Genes: Not Adverse Direction', type: 'numeric', category: 'Other', unit: 'count' },
  genesWithABSZScoreAboveValue: { name: 'genesWithABSZScoreAboveValue', label: 'Genes: |Z-Score| > Value', type: 'numeric', category: 'Other', unit: 'count' },
  genesWithABSModelFCAboveValue: { name: 'genesWithABSModelFCAboveValue', label: 'Genes: |Model FC| > Value', type: 'numeric', category: 'Other', unit: 'count' },
};

/**
 * Extended operator metadata with evaluation functions
 * Single source of truth for operator definitions
 */
interface NumericOperatorConfig extends OperatorMetadata {
  /** Short symbol for compact UI (e.g., '>=') */
  shortSymbol: string;
  /** Evaluate the operator against a value */
  evaluate: (value: number, threshold: number, maxThreshold?: number) => boolean;
}

interface CategoricalOperatorConfig extends OperatorMetadata {
  /** Short symbol for compact UI */
  shortSymbol: string;
  /** Evaluate the operator against a string value */
  evaluate: (value: string, target: string, targets?: string[]) => boolean;
}

/**
 * Numeric operator configurations with evaluation functions
 */
export const NUMERIC_OPERATORS: NumericOperatorConfig[] = [
  {
    operator: 'equals',
    label: 'Equals',
    symbol: '=',
    shortSymbol: '=',
    requiresValue: true,
    requiresMaxValue: false,
    evaluate: (v, t) => v === t,
  },
  {
    operator: 'notEquals',
    label: 'Not Equals',
    symbol: '≠',
    shortSymbol: '!=',
    requiresValue: true,
    requiresMaxValue: false,
    evaluate: (v, t) => v !== t,
  },
  {
    operator: 'lessThan',
    label: 'Less Than',
    symbol: '<',
    shortSymbol: '<',
    requiresValue: true,
    requiresMaxValue: false,
    evaluate: (v, t) => v < t,
  },
  {
    operator: 'lessThanOrEqual',
    label: 'Less Than or Equal',
    symbol: '≤',
    shortSymbol: '<=',
    requiresValue: true,
    requiresMaxValue: false,
    evaluate: (v, t) => v <= t,
  },
  {
    operator: 'greaterThan',
    label: 'Greater Than',
    symbol: '>',
    shortSymbol: '>',
    requiresValue: true,
    requiresMaxValue: false,
    evaluate: (v, t) => v > t,
  },
  {
    operator: 'greaterThanOrEqual',
    label: 'Greater Than or Equal',
    symbol: '≥',
    shortSymbol: '>=',
    requiresValue: true,
    requiresMaxValue: false,
    evaluate: (v, t) => v >= t,
  },
  {
    operator: 'between',
    label: 'Between',
    symbol: '≤ x ≤',
    shortSymbol: '[between]',
    requiresValue: true,
    requiresMaxValue: true,
    evaluate: (v, min, max) => max !== undefined && v >= min && v <= max,
  },
  {
    operator: 'notBetween',
    label: 'Not Between',
    symbol: '< x >',
    shortSymbol: '![between]',
    requiresValue: true,
    requiresMaxValue: true,
    evaluate: (v, min, max) => max !== undefined && (v < min || v > max),
  },
];

/**
 * Categorical operator configurations with evaluation functions
 */
export const CATEGORICAL_OPERATORS: CategoricalOperatorConfig[] = [
  {
    operator: 'equals',
    label: 'Equals',
    symbol: '=',
    shortSymbol: '=',
    requiresValue: true,
    requiresMaxValue: false,
    evaluate: (v, t) => v === t,
  },
  {
    operator: 'notEquals',
    label: 'Not Equals',
    symbol: '≠',
    shortSymbol: '!=',
    requiresValue: true,
    requiresMaxValue: false,
    evaluate: (v, t) => v !== t,
  },
  {
    operator: 'in',
    label: 'In',
    symbol: '∈',
    shortSymbol: 'in',
    requiresValue: false,
    requiresMaxValue: false,
    evaluate: (v, _, targets) => targets !== undefined && targets.includes(v),
  },
  {
    operator: 'notIn',
    label: 'Not In',
    symbol: '∉',
    shortSymbol: '!in',
    requiresValue: false,
    requiresMaxValue: false,
    evaluate: (v, _, targets) => targets !== undefined && !targets.includes(v),
  },
];

/**
 * Lookup helpers for operator configurations
 */
export function getNumericOperatorConfig(operator: string): NumericOperatorConfig | undefined {
  return NUMERIC_OPERATORS.find(op => op.operator === operator);
}

export function getCategoricalOperatorConfig(operator: string): CategoricalOperatorConfig | undefined {
  return CATEGORICAL_OPERATORS.find(op => op.operator === operator);
}

/**
 * Convert between verbose operator names and short symbols
 */
export function operatorToShortSymbol(operator: string): string {
  const numOp = getNumericOperatorConfig(operator);
  if (numOp) return numOp.shortSymbol;
  const catOp = getCategoricalOperatorConfig(operator);
  if (catOp) return catOp.shortSymbol;
  return '>='; // Default fallback
}

export function shortSymbolToOperator(shortSymbol: string): string {
  // Handle various between formats
  if (shortSymbol === '[between]' || shortSymbol === 'between' || shortSymbol === '[between' || shortSymbol === 'between]') {
    return 'between';
  }
  const numOp = NUMERIC_OPERATORS.find(op => op.shortSymbol === shortSymbol);
  if (numOp) return numOp.operator;
  const catOp = CATEGORICAL_OPERATORS.find(op => op.shortSymbol === shortSymbol);
  if (catOp) return catOp.operator;
  return 'greaterThanOrEqual'; // Default fallback
}

/**
 * Get fields grouped by category
 */
export function getFieldsByCategory(): Record<string, FieldMetadata[]> {
  const grouped: Record<string, FieldMetadata[]> = {};

  Object.values(FIELD_METADATA).forEach(field => {
    if (!grouped[field.category]) {
      grouped[field.category] = [];
    }
    grouped[field.category].push(field);
  });

  return grouped;
}

/**
 * Categorical field values
 */
export const DIRECTION_VALUES = ['UP', 'DOWN', 'CONFLICT'];

/**
 * Return step, precision, and optional min for a numeric input based on a
 * field's unit string.
 *
 * Ant Design's InputNumber derives precision from `step` when no explicit
 * `precision` prop is set — step=1 silently rounds all typed decimals to
 * integers. We set both props explicitly here and import this wherever a
 * numeric filter value is entered (FilterBuilder, FilterGroupList) so the
 * behaviour is identical in every editing surface.
 *
 * Rules:
 *   count     → integers only  (gene counts can't be fractional)
 *   p-value   → 6 decimals     (e.g. 0.000123)
 *   mg/kg     → 4 decimals, ≥0 (e.g. 0.0025 mg/kg BMD values)
 *   %         → 2 decimals     (e.g. 5.25%)
 *   (other)   → 4 decimals     (fold change, z-scores, etc.)
 */
export function getFieldInputConfig(unit?: string): { step: number; precision: number; min?: number } {
  switch (unit) {
    case 'count':   return { step: 1,      precision: 0 };
    case 'p-value': return { step: 0.0001, precision: 6 };
    case 'mg/kg':   return { step: 0.001,  precision: 4, min: 0 };
    case '%':       return { step: 0.1,    precision: 2 };
    default:        return { step: 0.01,   precision: 4 };
  }
}
