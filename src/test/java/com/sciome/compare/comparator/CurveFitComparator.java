package com.sciome.compare.comparator;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.prefilter.CurveFitPrefilterResults;

import java.util.List;

/**
 * Compares Curve Fit prefilter results between projects
 */
public class CurveFitComparator extends AbstractComparator<CurveFitPrefilterResults> {

    public CurveFitComparator() {
        super(5); // Allow small variance due to version differences
    }

    public CurveFitComparator(int tolerance) {
        super(tolerance);
    }

    @Override
    public String getComparisonType() {
        return "Curve Fit Prefilter";
    }

    @Override
    protected List<CurveFitPrefilterResults> extractItems(BMDProject project) {
        return project.getCurveFitPrefilterResults();
    }

    @Override
    protected String extractKey(CurveFitPrefilterResults result) {
        return extractExperimentName(result.getName());
    }

    @Override
    protected int extractMetric(CurveFitPrefilterResults result) {
        return result.getCurveFitPrefilterResults() != null
                ? result.getCurveFitPrefilterResults().size() : 0;
    }

    @Override
    protected String extractDisplayName(CurveFitPrefilterResults result) {
        return shortenName(extractExperimentName(result.getName()));
    }
}
