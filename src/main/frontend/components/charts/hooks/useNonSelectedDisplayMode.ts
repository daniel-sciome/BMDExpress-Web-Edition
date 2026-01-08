/**
 * Custom hook for managing non-selected cluster display mode state
 *
 * This hook manages the visibility state for non-selected clusters in reactive charts.
 * It integrates with the global displayMode from visibilitySlice while allowing
 * per-chart override via legend interaction.
 *
 * Global displayMode mapping:
 * - 'highlight' → 'full': Show all normally, just highlight selected
 * - 'dim' → 'outline': Dim non-selected (hollow markers with colored borders)
 * - 'isolate' → 'hidden': Hide non-selected (opacity 0)
 *
 * The hook:
 * 1. Reads global displayMode from visibilitySlice
 * 2. Maps to chart-level NonSelectedDisplayMode
 * 3. Allows local override via setNonSelectedDisplayMode
 * 4. Auto-resets to global mode when selection is cleared
 *
 * @param hasSelection - Boolean indicating whether any items are currently selected
 * @returns Tuple of [currentMode, setMode] for state management
 *
 * @example
 * ```tsx
 * const hasSelection = selectedIds.size > 0;
 * const [nonSelectedDisplayMode, setNonSelectedDisplayMode] = useNonSelectedDisplayMode(hasSelection);
 *
 * // In legend click handler for cycling:
 * if (nonSelectedDisplayMode === 'outline') {
 *   setNonSelectedDisplayMode('hidden'); // Cycle to hidden
 * } else if (nonSelectedDisplayMode === 'hidden') {
 *   setNonSelectedDisplayMode('full'); // Cycle to full
 *   categoryState.handleClear();
 * }
 * ```
 */

import { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from 'Frontend/store/hooks';
import { selectDisplayMode } from 'Frontend/store/slices/visibilitySlice';
import type { DisplayMode } from 'Frontend/types/visibilityTypes';

export type NonSelectedDisplayMode = 'full' | 'outline' | 'hidden';

/**
 * Map global displayMode to chart-level NonSelectedDisplayMode
 */
function mapDisplayModeToChartMode(displayMode: DisplayMode): NonSelectedDisplayMode {
  switch (displayMode) {
    case 'highlight':
      return 'full';
    case 'dim':
      return 'outline';
    case 'isolate':
      return 'hidden';
    default:
      return 'outline'; // Default to dim behavior
  }
}

export function useNonSelectedDisplayMode(hasSelection: boolean) {
  // Get global display mode from Redux
  const globalDisplayMode = useAppSelector(selectDisplayMode);

  // Calculate the default mode from global state
  const defaultMode = useMemo(
    () => mapDisplayModeToChartMode(globalDisplayMode),
    [globalDisplayMode]
  );

  // Local override state (null means use global default)
  const [localOverride, setLocalOverride] = useState<NonSelectedDisplayMode | null>(null);

  // Effective display mode: local override if set, otherwise global default
  const nonSelectedDisplayMode = localOverride ?? defaultMode;

  // Create a setter that can override the global default
  const setNonSelectedDisplayMode = (mode: NonSelectedDisplayMode) => {
    setLocalOverride(mode);
  };

  // Reset local override when selection is cleared
  useEffect(() => {
    if (!hasSelection) {
      setLocalOverride(null);
    }
  }, [hasSelection]);

  // Reset local override when global mode changes
  useEffect(() => {
    setLocalOverride(null);
  }, [globalDisplayMode]);

  return [nonSelectedDisplayMode, setNonSelectedDisplayMode] as const;
}
