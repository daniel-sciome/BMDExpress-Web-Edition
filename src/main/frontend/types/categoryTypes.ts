// categoryTypes.ts
// Type definitions for category analysis data with UMAP integration

import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

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
