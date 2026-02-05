/**
 * useBmdMetric Hook
 *
 * Manages BMD metric selection state with memoized helpers.
 * Use this hook in chart components that need metric selection.
 */

import { useState, useCallback, useMemo } from 'react';
import type CategoryAnalysisResultDto from '../../../generated/com/sciome/dto/CategoryAnalysisResultDto';
import {
  BmdBaseType,
  BmdStatType,
  BmdMetricSpec,
  getFieldName,
  getMetricLabel,
  getMetricShortLabel,
  extractMetricValue,
  extractMetricValueWithFallback,
} from '../utils/bmdMetricConfig';

export interface UseBmdMetricResult {
  /** Current base type */
  base: BmdBaseType;
  /** Set the base type */
  setBase: (base: BmdBaseType) => void;
  /** Current statistic type */
  stat: BmdStatType;
  /** Set the statistic type */
  setStat: (stat: BmdStatType) => void;
  /** Combined metric specification */
  spec: BmdMetricSpec;
  /** DTO field name for this metric */
  fieldName: keyof CategoryAnalysisResultDto;
  /** Human-readable label (e.g., "BMD Mean") */
  label: string;
  /** Short label for axes (e.g., "BMD Med") */
  shortLabel: string;
  /** Extract value from a data row */
  getValue: (row: CategoryAnalysisResultDto) => number | undefined;
  /** Extract value with fallback to another stat */
  getValueWithFallback: (row: CategoryAnalysisResultDto, fallbackStat: BmdStatType) => number | undefined;
}

/**
 * Hook for managing a single BMD metric selection.
 * Supports controlled mode: if controlledStat is provided, it overrides internal state.
 */
export function useBmdMetric(
  initialBase: BmdBaseType = 'bmd',
  initialStat: BmdStatType = 'median',
  controlledStat?: BmdStatType
): UseBmdMetricResult {
  const [base, setBase] = useState<BmdBaseType>(initialBase);
  const [internalStat, setInternalStat] = useState<BmdStatType>(initialStat);

  // Use controlled stat if provided, otherwise use internal state
  const stat = controlledStat ?? internalStat;
  const setStat = setInternalStat;

  const spec: BmdMetricSpec = useMemo(() => ({ base, stat }), [base, stat]);

  const fieldName = useMemo(() => getFieldName(spec), [spec]);
  const label = useMemo(() => getMetricLabel(spec), [spec]);
  const shortLabel = useMemo(() => getMetricShortLabel(spec), [spec]);

  const getValue = useCallback(
    (row: CategoryAnalysisResultDto) => extractMetricValue(row, spec),
    [spec]
  );

  const getValueWithFallback = useCallback(
    (row: CategoryAnalysisResultDto, fallbackStat: BmdStatType) =>
      extractMetricValueWithFallback(row, spec, fallbackStat),
    [spec]
  );

  return {
    base,
    setBase,
    stat,
    setStat,
    spec,
    fieldName,
    label,
    shortLabel,
    getValue,
    getValueWithFallback,
  };
}

/**
 * Hook for managing paired BMD metrics (e.g., BMD vs BMDL scatter).
 * Both metrics share the same statistic type but have different bases.
 */
export interface UseBmdMetricPairResult {
  /** Statistic type (shared by both metrics) */
  stat: BmdStatType;
  /** Set the statistic type */
  setStat: (stat: BmdStatType) => void;
  /** First metric (e.g., BMD) */
  metric1: {
    base: BmdBaseType;
    spec: BmdMetricSpec;
    label: string;
    shortLabel: string;
    getValue: (row: CategoryAnalysisResultDto) => number | undefined;
  };
  /** Second metric (e.g., BMDL) */
  metric2: {
    base: BmdBaseType;
    spec: BmdMetricSpec;
    label: string;
    shortLabel: string;
    getValue: (row: CategoryAnalysisResultDto) => number | undefined;
  };
}

export function useBmdMetricPair(
  base1: BmdBaseType,
  base2: BmdBaseType,
  initialStat: BmdStatType = 'median'
): UseBmdMetricPairResult {
  const [stat, setStat] = useState<BmdStatType>(initialStat);

  const spec1: BmdMetricSpec = useMemo(() => ({ base: base1, stat }), [base1, stat]);
  const spec2: BmdMetricSpec = useMemo(() => ({ base: base2, stat }), [base2, stat]);

  const metric1 = useMemo(() => ({
    base: base1,
    spec: spec1,
    label: getMetricLabel(spec1),
    shortLabel: getMetricShortLabel(spec1),
    getValue: (row: CategoryAnalysisResultDto) => extractMetricValue(row, spec1),
  }), [base1, spec1]);

  const metric2 = useMemo(() => ({
    base: base2,
    spec: spec2,
    label: getMetricLabel(spec2),
    shortLabel: getMetricShortLabel(spec2),
    getValue: (row: CategoryAnalysisResultDto) => extractMetricValue(row, spec2),
  }), [base2, spec2]);

  return {
    stat,
    setStat,
    metric1,
    metric2,
  };
}

/**
 * Hook for managing triple BMD metrics (BMD, BMDL, BMDU with same stat).
 * Useful for charts that show all three on the same visualization.
 */
export interface UseBmdMetricTripleResult {
  /** Statistic type (shared by all metrics) */
  stat: BmdStatType;
  /** Set the statistic type */
  setStat: (stat: BmdStatType) => void;
  /** BMD metric */
  bmd: {
    spec: BmdMetricSpec;
    label: string;
    shortLabel: string;
    getValue: (row: CategoryAnalysisResultDto) => number | undefined;
  };
  /** BMDL metric */
  bmdl: {
    spec: BmdMetricSpec;
    label: string;
    shortLabel: string;
    getValue: (row: CategoryAnalysisResultDto) => number | undefined;
  };
  /** BMDU metric */
  bmdu: {
    spec: BmdMetricSpec;
    label: string;
    shortLabel: string;
    getValue: (row: CategoryAnalysisResultDto) => number | undefined;
  };
}

export function useBmdMetricTriple(
  initialStat: BmdStatType = 'median',
  controlledStat?: BmdStatType
): UseBmdMetricTripleResult {
  const [internalStat, setInternalStat] = useState<BmdStatType>(initialStat);

  // Use controlled stat if provided, otherwise use internal state
  const stat = controlledStat ?? internalStat;
  const setStat = setInternalStat;

  const createMetric = useCallback((base: BmdBaseType) => {
    const spec: BmdMetricSpec = { base, stat };
    return {
      spec,
      label: getMetricLabel(spec),
      shortLabel: getMetricShortLabel(spec),
      getValue: (row: CategoryAnalysisResultDto) => extractMetricValue(row, spec),
    };
  }, [stat]);

  const bmd = useMemo(() => createMetric('bmd'), [createMetric]);
  const bmdl = useMemo(() => createMetric('bmdl'), [createMetric]);
  const bmdu = useMemo(() => createMetric('bmdu'), [createMetric]);

  return {
    stat,
    setStat,
    bmd,
    bmdl,
    bmdu,
  };
}
