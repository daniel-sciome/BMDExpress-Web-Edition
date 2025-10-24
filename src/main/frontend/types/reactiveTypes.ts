// reactiveTypes.ts
// Type definitions for generic reactive selection system
// Phase 4: Chart Reactivity Infrastructure

/**
 * Types of selections that components can be reactive to
 */
export type ReactiveType = 'categoryId' | 'clusterId';

/**
 * Source of a reactive selection (for debugging and priority logic)
 */
export type SelectionSource = 'table' | 'umap' | 'chart' | null;

/**
 * State for a single reactive selection type
 */
export interface ReactiveState {
  selectedIds: Set<string | number>;
  source: SelectionSource;
}

/**
 * Complete reactive selection state structure
 */
export interface ReactiveSelectionMap {
  category: {
    selectedIds: Set<string>;
    source: SelectionSource;
  };
  cluster: {
    selectedIds: Set<number | string>;
    source: SelectionSource;
  };
}

/**
 * Mode for applying reactive visual styles
 */
export type ReactiveStyleMode = 'highlight' | 'dim' | 'hide';

/**
 * Plotly style properties that can be modified reactively
 */
export interface ReactiveStyleProps {
  opacity?: number;
  line?: {
    width?: number;
    color?: string;
  };
  marker?: {
    size?: number;
    opacity?: number;
    line?: {
      width?: number;
      color?: string;
    };
  };
}
