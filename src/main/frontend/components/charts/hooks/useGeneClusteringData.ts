/**
 * useGeneClusteringData Hook
 *
 * Fetches hierarchical clustering results for category analysis data.
 * Uses gene overlap (Jaccard distance on active genes) to cluster categories.
 *
 * Returns:
 * - clusterAssignments: Map of categoryId -> clusterId
 * - orderedCategoryIds: Category IDs in dendrogram leaf order
 * - orderedClusterIds: Cluster IDs in dendrogram leaf order
 * - loading/error states
 */

import { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { selectFilteredData } from '../../../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

// Types for clustering results (will match Hilla-generated types)
export interface ClusteringResult {
  clusterAssignments: number[];
  leavesOrder: number[];
  orderedLabels: string[];
  orderedClusters: number[];
  linkageMatrix: number[][];
  error: string | null;
}

export interface ClusteringDataResult {
  /** Map of categoryId -> clusterId */
  clusterAssignments: Map<string, number>;
  /** Category IDs in dendrogram leaf order */
  orderedCategoryIds: string[];
  /** Cluster IDs corresponding to orderedCategoryIds */
  orderedClusterIds: number[];
  /** Original category data keyed by categoryId */
  categoryData: Map<string, CategoryAnalysisResultDto>;
  /** All unique cluster IDs */
  uniqueClusterIds: number[];
  /** Linkage matrix for dendrogram visualization */
  linkageMatrix: number[][] | null;
  /** Number of categories clustered */
  categoryCount: number;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
}

// Linkage method options
export type LinkageMethod = 'average' | 'complete' | 'single' | 'ward';

interface UseGeneClusteringDataOptions {
  /** Linkage method for clustering (default: 'average') */
  linkageMethod?: LinkageMethod;
  /** Number of clusters (0 = auto-calculate) */
  numClusters?: number;
  /** Minimum categories required for clustering */
  minCategories?: number;
}

/**
 * Hook to fetch and manage gene-based clustering data
 */
export function useGeneClusteringData(
  options: UseGeneClusteringDataOptions = {}
): ClusteringDataResult {
  const {
    linkageMethod = 'average',
    numClusters = 0,
    minCategories = 3,
  } = options;

  const filteredData = useAppSelector(selectFilteredData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null);

  // Prepare input items from category data
  const inputItems = useMemo(() => {
    // Debug: check what gene fields are available
    if (filteredData.length > 0) {
      const sample = filteredData[0];
      console.log('[useGeneClusteringData] Sample category - ALL fields:', sample);
      console.log('[useGeneClusteringData] Sample category gene fields:', {
        categoryId: sample.categoryId,
        genesUp: sample.genesUp,
        genesDown: sample.genesDown,
        genes: sample.genes,
        geneSymbols: sample.geneSymbols,
        genesIds: sample.genesIds,
        geneAllCount: sample.geneAllCount,
        genesThatPassedAllFilters: sample.genesThatPassedAllFilters,
      });
    }

    const items = filteredData
      .filter(cat => cat.categoryId && (cat.genesUp || cat.genesDown || cat.genes || cat.geneSymbols))
      .map(cat => ({
        categoryId: cat.categoryId!,
        categoryTitle: cat.categoryDescription || cat.categoryId!,
        clusterBMD: cat.bmdMedian?.toString() || '',
        genesUp: cat.genesUp || '',
        genesDown: cat.genesDown || '',
        allGenes: cat.genes || cat.geneSymbols || '',  // Try genes first, then geneSymbols
      }));

    console.log('[useGeneClusteringData] Input items:', {
      filteredDataCount: filteredData.length,
      itemsWithGenes: items.length,
    });

    return items;
  }, [filteredData]);

  // Call clustering service when data changes
  useEffect(() => {
    console.log('[useGeneClusteringData] useEffect triggered:', {
      inputItemsCount: inputItems.length,
      minCategories,
      linkageMethod,
    });

    if (inputItems.length < minCategories) {
      console.log('[useGeneClusteringData] Not enough categories:', inputItems.length, '<', minCategories);
      setClusteringResult(null);
      setError(inputItems.length === 0 ? null : `Need at least ${minCategories} categories for clustering`);
      return;
    }

    const performClustering = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('[useGeneClusteringData] Calling ClusteringService with', inputItems.length, 'items');
        // Dynamic import to handle case where generated code doesn't exist yet
        const { ClusteringService } = await import('Frontend/generated/endpoints');

        const result = await ClusteringService.performClustering(
          inputItems,
          linkageMethod,
          numClusters
        );

        console.log('[useGeneClusteringData] ClusteringService result:', {
          hasResult: !!result,
          clusterCount: result?.clusterAssignments?.length,
          uniqueClusters: result?.clusterAssignments ? [...new Set(result.clusterAssignments)].length : 0,
          error: result?.error,
        });

        if (result?.error) {
          setError(result.error);
          setClusteringResult(null);
        } else {
          setClusteringResult({
            clusterAssignments: result?.clusterAssignments || [],
            leavesOrder: result?.leavesOrder || [],
            orderedLabels: result?.orderedLabels || [],
            orderedClusters: result?.orderedClusters || [],
            linkageMatrix: result?.linkageMatrix || [],
            error: null,
          });
        }
      } catch (err) {
        console.error('[useGeneClusteringData] Clustering failed:', err);
        setError(err instanceof Error ? err.message : 'Clustering failed');
        setClusteringResult(null);
      } finally {
        setLoading(false);
      }
    };

    performClustering();
  }, [inputItems, linkageMethod, numClusters, minCategories]);

  // Build result maps from clustering result
  return useMemo(() => {
    const clusterAssignments = new Map<string, number>();
    const categoryData = new Map<string, CategoryAnalysisResultDto>();
    let orderedCategoryIds: string[] = [];
    let orderedClusterIds: number[] = [];
    let uniqueClusterIds: number[] = [];
    let linkageMatrix: number[][] | null = null;

    // Build category data map
    filteredData.forEach(cat => {
      if (cat.categoryId) {
        categoryData.set(cat.categoryId, cat);
      }
    });

    if (clusteringResult && !clusteringResult.error) {
      // Build cluster assignments map
      inputItems.forEach((item, index) => {
        if (index < clusteringResult.clusterAssignments.length) {
          clusterAssignments.set(item.categoryId, clusteringResult.clusterAssignments[index]);
        }
      });

      // Get ordered data from result
      orderedCategoryIds = clusteringResult.orderedLabels;
      orderedClusterIds = clusteringResult.orderedClusters;
      linkageMatrix = clusteringResult.linkageMatrix;

      // Get unique cluster IDs (sorted)
      uniqueClusterIds = [...new Set(clusteringResult.clusterAssignments)].sort((a, b) => a - b);
    }

    return {
      clusterAssignments,
      orderedCategoryIds,
      orderedClusterIds,
      categoryData,
      uniqueClusterIds,
      linkageMatrix,
      categoryCount: inputItems.length,
      loading,
      error,
    };
  }, [clusteringResult, inputItems, filteredData, loading, error]);
}

export default useGeneClusteringData;
