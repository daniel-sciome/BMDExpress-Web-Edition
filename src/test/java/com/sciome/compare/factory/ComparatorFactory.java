package com.sciome.compare.factory;

import com.sciome.compare.comparator.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Factory for creating ProjectComparator instances.
 * Supports creating individual comparators or the full workflow suite.
 */
public class ComparatorFactory {

    /**
     * Comparison types supported by this factory
     */
    public enum ComparisonType {
        EXPRESSION,
        WILLIAMS,
        CURVE_FIT,
        BMD,
        CATEGORY_GO_BP,
        CATEGORY_GENE,
        CATEGORY_ALL
    }

    /**
     * Create a specific comparator
     */
    public ProjectComparator create(ComparisonType type) {
        return switch (type) {
            case EXPRESSION -> new ExpressionComparator();
            case WILLIAMS -> new WilliamsComparator();
            case CURVE_FIT -> new CurveFitComparator();
            case BMD -> new BmdComparator();
            case CATEGORY_GO_BP -> new CategoryComparator("GO_BP");
            case CATEGORY_GENE -> new CategoryComparator("GENE");
            case CATEGORY_ALL -> new CategoryComparator();
        };
    }

    /**
     * Create comparators for the full BMDExpress workflow
     */
    public List<ProjectComparator> createWorkflowComparators() {
        List<ProjectComparator> comparators = new ArrayList<>();
        comparators.add(new ExpressionComparator());
        comparators.add(new WilliamsComparator());
        comparators.add(new CurveFitComparator());
        comparators.add(new BmdComparator());
        comparators.add(new CategoryComparator("GO_BP"));
        comparators.add(new CategoryComparator("GENE"));
        return comparators;
    }

    /**
     * Create comparators based on command-line arguments
     */
    public List<ProjectComparator> createFromArgs(String[] types) {
        List<ProjectComparator> comparators = new ArrayList<>();

        for (String type : types) {
            switch (type.toLowerCase()) {
                case "expression", "exp" -> comparators.add(new ExpressionComparator());
                case "williams", "wil" -> comparators.add(new WilliamsComparator());
                case "curvefit", "curve", "cf" -> comparators.add(new CurveFitComparator());
                case "bmd" -> comparators.add(new BmdComparator());
                case "go_bp", "gobp" -> comparators.add(new CategoryComparator("GO_BP"));
                case "gene" -> comparators.add(new CategoryComparator("GENE"));
                case "category", "cat" -> {
                    comparators.add(new CategoryComparator("GO_BP"));
                    comparators.add(new CategoryComparator("GENE"));
                }
                case "all" -> comparators.addAll(createWorkflowComparators());
                default -> System.err.println("Unknown comparison type: " + type);
            }
        }

        return comparators;
    }
}
