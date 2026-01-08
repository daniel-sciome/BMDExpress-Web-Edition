// categoryTypes.ts
// Type definitions for category analysis data with UMAP integration

import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

/**
 * Extended category result with focus state.
 *
 * inFocus indicates whether the category passes the user's filter criteria.
 * Categories that are NOT inFocus are still present in the dataset but may be
 * displayed differently based on the display mode (highlight, dim, or hide).
 */
export interface CategoryWithFocus extends CategoryAnalysisResultDto {
  /** Whether this category passes the user's filter criteria */
  inFocus: boolean;
}

/**
 * Extended category result with UMAP coordinates
 * Used when joining category analysis results with UMAP reference data
 */
export interface CategoryWithUmap extends CategoryAnalysisResultDto {
  /** UMAP dimension 1 coordinate */
  umap_x?: number;

  /** UMAP dimension 2 coordinate */
  umap_y?: number;

  /** Cluster ID from HDBSCAN clustering */
  cluster_id?: number | string;

  /** Whether this category has UMAP data available */
  hasUmapData: boolean;
}

/**
 * Extended category result with both focus state and UMAP coordinates.
 * This is the primary type used in visualizations.
 */
export interface CategoryWithFocusAndUmap extends CategoryWithFocus {
  /** UMAP dimension 1 coordinate */
  umap_x?: number;

  /** UMAP dimension 2 coordinate */
  umap_y?: number;

  /** Cluster ID from HDBSCAN clustering */
  cluster_id?: number | string;

  /** Whether this category has UMAP data available */
  hasUmapData: boolean;
}
