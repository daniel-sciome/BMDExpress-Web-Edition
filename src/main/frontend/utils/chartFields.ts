/**
 * Chart Fields Registry
 *
 * Comprehensive registry of all fields available from CategoryAnalysisResultDto
 * that can be used as axes in charts. Organized by category for better UI presentation.
 */

import type { ChartTransform } from 'Frontend/types/chartConfiguration';

/**
 * Field definition for chart configuration.
 */
export interface ChartFieldDef {
  /** Field name (matches CategoryAnalysisResultDto property) */
  field: string;

  /** Human-readable label */
  label: string;

  /** Category for grouping in UI */
  category: FieldCategory;

  /** Whether this field typically needs log scale */
  suggestedLogScale?: boolean;

  /** Suggested default transform */
  suggestedTransform?: ChartTransform;

  /** Brief description of what this field represents */
  description?: string;

  /** Whether this is a commonly used field (shown in "quick pick" lists) */
  isCommon?: boolean;
}

/**
 * Field categories for organizing in UI dropdowns.
 */
export type FieldCategory =
  | 'BMD Statistics'
  | 'BMDL Statistics'
  | 'BMDU Statistics'
  | 'Percentiles'
  | 'Fisher Statistics'
  | 'Gene Counts'
  | 'Filter Counts'
  | 'Directional Statistics'
  | 'Fold Change'
  | 'Z-Score'
  | 'Ratios'
  | 'Confidence Intervals'
  | 'Weighted Statistics'
  | 'Other';

/**
 * Complete registry of all chartable numeric fields.
 * Organized by category for easy UI presentation.
 */
export const CATEGORY_FIELDS: ChartFieldDef[] = [
  // ==================== BMD Statistics ====================
  {
    field: 'bmdMedian',
    label: 'BMD Median',
    category: 'BMD Statistics',
    suggestedLogScale: true,
    isCommon: true,
    description: 'Median BMD value across genes in category',
  },
  {
    field: 'bmdMean',
    label: 'BMD Mean',
    category: 'BMD Statistics',
    suggestedLogScale: true,
    isCommon: true,
    description: 'Mean BMD value across genes in category',
  },
  {
    field: 'bmdMinimum',
    label: 'BMD Minimum',
    category: 'BMD Statistics',
    suggestedLogScale: true,
    description: 'Minimum BMD value in category',
  },
  {
    field: 'bmdMaximum',
    label: 'BMD Maximum',
    category: 'BMD Statistics',
    suggestedLogScale: true,
    description: 'Maximum BMD value in category',
  },
  {
    field: 'bmdSD',
    label: 'BMD Std Dev',
    category: 'BMD Statistics',
    description: 'Standard deviation of BMD values',
  },

  // ==================== BMDL Statistics ====================
  {
    field: 'bmdlMedian',
    label: 'BMDL Median',
    category: 'BMDL Statistics',
    suggestedLogScale: true,
    isCommon: true,
    description: 'Median BMDL (lower confidence) across genes',
  },
  {
    field: 'bmdlMean',
    label: 'BMDL Mean',
    category: 'BMDL Statistics',
    suggestedLogScale: true,
    description: 'Mean BMDL value across genes',
  },
  {
    field: 'bmdlMinimum',
    label: 'BMDL Minimum',
    category: 'BMDL Statistics',
    suggestedLogScale: true,
    description: 'Minimum BMDL value in category',
  },
  {
    field: 'bmdlMaximum',
    label: 'BMDL Maximum',
    category: 'BMDL Statistics',
    suggestedLogScale: true,
    description: 'Maximum BMDL value in category',
  },
  {
    field: 'bmdlSD',
    label: 'BMDL Std Dev',
    category: 'BMDL Statistics',
    description: 'Standard deviation of BMDL values',
  },

  // ==================== BMDU Statistics ====================
  {
    field: 'bmduMedian',
    label: 'BMDU Median',
    category: 'BMDU Statistics',
    suggestedLogScale: true,
    isCommon: true,
    description: 'Median BMDU (upper confidence) across genes',
  },
  {
    field: 'bmduMean',
    label: 'BMDU Mean',
    category: 'BMDU Statistics',
    suggestedLogScale: true,
    description: 'Mean BMDU value across genes',
  },
  {
    field: 'bmduMinimum',
    label: 'BMDU Minimum',
    category: 'BMDU Statistics',
    suggestedLogScale: true,
    description: 'Minimum BMDU value in category',
  },
  {
    field: 'bmduSD',
    label: 'BMDU Std Dev',
    category: 'BMDU Statistics',
    description: 'Standard deviation of BMDU values',
  },

  // ==================== Percentiles ====================
  {
    field: 'bmdFifthPercentile',
    label: 'BMD 5th Percentile',
    category: 'Percentiles',
    suggestedLogScale: true,
    isCommon: true,
    description: '5th percentile BMD value (sensitive pathway indicator)',
  },
  {
    field: 'bmdTenthPercentile',
    label: 'BMD 10th Percentile',
    category: 'Percentiles',
    suggestedLogScale: true,
    description: '10th percentile BMD value',
  },
  {
    field: 'bmdlFifthPercentile',
    label: 'BMDL 5th Percentile',
    category: 'Percentiles',
    suggestedLogScale: true,
    description: '5th percentile BMDL value',
  },
  {
    field: 'bmdlTenthPercentile',
    label: 'BMDL 10th Percentile',
    category: 'Percentiles',
    suggestedLogScale: true,
    description: '10th percentile BMDL value',
  },
  {
    field: 'bmduFifthPercentile',
    label: 'BMDU 5th Percentile',
    category: 'Percentiles',
    suggestedLogScale: true,
    description: '5th percentile BMDU value',
  },
  {
    field: 'bmduTenthPercentile',
    label: 'BMDU 10th Percentile',
    category: 'Percentiles',
    suggestedLogScale: true,
    description: '10th percentile BMDU value',
  },
  {
    field: 'fifthPercentileIndex',
    label: '5th Percentile Index',
    category: 'Percentiles',
    description: 'Index position of 5th percentile gene',
  },
  {
    field: 'tenthPercentileIndex',
    label: '10th Percentile Index',
    category: 'Percentiles',
    description: 'Index position of 10th percentile gene',
  },

  // ==================== Fisher Statistics ====================
  {
    field: 'fishersExactTwoTailPValue',
    label: "Fisher's Two-Tail P-Value",
    category: 'Fisher Statistics',
    suggestedTransform: 'negLog10',
    isCommon: true,
    description: "Fisher's exact test two-tailed p-value",
  },
  {
    field: 'fishersExactLeftPValue',
    label: "Fisher's Left P-Value",
    category: 'Fisher Statistics',
    suggestedTransform: 'negLog10',
    description: "Fisher's exact test left-tailed p-value",
  },
  {
    field: 'fishersExactRightPValue',
    label: "Fisher's Right P-Value",
    category: 'Fisher Statistics',
    suggestedTransform: 'negLog10',
    description: "Fisher's exact test right-tailed p-value",
  },
  {
    field: 'negLogOfFishers2Tail',
    label: "-Log\u2081\u2080(Fisher's Two-Tail)",
    category: 'Fisher Statistics',
    isCommon: true,
    description: 'Pre-computed negative log of Fisher p-value',
  },
  {
    field: 'fishersA',
    label: "Fisher's A",
    category: 'Fisher Statistics',
    description: 'Contingency table cell A',
  },
  {
    field: 'fishersB',
    label: "Fisher's B",
    category: 'Fisher Statistics',
    description: 'Contingency table cell B',
  },
  {
    field: 'fishersC',
    label: "Fisher's C",
    category: 'Fisher Statistics',
    description: 'Contingency table cell C',
  },
  {
    field: 'fishersD',
    label: "Fisher's D",
    category: 'Fisher Statistics',
    description: 'Contingency table cell D',
  },

  // ==================== Gene Counts ====================
  {
    field: 'geneAllCount',
    label: 'Total Genes',
    category: 'Gene Counts',
    isCommon: true,
    description: 'Total number of genes in category',
  },
  {
    field: 'geneCountSignificantANOVA',
    label: 'Significant ANOVA Genes',
    category: 'Gene Counts',
    description: 'Genes passing ANOVA significance',
  },
  {
    field: 'genesThatPassedAllFilters',
    label: 'Genes Passing Filters',
    category: 'Gene Counts',
    isCommon: true,
    description: 'Genes that passed all applied filters',
  },
  {
    field: 'percentage',
    label: 'Percentage',
    category: 'Gene Counts',
    isCommon: true,
    description: 'Percentage of genes passing filters',
  },
  {
    field: 'geneAllCountFromExperiment',
    label: 'Experiment Gene Count',
    category: 'Gene Counts',
    description: 'Total genes in experiment',
  },
  {
    field: 'bmdFifthPercentileTotalGenes',
    label: 'Genes at 5th Percentile BMD',
    category: 'Gene Counts',
    description: 'Number of genes at or below 5th percentile BMD',
  },
  {
    field: 'bmdTenthPercentileTotalGenes',
    label: 'Genes at 10th Percentile BMD',
    category: 'Gene Counts',
    description: 'Number of genes at or below 10th percentile BMD',
  },

  // ==================== Filter Counts ====================
  {
    field: 'genesWithBMDLessEqualHighDose',
    label: 'Genes BMD \u2264 High Dose',
    category: 'Filter Counts',
    description: 'Genes with BMD at or below highest dose',
  },
  {
    field: 'genesWithBMDpValueGreaterEqualValue',
    label: 'Genes P-Value Filter Pass',
    category: 'Filter Counts',
    description: 'Genes passing BMD p-value filter',
  },
  {
    field: 'genesWithFoldChangeAboveValue',
    label: 'Genes Fold Change Filter Pass',
    category: 'Filter Counts',
    description: 'Genes passing fold change filter',
  },
  {
    field: 'genesWithBMDRSquaredValueGreaterEqualValue',
    label: 'Genes R\u00b2 Filter Pass',
    category: 'Filter Counts',
    description: 'Genes passing R-squared filter',
  },
  {
    field: 'genesWithBMDBMDLRatioBelowValue',
    label: 'Genes BMD/BMDL Ratio Filter Pass',
    category: 'Filter Counts',
    description: 'Genes passing BMD/BMDL ratio filter',
  },
  {
    field: 'genesWithBMDUBMDLRatioBelowValue',
    label: 'Genes BMDU/BMDL Ratio Filter Pass',
    category: 'Filter Counts',
    description: 'Genes passing BMDU/BMDL ratio filter',
  },
  {
    field: 'genesWithBMDUBMDRatioBelowValue',
    label: 'Genes BMDU/BMD Ratio Filter Pass',
    category: 'Filter Counts',
    description: 'Genes passing BMDU/BMD ratio filter',
  },
  {
    field: 'genesNotStepFunction',
    label: 'Genes Not Step Function',
    category: 'Filter Counts',
    description: 'Genes that are not step functions',
  },
  {
    field: 'genesNotStepFunctionWithBMDLower',
    label: 'Non-Step Genes BMD Lower',
    category: 'Filter Counts',
    description: 'Non-step function genes with lower BMD',
  },
  {
    field: 'genesNotAdverseDirection',
    label: 'Genes Not Adverse Direction',
    category: 'Filter Counts',
    description: 'Genes not in adverse direction',
  },
  {
    field: 'genesWithABSZScoreAboveValue',
    label: 'Genes |Z-Score| Filter Pass',
    category: 'Filter Counts',
    description: 'Genes passing absolute Z-score filter',
  },
  {
    field: 'genesWithABSModelFCAboveValue',
    label: 'Genes |Model FC| Filter Pass',
    category: 'Filter Counts',
    description: 'Genes passing absolute model fold change filter',
  },
  {
    field: 'genesWithPrefilterPValueAboveValue',
    label: 'Genes Prefilter P-Value Pass',
    category: 'Filter Counts',
    description: 'Genes passing prefilter p-value threshold',
  },
  {
    field: 'genesWithPrefilterAdjustedPValueAboveValue',
    label: 'Genes Adj. Prefilter P-Value Pass',
    category: 'Filter Counts',
    description: 'Genes passing adjusted prefilter p-value threshold',
  },
  {
    field: 'genesWithNFoldBelowLowPostiveDoseValue',
    label: 'Genes N-Fold Below Dose',
    category: 'Filter Counts',
    description: 'Genes with N-fold below lowest positive dose',
  },

  // ==================== Directional Statistics ====================
  {
    field: 'percentWithOverallDirectionUP',
    label: '% Direction Up',
    category: 'Directional Statistics',
    isCommon: true,
    description: 'Percentage of genes with upward direction',
  },
  {
    field: 'percentWithOverallDirectionDOWN',
    label: '% Direction Down',
    category: 'Directional Statistics',
    isCommon: true,
    description: 'Percentage of genes with downward direction',
  },
  {
    field: 'percentWithOverallDirectionConflict',
    label: '% Direction Conflict',
    category: 'Directional Statistics',
    description: 'Percentage of genes with conflicting direction',
  },
  {
    field: 'genesAdverseUpCount',
    label: 'Adverse Up Count',
    category: 'Directional Statistics',
    description: 'Genes with adverse upward direction',
  },
  {
    field: 'genesAdverseDownCount',
    label: 'Adverse Down Count',
    category: 'Directional Statistics',
    description: 'Genes with adverse downward direction',
  },
  {
    field: 'adverseConflictCount',
    label: 'Adverse Conflict Count',
    category: 'Directional Statistics',
    description: 'Genes with adverse direction conflict',
  },
  // Up-regulated gene statistics
  {
    field: 'genesUpBMDMean',
    label: 'Up Genes BMD Mean',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Mean BMD of up-regulated genes',
  },
  {
    field: 'genesUpBMDMedian',
    label: 'Up Genes BMD Median',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Median BMD of up-regulated genes',
  },
  {
    field: 'genesUpBMDLMean',
    label: 'Up Genes BMDL Mean',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Mean BMDL of up-regulated genes',
  },
  {
    field: 'genesUpBMDLMedian',
    label: 'Up Genes BMDL Median',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Median BMDL of up-regulated genes',
  },
  {
    field: 'genesUpBMDUMean',
    label: 'Up Genes BMDU Mean',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Mean BMDU of up-regulated genes',
  },
  {
    field: 'genesUpBMDUMedian',
    label: 'Up Genes BMDU Median',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Median BMDU of up-regulated genes',
  },
  // Down-regulated gene statistics
  {
    field: 'genesDownBMDMean',
    label: 'Down Genes BMD Mean',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Mean BMD of down-regulated genes',
  },
  {
    field: 'genesDownBMDMedian',
    label: 'Down Genes BMD Median',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Median BMD of down-regulated genes',
  },
  {
    field: 'genesDownBMDLMean',
    label: 'Down Genes BMDL Mean',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Mean BMDL of down-regulated genes',
  },
  {
    field: 'genesDownBMDLMedian',
    label: 'Down Genes BMDL Median',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Median BMDL of down-regulated genes',
  },
  {
    field: 'genesDownBMDUMean',
    label: 'Down Genes BMDU Mean',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Mean BMDU of down-regulated genes',
  },
  {
    field: 'genesDownBMDUMedian',
    label: 'Down Genes BMDU Median',
    category: 'Directional Statistics',
    suggestedLogScale: true,
    description: 'Median BMDU of down-regulated genes',
  },

  // ==================== Fold Change ====================
  {
    field: 'totalFoldChange',
    label: 'Total Fold Change',
    category: 'Fold Change',
    description: 'Sum of fold changes',
  },
  {
    field: 'meanFoldChange',
    label: 'Mean Fold Change',
    category: 'Fold Change',
    isCommon: true,
    description: 'Mean fold change across genes',
  },
  {
    field: 'medianFoldChange',
    label: 'Median Fold Change',
    category: 'Fold Change',
    description: 'Median fold change across genes',
  },
  {
    field: 'maxFoldChange',
    label: 'Max Fold Change',
    category: 'Fold Change',
    description: 'Maximum fold change in category',
  },
  {
    field: 'minFoldChange',
    label: 'Min Fold Change',
    category: 'Fold Change',
    description: 'Minimum fold change in category',
  },
  {
    field: 'stdDevFoldChange',
    label: 'Fold Change Std Dev',
    category: 'Fold Change',
    description: 'Standard deviation of fold changes',
  },

  // ==================== Z-Score ====================
  {
    field: 'meanZScore',
    label: 'Mean Z-Score',
    category: 'Z-Score',
    isCommon: true,
    description: 'Mean Z-score across genes',
  },
  {
    field: 'medianZScore',
    label: 'Median Z-Score',
    category: 'Z-Score',
    description: 'Median Z-score across genes',
  },
  {
    field: 'maxZScore',
    label: 'Max Z-Score',
    category: 'Z-Score',
    description: 'Maximum Z-score in category',
  },
  {
    field: 'minZScore',
    label: 'Min Z-Score',
    category: 'Z-Score',
    description: 'Minimum Z-score in category',
  },

  // ==================== Model Fold Change ====================
  {
    field: 'meanModelFoldChange',
    label: 'Mean Model Fold Change',
    category: 'Fold Change',
    description: 'Mean model-predicted fold change',
  },
  {
    field: 'medianModelFoldChange',
    label: 'Median Model Fold Change',
    category: 'Fold Change',
    description: 'Median model-predicted fold change',
  },
  {
    field: 'maxModelFoldChange',
    label: 'Max Model Fold Change',
    category: 'Fold Change',
    description: 'Maximum model-predicted fold change',
  },
  {
    field: 'minModelFoldChange',
    label: 'Min Model Fold Change',
    category: 'Fold Change',
    description: 'Minimum model-predicted fold change',
  },

  // ==================== Ratios ====================
  {
    field: 'bmduDivBmdlMedian',
    label: 'BMDU/BMDL Median Ratio',
    category: 'Ratios',
    description: 'Ratio of BMDU to BMDL (median)',
  },
  {
    field: 'bmdDivBmdlMedian',
    label: 'BMD/BMDL Median Ratio',
    category: 'Ratios',
    description: 'Ratio of BMD to BMDL (median)',
  },
  {
    field: 'bmduDivBmdMedian',
    label: 'BMDU/BMD Median Ratio',
    category: 'Ratios',
    description: 'Ratio of BMDU to BMD (median)',
  },
  {
    field: 'bmduDivBmdlMean',
    label: 'BMDU/BMDL Mean Ratio',
    category: 'Ratios',
    description: 'Ratio of BMDU to BMDL (mean)',
  },
  {
    field: 'bmdDivBmdlMean',
    label: 'BMD/BMDL Mean Ratio',
    category: 'Ratios',
    description: 'Ratio of BMD to BMDL (mean)',
  },
  {
    field: 'bmduDivBmdMean',
    label: 'BMDU/BMD Mean Ratio',
    category: 'Ratios',
    description: 'Ratio of BMDU to BMD (mean)',
  },

  // ==================== Confidence Intervals ====================
  {
    field: 'bmdLower95',
    label: 'BMD Lower 95% CI',
    category: 'Confidence Intervals',
    suggestedLogScale: true,
    description: 'Lower 95% confidence interval for BMD',
  },
  {
    field: 'bmdUpper95',
    label: 'BMD Upper 95% CI',
    category: 'Confidence Intervals',
    suggestedLogScale: true,
    description: 'Upper 95% confidence interval for BMD',
  },
  {
    field: 'bmdlLower95',
    label: 'BMDL Lower 95% CI',
    category: 'Confidence Intervals',
    suggestedLogScale: true,
    description: 'Lower 95% confidence interval for BMDL',
  },
  {
    field: 'bmdlUpper95',
    label: 'BMDL Upper 95% CI',
    category: 'Confidence Intervals',
    suggestedLogScale: true,
    description: 'Upper 95% confidence interval for BMDL',
  },
  {
    field: 'bmduLower95',
    label: 'BMDU Lower 95% CI',
    category: 'Confidence Intervals',
    suggestedLogScale: true,
    description: 'Lower 95% confidence interval for BMDU',
  },
  {
    field: 'bmduUpper95',
    label: 'BMDU Upper 95% CI',
    category: 'Confidence Intervals',
    suggestedLogScale: true,
    description: 'Upper 95% confidence interval for BMDU',
  },

  // ==================== Weighted Statistics ====================
  {
    field: 'bmdWMean',
    label: 'BMD Weighted Mean',
    category: 'Weighted Statistics',
    suggestedLogScale: true,
    description: 'Weighted mean of BMD values',
  },
  {
    field: 'bmdWSD',
    label: 'BMD Weighted Std Dev',
    category: 'Weighted Statistics',
    description: 'Weighted standard deviation of BMD',
  },
  {
    field: 'bmdlWMean',
    label: 'BMDL Weighted Mean',
    category: 'Weighted Statistics',
    suggestedLogScale: true,
    description: 'Weighted mean of BMDL values',
  },
  {
    field: 'bmdlWSD',
    label: 'BMDL Weighted Std Dev',
    category: 'Weighted Statistics',
    description: 'Weighted standard deviation of BMDL',
  },
  {
    field: 'bmduWMean',
    label: 'BMDU Weighted Mean',
    category: 'Weighted Statistics',
    suggestedLogScale: true,
    description: 'Weighted mean of BMDU values',
  },
  {
    field: 'bmduWSD',
    label: 'BMDU Weighted Std Dev',
    category: 'Weighted Statistics',
    description: 'Weighted standard deviation of BMDU',
  },

  // ==================== Other ====================
  {
    field: 'gotermLevel',
    label: 'GO Term Level',
    category: 'Other',
    description: 'Level in Gene Ontology hierarchy',
  },
];

/**
 * Get fields by category.
 */
export function getFieldsByCategory(): Map<FieldCategory, ChartFieldDef[]> {
  const map = new Map<FieldCategory, ChartFieldDef[]>();

  CATEGORY_FIELDS.forEach(field => {
    const existing = map.get(field.category) || [];
    existing.push(field);
    map.set(field.category, existing);
  });

  return map;
}

/**
 * Get commonly used fields (for quick pick UI).
 */
export function getCommonFields(): ChartFieldDef[] {
  return CATEGORY_FIELDS.filter(f => f.isCommon);
}

/**
 * Get a field definition by field name.
 */
export function getFieldDef(field: string): ChartFieldDef | undefined {
  return CATEGORY_FIELDS.find(f => f.field === field);
}

/**
 * Get field label for a field name.
 */
export function getFieldLabel(field: string): string {
  return getFieldDef(field)?.label || field;
}

/**
 * Build a lookup map of field -> label.
 */
export function buildFieldLabelsMap(): Record<string, string> {
  const map: Record<string, string> = {};
  CATEGORY_FIELDS.forEach(f => {
    map[f.field] = f.label;
  });
  return map;
}

/**
 * All available field categories in display order.
 */
export const FIELD_CATEGORIES: FieldCategory[] = [
  'BMD Statistics',
  'BMDL Statistics',
  'BMDU Statistics',
  'Percentiles',
  'Fisher Statistics',
  'Gene Counts',
  'Filter Counts',
  'Directional Statistics',
  'Fold Change',
  'Z-Score',
  'Ratios',
  'Confidence Intervals',
  'Weighted Statistics',
  'Other',
];
