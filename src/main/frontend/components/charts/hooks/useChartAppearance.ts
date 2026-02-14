/**
 * useChartAppearance Hook
 *
 * Resolves the appearance cascade for a chart:
 *   App defaults < Global theme < Per-chart overrides
 *
 * When a subplot parameter is provided, resolves a 4-layer cascade:
 *   App defaults < Global theme < Parent chart overrides < Subplot overrides
 *
 * Returns helpers for applying the resolved appearance to Plotly layouts
 * and a ref for export functionality.
 */

import { useRef, useMemo, useCallback } from 'react';
import { useAppSelector } from 'Frontend/store/hooks';
import {
  selectGlobalAppearance,
  selectChartAppearance,
  selectSubplotAppearance,
} from 'Frontend/store/slices/chartConfigSlice';
import type { ChartAppearance } from 'Frontend/types/chartAppearance';
import { DEFAULT_CHART_APPEARANCE } from 'Frontend/types/chartAppearance';
import { mergeAppearances, applyAppearanceToLayout } from '../utils/appearanceToPlotly';
import { DEFAULT_PLOTLY_CONFIG, createImageExportConfig } from '../utils/plotlyConfig';
import type { Config } from 'plotly.js';

export interface SubplotInfo {
  parentId: string;
  key: string;
}

interface UseChartAppearanceReturn {
  /** The fully resolved appearance (global + per-chart merged) */
  appearance: ChartAppearance;
  /** Wrap a chart's inline layout to apply appearance underneath it */
  applyToLayout: (chartLayout: Record<string, unknown>) => Record<string, unknown>;
  /** Get a Plotly config with export filename baked in */
  getConfig: (filename: string) => Partial<Config>;
  /** Ref to attach to the Plotly container div (for export) */
  plotRef: React.RefObject<HTMLDivElement | null>;
}

const noopSelector = () => undefined;

export function useChartAppearance(
  chartId?: string,
  subplot?: SubplotInfo
): UseChartAppearanceReturn {
  // Stabilize subplot identity based on primitive values to avoid useMemo churn
  const subplotParentId = subplot?.parentId;
  const subplotKey = subplot?.key;
  const isSubplot = !!subplotParentId && !!subplotKey;

  const globalAppearance = useAppSelector(selectGlobalAppearance);

  // Parent chart overrides (subplot mode only)
  const parentOverrides = useAppSelector(
    isSubplot ? selectChartAppearance(subplotParentId!) : noopSelector
  );
  // Standalone chart overrides (non-subplot mode only)
  const chartOverrides = useAppSelector(
    !isSubplot && chartId ? selectChartAppearance(chartId) : noopSelector
  );
  // Subplot overrides
  const subplotOverrides = useAppSelector(
    isSubplot ? selectSubplotAppearance(subplotParentId!, subplotKey!) : noopSelector
  );

  const plotRef = useRef<HTMLDivElement | null>(null);

  // Resolve the cascade: default < global < parent/chart < subplot
  const appearance = useMemo(() => {
    let resolved = mergeAppearances(DEFAULT_CHART_APPEARANCE, globalAppearance);
    if (isSubplot) {
      if (parentOverrides) resolved = mergeAppearances(resolved, parentOverrides);
      if (subplotOverrides) resolved = mergeAppearances(resolved, subplotOverrides);
    } else {
      if (chartOverrides) resolved = mergeAppearances(resolved, chartOverrides);
    }
    return resolved;
  }, [globalAppearance, parentOverrides, chartOverrides, subplotOverrides, isSubplot]);

  // Memoized layout applicator
  const applyToLayout = useCallback(
    (chartLayout: Record<string, unknown>): Record<string, unknown> => {
      return applyAppearanceToLayout(appearance, chartLayout);
    },
    [appearance]
  );

  // Config factory with export filename
  const getConfig = useCallback(
    (filename: string): Partial<Config> => {
      return {
        ...DEFAULT_PLOTLY_CONFIG,
        toImageButtonOptions: createImageExportConfig(filename),
      };
    },
    []
  );

  return { appearance, applyToLayout, getConfig, plotRef };
}
