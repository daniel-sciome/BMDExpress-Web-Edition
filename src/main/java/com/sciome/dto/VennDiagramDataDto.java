package com.sciome.dto;

import java.util.List;
import java.util.Map;

/**
 * DTO for Venn diagram data showing overlaps between category analysis results.
 */
public class VennDiagramDataDto {
    private List<String> setNames;
    private Map<String, Integer> overlaps;
    private Map<String, List<String>> overlapItems;
    private int setCount;

    public VennDiagramDataDto() {
    }

    public VennDiagramDataDto(List<String> setNames, Map<String, Integer> overlaps,
                              Map<String, List<String>> overlapItems, int setCount) {
        this.setNames = setNames;
        this.overlaps = overlaps;
        this.overlapItems = overlapItems;
        this.setCount = setCount;
    }

    public List<String> getSetNames() {
        return setNames;
    }

    public void setSetNames(List<String> setNames) {
        this.setNames = setNames;
    }

    public Map<String, Integer> getOverlaps() {
        return overlaps;
    }

    public void setOverlaps(Map<String, Integer> overlaps) {
        this.overlaps = overlaps;
    }

    public Map<String, List<String>> getOverlapItems() {
        return overlapItems;
    }

    public void setOverlapItems(Map<String, List<String>> overlapItems) {
        this.overlapItems = overlapItems;
    }

    public int getSetCount() {
        return setCount;
    }

    public void setSetCount(int setCount) {
        this.setCount = setCount;
    }
}
