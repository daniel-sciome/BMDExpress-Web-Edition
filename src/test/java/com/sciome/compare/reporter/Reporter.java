package com.sciome.compare.reporter;

import com.sciome.compare.result.ComparisonResult;

import java.util.List;

/**
 * Strategy interface for reporting comparison results
 */
public interface Reporter {

    /**
     * Report the header/title section
     */
    void reportHeader(String sourceFile, String targetFile);

    /**
     * Report a single comparison result
     */
    void report(ComparisonResult result);

    /**
     * Report final summary across all comparisons
     */
    void reportSummary(List<ComparisonResult> results);
}
