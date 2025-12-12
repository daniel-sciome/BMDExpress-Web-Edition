package com.sciome.dto;

import java.util.List;

/**
 * DTO for clustering result - returned from server to browser.
 */
public class ClusteringResultDto {
    private int[] clusterAssignments;
    private int[] leavesOrder;
    private String[] orderedLabels;
    private int[] orderedClusters;
    private List<List<Double>> linkageMatrix;
    private String error;

    public ClusteringResultDto() {
    }

    // Getters and setters
    public int[] getClusterAssignments() { return clusterAssignments; }
    public void setClusterAssignments(int[] clusterAssignments) { this.clusterAssignments = clusterAssignments; }

    public int[] getLeavesOrder() { return leavesOrder; }
    public void setLeavesOrder(int[] leavesOrder) { this.leavesOrder = leavesOrder; }

    public String[] getOrderedLabels() { return orderedLabels; }
    public void setOrderedLabels(String[] orderedLabels) { this.orderedLabels = orderedLabels; }

    public int[] getOrderedClusters() { return orderedClusters; }
    public void setOrderedClusters(int[] orderedClusters) { this.orderedClusters = orderedClusters; }

    public List<List<Double>> getLinkageMatrix() { return linkageMatrix; }
    public void setLinkageMatrix(List<List<Double>> linkageMatrix) { this.linkageMatrix = linkageMatrix; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public boolean hasError() { return error != null && !error.isEmpty(); }
}
