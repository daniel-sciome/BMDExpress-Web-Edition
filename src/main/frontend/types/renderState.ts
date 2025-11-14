/**
 * Render State Type Definitions
 *
 * This module defines the types for managing visualization state separately
 * from business domain objects.
 */

import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

/**
 * Types of category groupings
 */
export enum CategorySetType {
  CLUSTER = 'cluster',           // From UMAP clustering analysis
  CUSTOM = 'custom',             // User-defined grouping
  MASTER_FILTER = 'master_filter', // Categories passing the master filter
}

/**
 * A set/grouping of categories
 *
 * Categories can belong to multiple sets. For example, a category might be
 * in both a CLUSTER set (from UMAP) and a CUSTOM set (user-created).
 */
export interface CategorySet {
  /** Unique identifier for this set */
  setId: string;

  /** Type of category set */
  type: CategorySetType;

  /** Display label */
  label: string;

  /** IDs of categories belonging to this set */
  categoryIds: string[];

  /** Optional color for visualization (hex format) */
  color?: string;

  /** Is this set currently highlighted/selected? */
  highlighted: boolean;

  /** Should this set be visible in visualizations? */
  visible: boolean;

  /** Type-specific metadata */
  metadata: {
    /** For CLUSTER type: the numeric cluster ID */
    clusterId?: number;

    /** For CUSTOM type: who created it and when */
    createdBy?: string;
    createdAt?: string;
    description?: string;

    /** For MASTER_FILTER type: the filter criteria used */
    filterCriteria?: {
      minBmd?: number;
      maxBmd?: number;
      minPValue?: number;
      maxPValue?: number;
      // Other numeric filters...
    };
  };
}

/**
 * Render state for a single category
 *
 * Wraps the domain CategoryAnalysisResultDto with visualization state.
 * This separates business logic (the category data) from presentation
 * logic (how to display it).
 */
export interface CategoryRenderState {
  /** The category ID (e.g., GO term ID) */
  categoryId: string;

  /** The actual domain/business data */
  category: CategoryAnalysisResultDto;

  /** IDs of CategorySets this category belongs to */
  setIds: string[];

  /** Is this category highlighted/selected? */
  highlighted: boolean;

  /** Does this category pass all active filters? */
  filtered: boolean;

  /** Should this category participate in reactive highlighting? */
  reactive: boolean;
}

/**
 * Overall render state structure
 */
export interface RenderState {
  categories: {
    byId: Record<string, CategoryRenderState>;
    allIds: string[];
  };

  categorySets: {
    byId: Record<string, CategorySet>;
    allIds: string[];
    byType: Record<CategorySetType, string[]>;
  };
}
