/**
 * Filter System Type Definitions
 *
 * Supports creating filter groups to filter CategoryAnalysisResultDto data
 * - Filters within a group use AND logic (all must match)
 * - Multiple active groups use AND logic (all groups must match)
 */

import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

/**
 * Field types for filtering
 */
export type NumericFieldName =
  // BMD Statistics
  | 'bmdMean' | 'bmdMedian' | 'bmdMinimum' | 'bmdSD'
  | 'bmdWMean' | 'bmdWSD' | 'bmdLower95' | 'bmdUpper95'
  // BMDL Statistics
  | 'bmdlMean' | 'bmdlMedian' | 'bmdlMinimum' | 'bmdlSD'
  | 'bmdlWMean' | 'bmdlWSD' | 'bmdlLower95' | 'bmdlUpper95'
  // BMDU Statistics
  | 'bmduMean' | 'bmduMedian' | 'bmduMinimum' | 'bmduSD'
  | 'bmduWMean' | 'bmduWSD' | 'bmduLower95' | 'bmduUpper95'
  // Fisher's Test
  | 'fishersExactLeftPValue' | 'fishersExactRightPValue' | 'fishersExactTwoTailPValue'
  // Gene Counts
  | 'geneAllCount' | 'geneCountSignificantANOVA' | 'genesThatPassedAllFilters' | 'percentage'
  // Fold Change
  | 'totalFoldChange' | 'meanFoldChange' | 'medianFoldChange'
  | 'maxFoldChange' | 'minFoldChange' | 'stdDevFoldChange'
  // Z-Score
  | 'minZScore' | 'medianZScore' | 'maxZScore' | 'meanZScore'
  // Model Fold Change
  | 'minModelFoldChange' | 'medianModelFoldChange' | 'maxModelFoldChange' | 'meanModelFoldChange'
  // Direction Percentages
  | 'percentWithOverallDirectionUP' | 'percentWithOverallDirectionDOWN' | 'percentWithOverallDirectionConflict'
  // Directional BMD Statistics
  | 'genesUpBMDMean' | 'genesUpBMDMedian' | 'genesUpBMDSD'
  | 'genesUpBMDLMean' | 'genesUpBMDLMedian' | 'genesUpBMDLSD'
  | 'genesUpBMDUMean' | 'genesUpBMDUMedian' | 'genesUpBMDUSD'
  | 'genesDownBMDMean' | 'genesDownBMDMedian' | 'genesDownBMDSD'
  | 'genesDownBMDLMean' | 'genesDownBMDLMedian' | 'genesDownBMDLSD'
  | 'genesDownBMDUMean' | 'genesDownBMDUMedian' | 'genesDownBMDUSD'
  // Percentiles
  | 'bmdFifthPercentileTotalGenes' | 'bmdTenthPercentileTotalGenes'
  | 'bmdlFifthPercentileTotalGenes' | 'bmdlTenthPercentileTotalGenes'
  | 'bmduFifthPercentileTotalGenes' | 'bmduTenthPercentileTotalGenes'
  // Filter Counts
  | 'genesWithBMDLessEqualHighDose' | 'genesWithBMDpValueGreaterEqualValue'
  | 'genesWithFoldChangeAboveValue' | 'genesWithBMDRSquaredValueGreaterEqualValue'
  | 'genesWithBMDBMDLRatioBelowValue' | 'genesWithBMDUBMDLRatioBelowValue'
  | 'genesWithBMDUBMDRatioBelowValue' | 'genesWithNFoldBelowLowPostiveDoseValue'
  | 'genesWithPrefilterPValueAboveValue' | 'genesWithPrefilterAdjustedPValueAboveValue'
  | 'genesNotStepFunction' | 'genesNotStepFunctionWithBMDLower'
  | 'genesNotAdverseDirection' | 'genesWithABSZScoreAboveValue'
  | 'genesWithABSModelFCAboveValue';

export type CategoricalFieldName = 'overallDirection';

export type FilterableFieldName = NumericFieldName | CategoricalFieldName;

/**
 * Comparison operators for numeric filters
 */
export type NumericOperator =
  | 'equals'          // ==
  | 'notEquals'       // !=
  | 'lessThan'        // <
  | 'lessThanOrEqual' // <=
  | 'greaterThan'     // >
  | 'greaterThanOrEqual' // >=
  | 'between'         // value >= min && value <= max
  | 'notBetween';     // value < min || value > max

/**
 * Comparison operators for categorical filters
 */
export type CategoricalOperator =
  | 'equals'          // ==
  | 'notEquals'       // !=
  | 'in'              // value in [list]
  | 'notIn';          // value not in [list]

export type FilterOperator = NumericOperator | CategoricalOperator;

/**
 * Base filter interface
 */
interface BaseFilter {
  id: string;
  field: FilterableFieldName;
  enabled: boolean;
}

/**
 * Numeric filter condition
 */
export interface NumericFilter extends BaseFilter {
  field: NumericFieldName;
  operator: NumericOperator;
  value: number;
  maxValue?: number; // For 'between' and 'notBetween' operators
}

/**
 * Categorical filter condition
 */
export interface CategoricalFilter extends BaseFilter {
  field: CategoricalFieldName;
  operator: CategoricalOperator;
  value: string;
  values?: string[]; // For 'in' and 'notIn' operators
}

/**
 * Union type for all filter types
 */
export type Filter = NumericFilter | CategoricalFilter;

/**
 * Partial filter type for building filters incrementally
 * This type is more flexible than Partial<Filter> which creates union distribution issues
 */
export interface PartialFilter {
  id?: string;
  field?: FilterableFieldName;
  operator?: FilterOperator;
  enabled?: boolean;
  value?: number | string;
  maxValue?: number;
  values?: string[];
}

/**
 * Filter Group
 * Contains multiple filters that are combined with AND logic
 */
export interface FilterGroup {
  id: string;
  name: string;
  description?: string;
  filters: Filter[];
  enabled: boolean;
  color?: string; // Optional color for visualization
  createdAt: number;
  updatedAt: number;
}

/**
 * Filter state in Redux
 */
export interface FilterState {
  groups: FilterGroup[];
  activeGroupIds: string[]; // IDs of currently active (enabled) filter groups
}

/**
 * Helper type: Field metadata for UI
 */
export interface FieldMetadata {
  name: FilterableFieldName;
  label: string;
  description?: string;
  type: 'numeric' | 'categorical';
  category: 'BMD' | 'BMDL' | 'BMDU' | 'Fisher' | 'Genes' | 'FoldChange' | 'ZScore' | 'Direction' | 'Other';
  unit?: string; // e.g., 'mg/kg', '%', 'p-value'
}

/**
 * Operator metadata for UI
 */
export interface OperatorMetadata {
  operator: FilterOperator;
  label: string;
  symbol: string;
  requiresValue: boolean;
  requiresMaxValue: boolean; // For range operators like 'between'
}
