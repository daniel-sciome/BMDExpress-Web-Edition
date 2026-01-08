package com.sciome.compare.result;

/**
 * Result for a single item comparison (experiment, tissue, etc.)
 */
public class ItemResult {
    private final String name;
    private final int sourceCount;
    private final int targetCount;
    private final int tolerance;

    public ItemResult(String name, int sourceCount, int targetCount, int tolerance) {
        this.name = name;
        this.sourceCount = sourceCount;
        this.targetCount = targetCount;
        this.tolerance = tolerance;
    }

    public String getName() {
        return name;
    }

    public int getSourceCount() {
        return sourceCount;
    }

    public int getTargetCount() {
        return targetCount;
    }

    public int getDifference() {
        return sourceCount - targetCount;
    }

    public boolean isMatch() {
        return Math.abs(getDifference()) <= tolerance;
    }

    public boolean isNotFound() {
        return targetCount < 0;
    }
}
