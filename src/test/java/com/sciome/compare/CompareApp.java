package com.sciome.compare;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.compare.comparator.ProjectComparator;
import com.sciome.compare.factory.ComparatorFactory;
import com.sciome.compare.loader.ProjectLoader;
import com.sciome.compare.reporter.ConsoleReporter;
import com.sciome.compare.reporter.Reporter;
import com.sciome.compare.result.ComparisonResult;

import java.util.ArrayList;
import java.util.List;

/**
 * Command-line application for comparing BMDExpress .bm2 project files.
 *
 * Usage:
 *   CompareApp <source.bm2> <target.bm2> [comparison-types...]
 *
 * Comparison types:
 *   expression, exp    - Compare DoseResponseExperiment data
 *   williams, wil      - Compare Williams Trend prefilter results
 *   curvefit, cf       - Compare Curve Fit prefilter results
 *   bmd                - Compare BMD analysis results
 *   go_bp, gobp        - Compare GO_BP category results
 *   gene               - Compare GENE category results
 *   category, cat      - Compare all category results (GO_BP + GENE)
 *   all                - Run all comparisons (default if none specified)
 *
 * Examples:
 *   CompareApp metadata.bm2 parham.bm2
 *   CompareApp metadata.bm2 parham.bm2 bmd category
 *   CompareApp metadata.bm2 parham.bm2 all
 */
public class CompareApp {

    private final ProjectLoader loader;
    private final ComparatorFactory factory;
    private final Reporter reporter;

    public CompareApp() {
        this.loader = new ProjectLoader();
        this.factory = new ComparatorFactory();
        this.reporter = new ConsoleReporter();
    }

    public CompareApp(ProjectLoader loader, ComparatorFactory factory, Reporter reporter) {
        this.loader = loader;
        this.factory = factory;
        this.reporter = reporter;
    }

    public static void main(String[] args) {
        if (args.length < 2) {
            printUsage();
            System.exit(1);
        }

        String sourcePath = args[0];
        String targetPath = args[1];
        String[] comparisonTypes = args.length > 2
                ? java.util.Arrays.copyOfRange(args, 2, args.length)
                : new String[]{"all"};

        CompareApp app = new CompareApp();
        int exitCode = app.run(sourcePath, targetPath, comparisonTypes);
        System.exit(exitCode);
    }

    /**
     * Run the comparison
     *
     * @param sourcePath Path to source .bm2 file
     * @param targetPath Path to target .bm2 file
     * @param comparisonTypes Types of comparisons to run
     * @return 0 if all comparisons pass, 1 if any fail
     */
    public int run(String sourcePath, String targetPath, String[] comparisonTypes) {
        try {
            // Load projects
            BMDProject source = loader.load(sourcePath);
            BMDProject target = loader.load(targetPath);

            // Get comparators
            List<ProjectComparator> comparators = factory.createFromArgs(comparisonTypes);
            if (comparators.isEmpty()) {
                comparators = factory.createWorkflowComparators();
            }

            // Report header
            reporter.reportHeader(sourcePath, targetPath);

            // Run comparisons
            List<ComparisonResult> results = new ArrayList<>();
            for (ProjectComparator comparator : comparators) {
                ComparisonResult result = comparator.compare(source, target);
                results.add(result);
                reporter.report(result);
            }

            // Report summary
            reporter.reportSummary(results);

            // Return exit code based on results
            boolean hasFailures = results.stream()
                    .anyMatch(r -> !r.isEmpty() && r.getMismatchCount() > 0);
            return hasFailures ? 1 : 0;

        } catch (ProjectLoader.ProjectLoadException e) {
            System.err.println("Error loading project: " + e.getMessage());
            return 2;
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return 3;
        }
    }

    private static void printUsage() {
        System.out.println("BMDExpress Project Comparison Tool");
        System.out.println();
        System.out.println("Usage: CompareApp <source.bm2> <target.bm2> [comparison-types...]");
        System.out.println();
        System.out.println("Comparison types:");
        System.out.println("  expression, exp    - Compare DoseResponseExperiment data");
        System.out.println("  williams, wil      - Compare Williams Trend prefilter results");
        System.out.println("  curvefit, cf       - Compare Curve Fit prefilter results");
        System.out.println("  bmd                - Compare BMD analysis results");
        System.out.println("  go_bp, gobp        - Compare GO_BP category results");
        System.out.println("  gene               - Compare GENE category results");
        System.out.println("  category, cat      - Compare all category results");
        System.out.println("  all                - Run all comparisons (default)");
        System.out.println();
        System.out.println("Examples:");
        System.out.println("  CompareApp metadata.bm2 parham.bm2");
        System.out.println("  CompareApp metadata.bm2 parham.bm2 bmd category");
    }
}
