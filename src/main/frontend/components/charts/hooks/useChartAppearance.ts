/**
 * useChartAppearance Hook
 *
 * Resolves the appearance cascade for a chart:
 *   App defaults < Global theme < Per-chart overrides
 *
 * Returns helpers for applying the resolved appearance to Plotly layouts
 * and a ref for export functionality.
 */

import { useRef, useMemo, useCallback } from 'react';
import { useAppSelector } from 'Frontend/store/hooks';
import {
  selectGlobalAppearance,
  selectChartAppearance,
} from 'Frontend/store/slices/chartConfigSlice';
import type { ChartAppearance } from 'Frontend/types/chartAppearance';
import { DEFAULT_CHART_APPEARANCE } from 'Frontend/types/chartAppearance';
import { mergeAppearances, applyAppearanceToLayout } from '../utils/appearanceToPlotly';
import { DEFAULT_PLOTLY_CONFIG, createImageExportConfig } from '../utils/plotlyConfig';
import type { Config } from 'plotly.js';

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

export function useChartAppearance(chartId?: string): UseChartAppearanceReturn {
  const globalAppearance = useAppSelector(selectGlobalAppearance);
  const chartAppearanceOverrides = useAppSelector(
    chartId ? selectChartAppearance(chartId) : () => undefined
  );
  const plotRef = useRef<HTMLDivElement | null>(null);

  // Resolve the cascade: default < global < per-chart
  const appearance = useMemo(() => {
    let resolved = mergeAppearances(DEFAULT_CHART_APPEARANCE, globalAppearance);
    if (chartAppearanceOverrides) {
      resolved = mergeAppearances(resolved, chartAppearanceOverrides);
    }
    return resolved;
  }, [globalAppearance, chartAppearanceOverrides]);

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
