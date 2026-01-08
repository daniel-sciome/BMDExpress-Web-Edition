package com.sciome.compare.comparator;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.prefilter.WilliamsTrendResults;

import java.util.List;

/**
 * Compares Williams Trend prefilter results between projects
 */
public class WilliamsComparator extends AbstractComparator<WilliamsTrendResults> {

    public WilliamsComparator() {
        super(0); // Williams should match exactly
    }

    public WilliamsComparator(int tolerance) {
        super(tolerance);
    }

    @Override
    public String getComparisonType() {
        return "Williams Trend";
    }

    @Override
    protected List<WilliamsTrendResults> extractItems(BMDProject project) {
        return project.getWilliamsTrendResults();
    }

    @Override
    protected String extractKey(WilliamsTrendResults result) {
        return extractExperimentName(result.getName());
    }

    @Override
    protected int extractMetric(WilliamsTrendResults result) {
        return result.getWilliamsTrendResults() != null ? result.getWilliamsTrendResults().size() : 0;
    }

    @Override
    protected String extractDisplayName(WilliamsTrendResults result) {
        return shortenName(extractExperimentName(result.getName()));
    }
}
