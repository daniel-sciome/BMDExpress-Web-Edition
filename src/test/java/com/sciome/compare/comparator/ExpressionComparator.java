package com.sciome.compare.comparator;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.DoseResponseExperiment;

import java.util.List;

/**
 * Compares DoseResponseExperiment (expression) data between projects
 */
public class ExpressionComparator extends AbstractComparator<DoseResponseExperiment> {

    public ExpressionComparator() {
        super(0); // Expression data should match exactly
    }

    public ExpressionComparator(int tolerance) {
        super(tolerance);
    }

    @Override
    public String getComparisonType() {
        return "Expression Data";
    }

    @Override
    protected List<DoseResponseExperiment> extractItems(BMDProject project) {
        return project.getDoseResponseExperiments();
    }

    @Override
    protected String extractKey(DoseResponseExperiment exp) {
        return exp.getName();
    }

    @Override
    protected int extractMetric(DoseResponseExperiment exp) {
        return exp.getProbeResponses() != null ? exp.getProbeResponses().size() : 0;
    }

    @Override
    protected String extractDisplayName(DoseResponseExperiment exp) {
        return shortenName(exp.getName());
    }
}
