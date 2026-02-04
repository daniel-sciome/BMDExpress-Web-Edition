/**
 * BMD Metric Configuration
 *
 * Centralized configuration for BMD metric selection across all charts.
 * Supports: BMD, BMDL, BMDU × Mean, Median, Min, Max, SD, Weighted, Percentiles
 */

import type CategoryAnalysisResultDto from '../../../generated/com/sciome/dto/CategoryAnalysisResultDto';

// Base types (BMD, BMDL, BMDU)
export type BmdBaseType = 'bmd' | 'bmdl' | 'bmdu';

// Statistic types
export type BmdStatType =
  | 'mean'
  | 'median'
  | 'minimum'
  | 'maximum'
  | 'sd'
  | 'wMean'
  | 'wSd'
  | 'fifthPercentile'
  | 'tenthPercentile';

// Full metric specification
export interface BmdMetricSpec {
  base: BmdBaseType;
  stat: BmdStatType;
}

// Grouped dropdown options for statistics
export const STAT_OPTIONS = [
  {
    label: 'Core Statistics',
    options: [
      { value: 'mean' as BmdStatType, label: 'Mean' },
      { value: 'median' as BmdStatType, label: 'Median' },
      { value: 'minimum' as BmdStatType, label: 'Minimum' },
      { value: 'maximum' as BmdStatType, label: 'Maximum' },
      { value: 'sd' as BmdStatType, label: 'Std Dev' },
    ],
  },
  {
    label: 'Weighted',
    options: [
      { value: 'wMean' as BmdStatType, label: 'Weighted Mean' },
      { value: 'wSd' as BmdStatType, label: 'Weighted SD' },
    ],
  },
  {
    label: 'Percentiles',
    options: [
      { value: 'fifthPercentile' as BmdStatType, label: '5th Percentile' },
      { value: 'tenthPercentile' as BmdStatType, label: '10th Percentile' },
    ],
  },
];

// Flat list of stat options (for simpler dropdowns)
export const STAT_OPTIONS_FLAT = STAT_OPTIONS.flatMap(g => g.options);

// Base type options
export const BASE_OPTIONS: { value: BmdBaseType; label: string }[] = [
  { value: 'bmd', label: 'BMD' },
  { value: 'bmdl', label: 'BMDL' },
  { value: 'bmdu', label: 'BMDU' },
];

// Map stat type to field suffix
const STAT_SUFFIX_MAP: Record<BmdStatType, string> = {
  mean: 'Mean',
  median: 'Median',
  minimum: 'Minimum',
  maximum: 'Maximum',
  sd: 'SD',
  wMean: 'WMean',
  wSd: 'WSD',
  fifthPercentile: 'FifthPercentile',
  tenthPercentile: 'TenthPercentile',
};

/**
 * Get the DTO field name for a metric specification.
 * Examples: bmdMean, bmdlMedian, bmduFifthPercentile
 */
export function getFieldName(spec: BmdMetricSpec): keyof CategoryAnalysisResultDto {
  return `${spec.base}${STAT_SUFFIX_MAP[spec.stat]}` as keyof CategoryAnalysisResultDto;
}

/**
 * Extract the metric value from a data row.
 */
export function extractMetricValue(
  row: CategoryAnalysisResultDto,
  spec: BmdMetricSpec
): number | undefined {
  const fieldName = getFieldName(spec);
  const value = row[fieldName];
  return typeof value === 'number' ? value : undefined;
}

/**
 * Extract metric value with fallback to another stat type.
 * Useful when some rows may not have all metric types.
 */
export function extractMetricValueWithFallback(
  row: CategoryAnalysisResultDto,
  spec: BmdMetricSpec,
  fallbackStat: BmdStatType
): number | undefined {
  const primary = extractMetricValue(row, spec);
  if (primary !== undefined) return primary;
  return extractMetricValue(row, { base: spec.base, stat: fallbackStat });
}

/**
 * Get a human-readable label for the metric.
 * Examples: "BMD Mean", "BMDL 5th Percentile"
 */
export function getMetricLabel(spec: BmdMetricSpec): string {
  const baseLabel = spec.base.toUpperCase();
  const statOption = STAT_OPTIONS_FLAT.find(o => o.value === spec.stat);
  const statLabel = statOption?.label ?? spec.stat;
  return `${baseLabel} ${statLabel}`;
}

/**
 * Get a short label for the metric (for axis labels, etc.)
 * Examples: "BMD Mean", "BMDL Med", "BMDU 5%"
 */
export function getMetricShortLabel(spec: BmdMetricSpec): string {
  const baseLabel = spec.base.toUpperCase();
  const shortStatMap: Record<BmdStatType, string> = {
    mean: 'Mean',
    median: 'Med',
    minimum: 'Min',
    maximum: 'Max',
    sd: 'SD',
    wMean: 'WMean',
    wSd: 'WSD',
    fifthPercentile: '5%',
    tenthPercentile: '10%',
  };
  return `${baseLabel} ${shortStatMap[spec.stat]}`;
}

/**
 * Check if two metric specs are equal.
 */
export function specEquals(a: BmdMetricSpec, b: BmdMetricSpec): boolean {
  return a.base === b.base && a.stat === b.stat;
}

/**
 * Create a metric spec from base and stat.
 */
export function createSpec(base: BmdBaseType, stat: BmdStatType): BmdMetricSpec {
  return { base, stat };
}

/**
 * Default metric specs for common use cases.
 */
export const DEFAULT_SPECS = {
  bmdMedian: createSpec('bmd', 'median'),
  bmdMean: createSpec('bmd', 'mean'),
  bmdlMedian: createSpec('bmdl', 'median'),
  bmdlMean: createSpec('bmdl', 'mean'),
  bmduMedian: createSpec('bmdu', 'median'),
  bmduMean: createSpec('bmdu', 'mean'),
} as const;
