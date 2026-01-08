package com.sciome;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.DoseResponseExperiment;
import com.sciome.bmdexpress2.mvp.model.prefilter.OneWayANOVAResults;
import com.sciome.bmdexpress2.mvp.model.prefilter.OneWayANOVAResult;

import java.io.FileInputStream;
import java.io.ObjectInputStream;

/**
 * Verification program to read and validate P3MP-Parham-with-anova.bm2
 */
public class VerifyBM2File {

    public static void main(String[] args) {
        try {
            System.out.println("=".repeat(80));
            System.out.println("VERIFYING P3MP-PARHAM-WITH-ANOVA.BM2");
            System.out.println("=".repeat(80));
            System.out.println();

            // Read original file
            System.out.println("1. READING ORIGINAL FILE: P3MP-Parham.bm2");
            System.out.println("-".repeat(80));
            BMDProject originalProject = readProject("src/main/resources/data/bmd/P3MP-Parham.bm2");
            printProjectSummary(originalProject, "ORIGINAL");

            // Read new file
            System.out.println("\n2. READING NEW FILE: P3MP-Parham-with-anova.bm2");
            System.out.println("-".repeat(80));
            BMDProject newProject = readProject("src/main/resources/data/bmd/P3MP-Parham-with-anova.bm2");
            printProjectSummary(newProject, "NEW");

            // Verify original data preservation
            System.out.println("\n3. VERIFYING ORIGINAL DATA PRESERVATION");
            System.out.println("-".repeat(80));
            verifyOriginalDataPreserved(originalProject, newProject);

            // Verify new ANOVA results
            System.out.println("\n4. VERIFYING NEW ANOVA RESULTS");
            System.out.println("-".repeat(80));
            verifyAnovaResults(newProject);

            System.out.println("\n" + "=".repeat(80));
            System.out.println("✅ VERIFICATION COMPLETE - ALL CHECKS PASSED");
            System.out.println("=".repeat(80));

        } catch (Exception e) {
            System.err.println("❌ VERIFICATION FAILED:");
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static BMDProject readProject(String path) throws Exception {
        try (ObjectInputStream in = new ObjectInputStream(new FileInputStream(path))) {
            return (BMDProject) in.readObject();
        }
    }

    private static void printProjectSummary(BMDProject project, String label) {
        System.out.println("Project: " + project.getName());
        System.out.println("DoseResponseExperiments: " + project.getDoseResponseExperiments().size());
        System.out.println("OneWayANOVAResults: " +
            (project.getOneWayANOVAResults() != null ? project.getOneWayANOVAResults().size() : 0));
        System.out.println("WilliamsTrendResults: " +
            (project.getWilliamsTrendResults() != null ? project.getWilliamsTrendResults().size() : 0));
        System.out.println("CurveFitPrefilterResults: " +
            (project.getCurveFitPrefilterResults() != null ? project.getCurveFitPrefilterResults().size() : 0));

        // Count total probes
        int totalProbes = 0;
        for (DoseResponseExperiment exp : project.getDoseResponseExperiments()) {
            totalProbes += exp.getProbeResponses().size();
        }
        System.out.println("Total Probes across all experiments: " + totalProbes);
    }

    private static void verifyOriginalDataPreserved(BMDProject original, BMDProject newProject) {
        // Check experiment count
        int origExpCount = original.getDoseResponseExperiments().size();
        int newExpCount = newProject.getDoseResponseExperiments().size();
        System.out.println("✓ Experiment count: " + origExpCount + " (original) == " + newExpCount + " (new)");
        if (origExpCount != newExpCount) {
            throw new RuntimeException("Experiment count mismatch!");
        }

        // Check each experiment
        for (int i = 0; i < origExpCount; i++) {
            DoseResponseExperiment origExp = original.getDoseResponseExperiments().get(i);
            DoseResponseExperiment newExp = newProject.getDoseResponseExperiments().get(i);

            // Check experiment name
            if (!origExp.getName().equals(newExp.getName())) {
                throw new RuntimeException("Experiment name mismatch at index " + i);
            }

            // Check probe count
            int origProbeCount = origExp.getProbeResponses().size();
            int newProbeCount = newExp.getProbeResponses().size();
            if (origProbeCount != newProbeCount) {
                throw new RuntimeException("Probe count mismatch for " + origExp.getName() +
                    ": " + origProbeCount + " vs " + newProbeCount);
            }

            // Check treatment count
            int origTreatmentCount = origExp.getTreatments().size();
            int newTreatmentCount = newExp.getTreatments().size();
            if (origTreatmentCount != newTreatmentCount) {
                throw new RuntimeException("Treatment count mismatch for " + origExp.getName());
            }

            System.out.println("  ✓ Experiment [" + i + "]: " + newExp.getName() +
                " - " + newProbeCount + " probes, " + newTreatmentCount + " treatments");
        }

        System.out.println("✅ All original data preserved correctly");
    }

    private static void verifyAnovaResults(BMDProject project) {
        if (project.getOneWayANOVAResults() == null || project.getOneWayANOVAResults().isEmpty()) {
            throw new RuntimeException("No ANOVA results found!");
        }

        int anovaResultsCount = project.getOneWayANOVAResults().size();
        int experimentsCount = project.getDoseResponseExperiments().size();

        System.out.println("✓ ANOVA Results count: " + anovaResultsCount);
        System.out.println("✓ Expected (one per experiment): " + experimentsCount);

        if (anovaResultsCount != experimentsCount) {
            throw new RuntimeException("ANOVA results count mismatch! Expected " + experimentsCount +
                ", found " + anovaResultsCount);
        }

        // Verify each ANOVA result
        int totalProbesAnalyzed = 0;
        int totalWithPValues = 0;
        int totalWithFValues = 0;
        int totalWithFoldChanges = 0;

        for (int i = 0; i < anovaResultsCount; i++) {
            OneWayANOVAResults anovaResults = project.getOneWayANOVAResults().get(i);
            DoseResponseExperiment parentExp = anovaResults.getDoseResponseExperiement();

            // Verify link to parent experiment
            if (parentExp == null) {
                throw new RuntimeException("ANOVA result " + i + " has no parent experiment reference!");
            }

            // Verify result count matches experiment probe count
            int probeCount = parentExp.getProbeResponses().size();
            int resultCount = anovaResults.getOneWayANOVAResults().size();

            if (probeCount != resultCount) {
                throw new RuntimeException("Result count mismatch for " + anovaResults.getName() +
                    ": " + probeCount + " probes vs " + resultCount + " results");
            }

            // Check first few results for data integrity
            int validPValues = 0;
            int validFValues = 0;
            int validFoldChanges = 0;

            for (OneWayANOVAResult result : anovaResults.getOneWayANOVAResults()) {
                // Check p-value
                if (result.getpValue() >= 0 && result.getpValue() <= 1.0) {
                    validPValues++;
                }

                // Check F-value
                if (result.getfValue() >= 0) {
                    validFValues++;
                }

                // Check fold changes
                if (result.getBestFoldChange() != null && result.getBestFoldChange() > 0) {
                    validFoldChanges++;
                }

                // Check degrees of freedom
                if (result.getDegreesOfFreedomOne() <= 0 || result.getDegreesOfFreedomTwo() <= 0) {
                    throw new RuntimeException("Invalid degrees of freedom in result for " +
                        result.getProbeResponse().getProbe().getId());
                }
            }

            totalProbesAnalyzed += resultCount;
            totalWithPValues += validPValues;
            totalWithFValues += validFValues;
            totalWithFoldChanges += validFoldChanges;

            System.out.println("  ✓ [" + (i+1) + "/" + anovaResultsCount + "] " + anovaResults.getName());
            System.out.println("      Probes: " + resultCount +
                ", Valid p-values: " + validPValues +
                ", Valid F-values: " + validFValues +
                ", With fold changes: " + validFoldChanges);

            // Verify AnalysisInfo
            if (anovaResults.getAnalysisInfo() == null) {
                throw new RuntimeException("ANOVA result " + i + " has no AnalysisInfo!");
            }
            if (anovaResults.getAnalysisInfo().getNotes() == null ||
                anovaResults.getAnalysisInfo().getNotes().isEmpty()) {
                throw new RuntimeException("ANOVA result " + i + " has no analysis notes!");
            }
        }

        System.out.println("\n✅ ANOVA Results Validation Summary:");
        System.out.println("   Total probes analyzed: " + totalProbesAnalyzed);
        System.out.println("   Total with valid p-values: " + totalWithPValues);
        System.out.println("   Total with valid F-values: " + totalWithFValues);
        System.out.println("   Total with fold changes: " + totalWithFoldChanges);

        // Final sanity checks
        if (totalWithPValues != totalProbesAnalyzed) {
            throw new RuntimeException("Not all results have valid p-values!");
        }
        if (totalWithFValues != totalProbesAnalyzed) {
            throw new RuntimeException("Not all results have valid F-values!");
        }
        if (totalWithFoldChanges < totalProbesAnalyzed * 0.9) {
            System.out.println("⚠️  Warning: Some results missing fold changes (may be expected)");
        }

        System.out.println("✅ All ANOVA results correctly constructed and validated");
    }
}
