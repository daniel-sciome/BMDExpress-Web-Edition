/**
 * Visibility Types
 * Type definitions for per-category visual state management.
 *
 * Architecture Overview:
 * - Default state applies to all categories unless overridden
 * - Overrides stored sparsely (only non-default values)
 * - Visual state affects rendering in table, charts, and UMAP
 */

/**
 * Visibility state for a category.
 * Controls opacity/visibility in all visualizations.
 */
export type VisibilityState = 'highlighted' | 'normal' | 'dimmed' | 'hidden';

/**
 * Size state for a category.
 * Controls point/marker size in charts.
 */
export type SizeState = 'small' | 'medium' | 'large';

/**
 * Complete visual state for a single category.
 * Used when rendering categories with full style information.
 */
export interface CategoryVisualState {
  categoryId: string;
  visibility: VisibilityState;
  size: SizeState;
  color?: string;       // Optional custom color
  pinned: boolean;      // Whether category is pinned (always visible)
}

/**
 * Partial visual state override.
 * Only includes properties that differ from defaults.
 * Used for sparse storage in Redux state.
 */
export interface VisibilityOverride {
  visibility?: VisibilityState;
  size?: SizeState;
  color?: string;
  pinned?: boolean;
}

/**
 * Default visual state settings.
 * Applied to all categories unless overridden.
 */
export interface VisibilityDefaults {
  visibility: VisibilityState;
  size: SizeState;
  nonSelectedVisibility: VisibilityState;  // How to display non-selected items
}

/**
 * Display mode configuration.
 * Determines how selection affects visual state.
 */
export type DisplayMode = 'highlight' | 'isolate' | 'dim';

/**
 * Redux state for visibility management.
 */
export interface VisibilitySliceState {
  /** Default visual settings applied to all categories */
  defaults: VisibilityDefaults;

  /** Sparse map of category overrides (categoryId -> override) */
  overrides: Record<string, VisibilityOverride>;

  /** Currently highlighted category IDs (derived from overrides for quick access) */
  highlightedIds: Set<string>;

  /** Current display mode */
  displayMode: DisplayMode;

  /** Whether visibility state is initialized from backend */
  initialized: boolean;
}

/**
 * Selection state for a category group (cluster).
 * Used for tri-state indicators in ClusterPicker.
 */
export type GroupSelectionState = 'none' | 'partial' | 'full';

/**
 * Category group with selection state.
 * Combines group data with derived selection state.
 */
export interface CategoryGroupWithSelection {
  id: string;
  type: string;
  name: string;
  categoryIds: string[];
  selectionState: GroupSelectionState;
  selectedCount: number;
  totalCount: number;
}

/**
 * Map CSS properties from visual state.
 * Utility type for component styling.
 */
export interface VisualStyleMapping {
  opacity: number;
  strokeWidth: number;
  strokeColor: string;
  fillOpacity: number;
  scale: number;        // For point/marker size
  display: 'block' | 'none';  // For hidden state
}

/**
 * Get CSS opacity for a visibility state.
 */
export function getOpacityForVisibility(visibility: VisibilityState): number {
  switch (visibility) {
    case 'highlighted':
      return 1;
    case 'normal':
      return 0.8;
    case 'dimmed':
      return 0.3;
    case 'hidden':
      return 0;
  }
}

/**
 * Get CSS scale for a size state.
 */
export function getScaleForSize(size: SizeState): number {
  switch (size) {
    case 'small':
      return 0.7;
    case 'medium':
      return 1;
    case 'large':
      return 1.4;
  }
}
