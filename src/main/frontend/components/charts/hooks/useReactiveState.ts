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

  // Map reactTo to Redux state path
  const stateKey = reactTo === 'categoryId' ? 'category' : 'cluster';

  // Get selection state for this reactive type
  const selectedIds = useAppSelector(
    (state) => state.categoryResults.reactiveSelection[stateKey].selectedIds
  );

  const source = useAppSelector(
    (state) => state.categoryResults.reactiveSelection[stateKey].source
  );

  /**
   * Check if a specific ID is selected
   */
  const isSelected = (id: any): boolean => {
    return selectedIds.has(id);
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
  const handleSelect = (id: any, isMultiSelect: boolean, source: SelectionSource) => {
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
  const handleMultiSelect = (ids: any[], source: SelectionSource) => {
    dispatch(setReactiveSelection({ type: stateKey, ids, source }));
  };

  /**
   * Clear all selection for this reactive type
   */
  const handleClear = () => {
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
