package com.sciome.compare.comparator;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.compare.result.ComparisonResult;

/**
 * Strategy interface for comparing specific aspects of BMDProjects
 */
public interface ProjectComparator {

    /**
     * Get the type/name of this comparison (e.g., "Expression", "Williams", "BMD")
     */
    String getComparisonType();

    /**
     * Compare the source project against the target project
     *
     * @param source The source project (e.g., user's metadata)
     * @param target The target project (e.g., reference/Parham)
     * @return ComparisonResult containing all comparison details
     */
    ComparisonResult compare(BMDProject source, BMDProject target);

    /**
     * Get the default tolerance for "close match" determination
     */
    int getDefaultTolerance();
}
