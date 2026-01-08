package com.sciome.compare.reporter;

import com.sciome.compare.result.ComparisonResult;
import com.sciome.compare.result.ItemResult;

import java.util.List;

/**
 * Console output reporter with formatted tables and summaries
 */
public class ConsoleReporter implements Reporter {

    private static final String SEPARATOR = "=".repeat(80);
    private static final String THIN_SEPARATOR = "-".repeat(60);

    @Override
    public void reportHeader(String sourceFile, String targetFile) {
        System.out.println(SEPARATOR);
        System.out.println("BMD PROJECT COMPARISON");
        System.out.println(SEPARATOR);
        System.out.println("Source: " + sourceFile);
        System.out.println("Target: " + targetFile);
        System.out.println();
    }

    @Override
    public void report(ComparisonResult result) {
        System.out.println("\n" + SEPARATOR);
        System.out.println(result.getComparisonType().toUpperCase() + " COMPARISON");
        System.out.println(SEPARATOR);

        // Total counts
        System.out.println("\nTotal Count:");
        System.out.println("  Source: " + result.getSourceTotalCount());
        System.out.println("  Target: " + result.getTargetTotalCount());

        if (result.isEmpty()) {
            System.out.println("\n  *** NO DATA IN SOURCE - Analysis not yet run ***");
            return;
        }

        // Item details
        if (!result.getItemResults().isEmpty()) {
            System.out.println("\nComparison by item:");
            for (ItemResult item : result.getItemResults()) {
                printItemResult(item);
            }
        }

        // Summary
        System.out.println("\nSummary: " + result.getMatchCount() + " matches, "
                + result.getMismatchCount() + " mismatches");
    }

    private void printItemResult(ItemResult item) {
        String status = item.isMatch() ? "OK" : "DIFF";
        String diffStr = formatDifference(item);

        if (item.isNotFound()) {
            System.out.printf("  [%4s] %-50s %d vs NOT FOUND%n",
                    status, truncate(item.getName(), 50), item.getSourceCount());
        } else {
            System.out.printf("  [%4s] %-50s %d vs %d%s%n",
                    status, truncate(item.getName(), 50),
                    item.getSourceCount(), item.getTargetCount(), diffStr);
        }
    }

    private String formatDifference(ItemResult item) {
        int diff = item.getDifference();
        if (diff == 0) return "";
        return diff > 0 ? " (+" + diff + ")" : " (" + diff + ")";
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        if (s.length() <= maxLen) return s;
        return s.substring(0, maxLen - 3) + "...";
    }

    @Override
    public void reportSummary(List<ComparisonResult> results) {
        System.out.println("\n" + SEPARATOR);
        System.out.println("OVERALL SUMMARY");
        System.out.println(SEPARATOR);

        int totalMatch = 0;
        int totalMismatch = 0;

        for (ComparisonResult result : results) {
            if (!result.isEmpty()) {
                int matches = result.getMatchCount();
                int mismatches = result.getMismatchCount();
                totalMatch += matches;
                totalMismatch += mismatches;

                String statusIcon = mismatches == 0 ? "PASS" : "WARN";
                System.out.printf("  [%4s] %-30s %d/%d items match%n",
                        statusIcon, result.getComparisonType(),
                        matches, matches + mismatches);
            } else {
                System.out.printf("  [%4s] %-30s (no data)%n",
                        "SKIP", result.getComparisonType());
            }
        }

        System.out.println(THIN_SEPARATOR);
        System.out.printf("Total: %d matches, %d mismatches%n", totalMatch, totalMismatch);

        if (totalMismatch == 0 && totalMatch > 0) {
            System.out.println("\nAll comparisons PASSED!");
        } else if (totalMismatch > 0) {
            System.out.println("\nSome differences detected - review results above.");
        }
    }
}
