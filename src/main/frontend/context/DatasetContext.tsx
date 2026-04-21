/**
 * DatasetContext — Provides per-dataset category results data to chart components.
 *
 * When rendering multiple datasets side by side, each dataset's charts are wrapped
 * in a DatasetProvider that supplies the data for that specific dataset. Chart hooks
 * (useFocusAwareStyling, etc.) read from this context when available, falling back
 * to the shared Redux slice for single-dataset mode.
 *
 * This avoids the problem of multiple chart instances fighting over the same Redux
 * slice when rendered simultaneously.
 */

import React, { createContext, useContext } from 'react';
import type { CategoryWithFocus } from '../types/categoryTypes';
import type { CategoryAnalysisResultWithCluster } from '../store/slices/categoryResultsSlice';
import type { ReactiveSelectionMap, SelectionSource } from '../types/reactiveTypes';

/**
 * Per-dataset reactive selection subsystem.
 *
 * In single-dataset mode selection state lives globally in the Redux slice, so
 * every chart shares one Set of selected category/cluster IDs. That does not
 * work in multi-dataset mode: clicking a point in dataset A must not highlight
 * the same-id point in dataset B, and each dataset's filter/selection sync is
 * independent. This context carries an isolated state + handler bundle for
 * each dataset. When `useReactiveState` finds one, it uses it instead of
 * dispatching to Redux.
 */
export interface DatasetReactiveSelection {
  /** Current per-dataset selection snapshot (category + cluster Sets). */
  state: ReactiveSelectionMap;
  /** Replace the selection for a type with the given ids. */
  setAll: (
    type: 'category' | 'cluster',
    ids: (string | number)[],
    source: SelectionSource
  ) => void;
  /** Toggle one id in/out of the selection for a type. */
  toggle: (type: 'category' | 'cluster', id: string | number) => void;
  /** Clear the selection for a type. */
  clear: (type: 'category' | 'cluster') => void;
}

/**
 * The full data type used throughout the app — category results with both
 * focus state (from filtering) and cluster assignment (from UMAP).
 * This matches what selectSortedDataWithFocus returns from Redux.
 */
export type CategoryDataRow = CategoryAnalysisResultWithCluster & CategoryWithFocus;

/**
 * The data shape provided by the context. Mirrors what useFocusAwareStyling
 * normally reads from Redux.
 */
export interface DatasetContextValue {
  /** Category results data with inFocus state and cluster info */
  data: CategoryDataRow[];
  /** Label for this dataset (shown in headers) */
  label: string;
  /** The result name (fullName from annotation) */
  resultName: string;
  /** Project ID */
  projectId: string;
  /**
   * Analysis type for this dataset (e.g. 'GENE', 'GO-BP', 'PATHWAY', etc.).
   * Needed so filter-application code can match the single-dataset carve-out
   * that skips primary filters for GENE analyses. May be null if the
   * annotation didn't carry one.
   */
  analysisType?: string | null;
  /**
   * Per-dataset reactive selection state + handlers. When present,
   * `useReactiveState` uses this instead of the global Redux slice, so each
   * dataset column maintains its own selected-category/cluster Sets. Optional
   * because the provider-in-provider chain may introduce contexts without
   * needing a selection subsystem; `useReactiveState` still has a Redux
   * fallback for that case (though in practice all multi-dataset providers
   * should supply one).
   */
  reactiveSelection?: DatasetReactiveSelection;
}

const DatasetContext = createContext<DatasetContextValue | null>(null);

/**
 * Provider component — wrap a chart (or group of charts) in this to supply
 * dataset-specific data instead of reading from Redux.
 */
export function DatasetProvider({
  value,
  children,
}: {
  value: DatasetContextValue;
  children: React.ReactNode;
}) {
  return (
    <DatasetContext.Provider value={value}>
      {children}
    </DatasetContext.Provider>
  );
}

/**
 * Hook to read from DatasetContext. Returns null if no provider is present,
 * meaning the component should fall back to Redux.
 */
export function useDatasetContext(): DatasetContextValue | null {
  return useContext(DatasetContext);
}
