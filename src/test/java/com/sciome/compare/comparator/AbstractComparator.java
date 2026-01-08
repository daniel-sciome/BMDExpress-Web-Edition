package com.sciome.compare.comparator;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.compare.result.ComparisonResult;
import com.sciome.compare.result.ItemResult;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Abstract base class using Template Method pattern for comparisons.
 * Subclasses implement the data extraction, this class handles the comparison logic.
 *
 * @param <T> The type of data being compared (e.g., DoseResponseExperiment, BMDResult)
 */
public abstract class AbstractComparator<T> implements ProjectComparator {

    protected final int tolerance;

    protected AbstractComparator(int tolerance) {
        this.tolerance = tolerance;
    }

    @Override
    public int getDefaultTolerance() {
        return tolerance;
    }

    @Override
    public ComparisonResult compare(BMDProject source, BMDProject target) {
        List<T> sourceItems = extractItems(source);
        List<T> targetItems = extractItems(target);

        int sourceCount = sourceItems != null ? sourceItems.size() : 0;
        int targetCount = targetItems != null ? targetItems.size() : 0;

        ComparisonResult.Builder builder = ComparisonResult.builder(getComparisonType())
                .sourceTotalCount(sourceCount)
                .targetTotalCount(targetCount);

        if (sourceCount == 0) {
            return builder.build();
        }

        // Build map of target items by key
        Map<String, T> targetByKey = new HashMap<>();
        if (targetItems != null) {
            for (T item : targetItems) {
                String key = extractKey(item);
                targetByKey.put(key, item);
            }
        }

        // Compare each source item against target
        for (T sourceItem : sourceItems) {
            String key = extractKey(sourceItem);
            T targetItem = targetByKey.get(key);

            int sourceMetric = extractMetric(sourceItem);
            int targetMetric = targetItem != null ? extractMetric(targetItem) : -1;

            String displayName = extractDisplayName(sourceItem);
            builder.addItemResult(new ItemResult(displayName, sourceMetric, targetMetric, tolerance));
        }

        return builder.build();
    }

    /**
     * Extract the list of items from a project
     */
    protected abstract List<T> extractItems(BMDProject project);

    /**
     * Extract a unique key to match items between source and target
     */
    protected abstract String extractKey(T item);

    /**
     * Extract the numeric metric to compare (e.g., probe count, category count)
     */
    protected abstract int extractMetric(T item);

    /**
     * Extract a display-friendly name for the item
     */
    protected abstract String extractDisplayName(T item);

    /**
     * Utility to extract experiment name from a full analysis name
     */
    protected String extractExperimentName(String fullName) {
        if (fullName == null) return "";
        // Remove common suffixes
        return fullName
                .replaceAll("_curvefitprefilter.*", "")
                .replaceAll("_williamsprefilter.*", "")
                .replaceAll("_anovaprefilter.*", "");
    }

    /**
     * Utility to shorten experiment names for display
     */
    protected String shortenName(String name) {
        if (name == null) return "";
        // Remove common prefixes for cleaner display
        return name
                .replace("P2_Perfluoro_3_methoxypropanoic_acid_", "")
                .replace("-expression1", "");
    }
}
