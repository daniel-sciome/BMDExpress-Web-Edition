package com.sciome.dto;

import java.util.List;
import java.util.Map;

/**
 * DTO for category groups (e.g., UMAP clusters, gene clusters).
 * Hilla generates TypeScript types from this class.
 *
 * A category group represents a collection of categories that are
 * logically grouped together (e.g., all categories in a UMAP cluster).
 */
public class CategoryGroupDto {

    private String id;
    private String type;          // e.g., "umap_cluster", "gene_cluster"
    private String name;          // Display name
    private List<String> categoryIds;  // List of category IDs in this group
    private Map<String, Object> metadata;  // Optional additional info (e.g., cluster centroid)

    public CategoryGroupDto() {
    }

    public CategoryGroupDto(String id, String type, String name, List<String> categoryIds) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.categoryIds = categoryIds;
    }

    public CategoryGroupDto(String id, String type, String name, List<String> categoryIds, Map<String, Object> metadata) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.categoryIds = categoryIds;
        this.metadata = metadata;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getCategoryIds() {
        return categoryIds;
    }

    public void setCategoryIds(List<String> categoryIds) {
        this.categoryIds = categoryIds;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
