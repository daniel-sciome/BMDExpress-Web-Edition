// umapDataService.ts
// Service for accessing UMAP reference data with O(1) lookup by GO ID

import { hardcodedReferenceData, ReferenceUmapItem } from './referenceUmapData';

/**
 * Lookup map for quick access to UMAP data by GO ID
 */
class UmapDataService {
  private lookupMap: Map<string, ReferenceUmapItem>;
  private clusterMap: Map<number | string, ReferenceUmapItem[]>;

  constructor() {
    this.lookupMap = new Map();
    this.clusterMap = new Map();
    this.buildLookupMaps();
  }

  private buildLookupMaps(): void {
    console.log(`[UmapDataService] Building lookup maps for ${hardcodedReferenceData.length} GO terms...`);

    // Build GO ID lookup map
    hardcodedReferenceData.forEach(item => {
      this.lookupMap.set(item.go_id, item);

      // Build cluster map
      const clusterId = item.cluster_id;
      if (!this.clusterMap.has(clusterId)) {
        this.clusterMap.set(clusterId, []);
      }
      this.clusterMap.get(clusterId)!.push(item);
    });

    console.log(`[UmapDataService] Lookup maps built. ${this.lookupMap.size} GO terms, ${this.clusterMap.size} clusters`);
  }

  /**
   * Get UMAP data for a specific GO ID
   */
  getByGoId(goId: string): ReferenceUmapItem | undefined {
    return this.lookupMap.get(goId);
  }

  /**
   * Get all GO IDs in a specific cluster
   */
  getGoIdsByCluster(clusterId: number | string): string[] {
    const items = this.clusterMap.get(clusterId);
    return items ? items.map(item => item.go_id) : [];
  }

  /**
   * Get all items in a specific cluster
   */
  getClusterItems(clusterId: number | string): ReferenceUmapItem[] {
    return this.clusterMap.get(clusterId) || [];
  }

  /**
   * Get all unique cluster IDs
   */
  getAllClusterIds(): (number | string)[] {
    return Array.from(this.clusterMap.keys());
  }

  /**
   * Get all reference data
   */
  getAllData(): ReferenceUmapItem[] {
    return hardcodedReferenceData;
  }

  /**
   * Check if a GO ID exists in the reference data
   */
  hasGoId(goId: string): boolean {
    return this.lookupMap.has(goId);
  }

  /**
   * Get statistics about the reference data
   */
  getStats() {
    const clusterSizes = Array.from(this.clusterMap.entries()).map(([id, items]) => ({
      clusterId: id,
      size: items.length,
    }));

    return {
      totalGoTerms: this.lookupMap.size,
      totalClusters: this.clusterMap.size,
      clusterSizes: clusterSizes.sort((a, b) => b.size - a.size),
    };
  }
}

// Singleton instance
export const umapDataService = new UmapDataService();

// Export stats on module load for debugging
console.log('[UmapDataService] Stats:', umapDataService.getStats());
