package com.sciome.service;

import com.sciome.dto.CategoryGroupDto;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for managing category groups (UMAP clusters, gene clusters, etc.).
 * Exposes group functionality to the browser via Hilla BrowserCallable.
 *
 * Category groups are used for:
 * - Displaying tri-state selection indicators in ClusterPicker
 * - Selecting/deselecting all categories in a group
 * - Visual grouping in charts and tables
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class CategoryGroupService {

    public static final String TYPE_UMAP_CLUSTER = "umap_cluster";
    public static final String TYPE_GENE_CLUSTER = "gene_cluster";

    /**
     * Convert cluster assignments to CategoryGroupDto objects.
     *
     * @param clusterAssignments Map of categoryId -> clusterId
     * @param groupType The type of group (e.g., "umap_cluster", "gene_cluster")
     * @param clusterLabels Optional map of clusterId -> display name (null for default names)
     * @return List of CategoryGroupDto objects, one per cluster
     */
    public List<CategoryGroupDto> createGroupsFromClusters(
            Map<String, Integer> clusterAssignments,
            String groupType,
            Map<Integer, String> clusterLabels) {

        if (clusterAssignments == null || clusterAssignments.isEmpty()) {
            return new ArrayList<>();
        }

        // Group category IDs by cluster
        Map<Integer, List<String>> clusterToCategories = new HashMap<>();
        for (Map.Entry<String, Integer> entry : clusterAssignments.entrySet()) {
            String categoryId = entry.getKey();
            Integer clusterId = entry.getValue();
            clusterToCategories.computeIfAbsent(clusterId, k -> new ArrayList<>()).add(categoryId);
        }

        // Create CategoryGroupDto for each cluster
        List<CategoryGroupDto> groups = new ArrayList<>();
        for (Map.Entry<Integer, List<String>> entry : clusterToCategories.entrySet()) {
            Integer clusterId = entry.getKey();
            List<String> categoryIds = entry.getValue();

            String id = groupType + "_" + clusterId;
            String name = (clusterLabels != null && clusterLabels.containsKey(clusterId))
                    ? clusterLabels.get(clusterId)
                    : "Cluster " + (clusterId + 1);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("clusterId", clusterId);
            metadata.put("size", categoryIds.size());

            groups.add(new CategoryGroupDto(id, groupType, name, categoryIds, metadata));
        }

        // Sort by cluster ID
        groups.sort((a, b) -> {
            Integer aId = (Integer) a.getMetadata().get("clusterId");
            Integer bId = (Integer) b.getMetadata().get("clusterId");
            return aId.compareTo(bId);
        });

        return groups;
    }

    /**
     * Get available group types.
     * @return List of group type identifiers
     */
    public List<String> getAvailableGroupTypes() {
        return List.of(TYPE_UMAP_CLUSTER, TYPE_GENE_CLUSTER);
    }

    /**
     * Get display name for a group type.
     * @param groupType The group type identifier
     * @return Human-readable display name
     */
    public String getGroupTypeDisplayName(String groupType) {
        if (groupType == null) return "Unknown";
        switch (groupType) {
            case TYPE_UMAP_CLUSTER:
                return "UMAP Clusters";
            case TYPE_GENE_CLUSTER:
                return "Gene Clusters";
            default:
                return groupType;
        }
    }
}
