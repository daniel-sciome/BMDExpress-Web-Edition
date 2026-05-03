// useReactiveState.ts
// Generic hook for reactive selection state
// Phase 4: Chart Reactivity Infrastructure

import { useAppDispatch, useAppSelector } from 'Frontend/store/hooks';
import {
  setReactiveSelection,
  toggleReactiveSelection,
  clearReactiveSelection,
} from 'Frontend/store/slices/categoryResultsSlice';
import type { ReactiveType, SelectionSource } from 'Frontend/types/reactiveTypes';
import { useDatasetContext } from 'Frontend/context/DatasetContext';

/**
 * Generic hook for reactive state management
 *
 * Components declare what they're "reactive to" (categoryId, clusterId, etc.)
 * and get selection state + handlers for that dimension.
 *
 * @param reactTo - The type of selection this component reacts to
 * @returns Selection state and handlers
 *
 * @example
 * // Chart reactive to individual categories
 * const { selectedIds, handleSelect } = useReactiveState('categoryId');
 *
 * @example
 * // UMAP chart reactive to both categories and clusters
 * const categoryState = useReactiveState('categoryId');
 * const clusterState = useReactiveState('clusterId');
 */
export function useReactiveState(reactTo: ReactiveType) {
  const dispatch = useAppDispatch();
  // If we're rendered under a DatasetProvider that carries its own reactive
  // selection (multi-dataset mode), prefer that over the global Redux slice so
  // each dataset column maintains an independent selection. In single-dataset
  // mode this is null and we fall through to the Redux path as before.
  const datasetCtx = useDatasetContext();
  const ctxReactive = datasetCtx?.reactiveSelection;

  // Map reactTo to Redux/context state path
  const stateKey = reactTo === 'categoryId' ? 'category' : 'cluster';

  // CRITICAL: Select the entire parent object with a custom equality check
  // We must check if the selectedIds Set reference has changed, not just the parent object.
  // Always read Redux — React hooks must be called unconditionally and in the
  // same order on every render.
  const reduxSelectionState = useAppSelector(
    (state) => state.categoryResults.reactiveSelection[stateKey],
    (left, right) => {
      // Custom equality: check if the Set references are the same
      return left.selectedIds === right.selectedIds && left.source === right.source;
    }
  );

  // Pick the live state: per-dataset context if provided, else Redux.
  const selectionState = ctxReactive
    ? ctxReactive.state[stateKey]
    : reduxSelectionState;

  // Extract fields from the selection state
  const selectedIds = selectionState.selectedIds;
  const source = selectionState.source;

  /**
   * Check if a specific ID is selected
   */
  const isSelected = (id: string | number): boolean => {
    // Safe: Set.has() accepts any value at runtime; cast to unified type for TS
    return (selectedIds as Set<string | number>).has(id);
  };

  /**
   * Check if anything is selected for this reactive type
   */
  const isAnythingSelected = selectedIds.size > 0;

  /**
   * Select a single ID (or toggle if multiSelect)
   *
   * @param id - The ID to select
   * @param isMultiSelect - If true, toggle; if false, replace selection
   * @param source - Where the selection originated from
   */
  const handleSelect = (id: string | number, isMultiSelect: boolean, source: SelectionSource) => {
    if (ctxReactive) {
      // Route mutations through the per-dataset handlers so the selection
      // stays scoped to this dataset's context and never touches Redux.
      if (isMultiSelect) {
        ctxReactive.toggle(stateKey, id);
      } else {
        ctxReactive.setAll(stateKey, [id], source);
      }
      return;
    }
    if (isMultiSelect) {
      dispatch(toggleReactiveSelection({ type: stateKey, id }));
    } else {
      dispatch(setReactiveSelection({ type: stateKey, ids: [id], source }));
    }
  };

  /**
   * Select multiple IDs at once
   *
   * @param ids - Array of IDs to select
   * @param source - Where the selection originated from
   */
  const handleMultiSelect = (ids: (string | number)[], source: SelectionSource) => {
    if (ctxReactive) {
      ctxReactive.setAll(stateKey, ids, source);
      return;
    }
    dispatch(setReactiveSelection({ type: stateKey, ids, source }));
  };

  /**
   * Clear all selection for this reactive type
   */
  const handleClear = () => {
    if (ctxReactive) {
      ctxReactive.clear(stateKey);
      return;
    }
    dispatch(clearReactiveSelection(stateKey));
  };

  return {
    selectedIds,
    source,
    isSelected,
    isAnythingSelected,
    handleSelect,
    handleMultiSelect,
    handleClear,
  };
}
