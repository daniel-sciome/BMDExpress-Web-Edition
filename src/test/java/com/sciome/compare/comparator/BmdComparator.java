package com.sciome.compare.comparator;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.stat.BMDResult;

import java.util.List;

/**
 * Compares BMD analysis results between projects
 */
public class BmdComparator extends AbstractComparator<BMDResult> {

    public BmdComparator() {
        super(5); // Allow small variance
    }

    public BmdComparator(int tolerance) {
        super(tolerance);
    }

    @Override
    public String getComparisonType() {
        return "BMD Results";
    }

    @Override
    protected List<BMDResult> extractItems(BMDProject project) {
        return project.getbMDResult();
    }

    @Override
    protected String extractKey(BMDResult result) {
        return extractExperimentName(result.getName());
    }

    @Override
    protected int extractMetric(BMDResult result) {
        return result.getProbeStatResults() != null ? result.getProbeStatResults().size() : 0;
    }

    @Override
    protected String extractDisplayName(BMDResult result) {
        return shortenName(extractExperimentName(result.getName()));
    }
}
