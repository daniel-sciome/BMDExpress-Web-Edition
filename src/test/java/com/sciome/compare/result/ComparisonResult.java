package com.sciome.compare.result;

import java.util.ArrayList;
import java.util.List;

/**
 * Aggregated result of a comparison operation
 */
public class ComparisonResult {
    private final String comparisonType;
    private final int sourceTotalCount;
    private final int targetTotalCount;
    private final List<ItemResult> itemResults;

    private ComparisonResult(Builder builder) {
        this.comparisonType = builder.comparisonType;
        this.sourceTotalCount = builder.sourceTotalCount;
        this.targetTotalCount = builder.targetTotalCount;
        this.itemResults = new ArrayList<>(builder.itemResults);
    }

    public String getComparisonType() {
        return comparisonType;
    }

    public int getSourceTotalCount() {
        return sourceTotalCount;
    }

    public int getTargetTotalCount() {
        return targetTotalCount;
    }

    public List<ItemResult> getItemResults() {
        return itemResults;
    }

    public int getMatchCount() {
        return (int) itemResults.stream().filter(ItemResult::isMatch).count();
    }

    public int getMismatchCount() {
        return (int) itemResults.stream().filter(r -> !r.isMatch()).count();
    }

    public boolean isEmpty() {
        return sourceTotalCount == 0;
    }

    public static Builder builder(String comparisonType) {
        return new Builder(comparisonType);
    }

    public static class Builder {
        private final String comparisonType;
        private int sourceTotalCount;
        private int targetTotalCount;
        private final List<ItemResult> itemResults = new ArrayList<>();

        private Builder(String comparisonType) {
            this.comparisonType = comparisonType;
        }

        public Builder sourceTotalCount(int count) {
            this.sourceTotalCount = count;
            return this;
        }

        public Builder targetTotalCount(int count) {
            this.targetTotalCount = count;
            return this;
        }

        public Builder addItemResult(ItemResult result) {
            this.itemResults.add(result);
            return this;
        }

        public ComparisonResult build() {
            return new ComparisonResult(this);
        }
    }
}
