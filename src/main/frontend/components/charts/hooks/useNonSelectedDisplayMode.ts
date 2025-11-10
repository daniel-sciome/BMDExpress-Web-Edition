/**
 * Custom hook for managing non-selected cluster display mode state
 *
 * This hook manages the visibility state for non-selected clusters in reactive charts.
 * When clusters are selected, non-selected clusters can be displayed in three modes:
 * - 'full': Normal display (default)
 * - 'outline': Hollow markers with colored borders
 * - 'hidden': Completely hidden (opacity 0)
 *
 * The hook automatically resets to 'full' mode when selection is cleared.
 *
 * @param hasSelection - Boolean indicating whether any items are currently selected
 * @returns Tuple of [currentMode, setMode] for state management
 *
 * @example
 * ```tsx
 * const hasSelection = selectedIds.size > 0;
 * const [nonSelectedDisplayMode, setNonSelectedDisplayMode] = useNonSelectedDisplayMode(hasSelection);
 *
 * // In legend click handler:
 * if (!isClusterSelected) {
 *   setNonSelectedDisplayMode('outline'); // First click: select and outline others
 * } else if (nonSelectedDisplayMode === 'outline') {
 *   setNonSelectedDisplayMode('hidden'); // Second click: hide others
 * } else if (nonSelectedDisplayMode === 'hidden') {
 *   setNonSelectedDisplayMode('full'); // Third click: deselect and show all
 *   categoryState.handleClear();
 * }
 * ```
 */

import { useState, useEffect } from 'react';

export type NonSelectedDisplayMode = 'full' | 'outline' | 'hidden';

export function useNonSelectedDisplayMode(hasSelection: boolean) {
  const [nonSelectedDisplayMode, setNonSelectedDisplayMode] = useState<NonSelectedDisplayMode>('full');

  // Auto-reset to 'full' when selection is cleared
  useEffect(() => {
    if (!hasSelection) {
      setNonSelectedDisplayMode('full');
    }
  }, [hasSelection]);

  return [nonSelectedDisplayMode, setNonSelectedDisplayMode] as const;
}
