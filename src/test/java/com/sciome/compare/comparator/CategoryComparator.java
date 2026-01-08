package com.sciome.compare.comparator;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResults;
import com.sciome.compare.result.ComparisonResult;
import com.sciome.compare.result.ItemResult;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Compares Category Analysis results between projects.
 * Supports filtering by category type (GO_BP, GENE, etc.)
 */
public class CategoryComparator implements ProjectComparator {

    private final String categoryType; // "GO_BP", "GENE", or null for all
    private final int tolerance;

    public CategoryComparator() {
        this(null, 10);
    }

    public CategoryComparator(String categoryType) {
        this(categoryType, 10);
    }

    public CategoryComparator(String categoryType, int tolerance) {
        this.categoryType = categoryType;
        this.tolerance = tolerance;
    }

    @Override
    public String getComparisonType() {
        return categoryType != null
                ? "Category Analysis (" + categoryType + ")"
                : "Category Analysis (All)";
    }

    @Override
    public int getDefaultTolerance() {
        return tolerance;
    }

    @Override
    public ComparisonResult compare(BMDProject source, BMDProject target) {
        List<CategoryAnalysisResults> sourceItems = filterByType(source.getCategoryAnalysisResults());
        List<CategoryAnalysisResults> targetItems = filterByType(target.getCategoryAnalysisResults());

        int sourceCount = sourceItems != null ? sourceItems.size() : 0;
        int targetCount = targetItems != null ? targetItems.size() : 0;

        ComparisonResult.Builder builder = ComparisonResult.builder(getComparisonType())
                .sourceTotalCount(sourceCount)
                .targetTotalCount(targetCount);

        if (sourceCount == 0) {
            return builder.build();
        }

        // Build map of target items by key
        Map<String, CategoryAnalysisResults> targetByKey = new HashMap<>();
        if (targetItems != null) {
            for (CategoryAnalysisResults item : targetItems) {
                String key = extractKey(item);
                targetByKey.put(key, item);
            }
        }

        // Compare each source item against target
        for (CategoryAnalysisResults sourceItem : sourceItems) {
            String key = extractKey(sourceItem);
            CategoryAnalysisResults targetItem = targetByKey.get(key);

            int sourceMetric = extractMetric(sourceItem);
            int targetMetric = targetItem != null ? extractMetric(targetItem) : -1;

            String displayName = extractDisplayName(sourceItem);
            builder.addItemResult(new ItemResult(displayName, sourceMetric, targetMetric, tolerance));
        }

        return builder.build();
    }

    private List<CategoryAnalysisResults> filterByType(List<CategoryAnalysisResults> results) {
        if (results == null || categoryType == null) {
            return results;
        }
        return results.stream()
                .filter(r -> r.getName() != null && r.getName().contains(categoryType))
                .collect(Collectors.toList());
    }

    private String extractKey(CategoryAnalysisResults result) {
        String name = result.getName();
        if (name == null) return "";
        // Extract experiment name (before _curvefitprefilter)
        String expName = name.split("_curvefitprefilter")[0];
        // Include category type in key
        String type = name.contains("GO_BP") ? "GO_BP" : (name.contains("GENE") ? "GENE" : "OTHER");
        return expName + "_" + type;
    }

    private int extractMetric(CategoryAnalysisResults result) {
        return result.getCategoryAnalsyisResults() != null
                ? result.getCategoryAnalsyisResults().size() : 0;
    }

    private String extractDisplayName(CategoryAnalysisResults result) {
        String name = result.getName();
        if (name == null) return "";
        // Shorten for display
        return name
                .replace("P2_Perfluoro_3_methoxypropanoic_acid_", "")
                .replaceAll("_curvefitprefilter.*", "")
                .replace("-expression1", "");
    }
}
