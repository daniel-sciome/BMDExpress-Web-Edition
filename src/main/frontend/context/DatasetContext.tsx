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
