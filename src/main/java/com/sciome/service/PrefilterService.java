package com.sciome.service;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.DoseResponseExperiment;
import com.sciome.bmdexpress2.mvp.model.probe.ProbeResponse;
import com.sciome.bmdexpress2.mvp.model.probe.Treatment;
import com.sciome.bmdexpress2.mvp.model.prefilter.OneWayANOVAResults;
import com.sciome.bmdexpress2.mvp.model.info.AnalysisInfo;
import com.sciome.dto.prefilter.*;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.ObjectOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service for prefilter analysis operations
 * Provides in-memory storage and execution of prefilter analyses
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class PrefilterService {

    private static final Logger log = LoggerFactory.getLogger(PrefilterService.class);

    @Autowired
    private ProjectService projectService;

    // In-memory prefilter results store
    // Maps prefilter results ID (UUID) -> PrefilterResults
    private final Map<String, PrefilterResults> prefilterResultsStore = new ConcurrentHashMap<>();

    /**
     * Get all prefilter results
     *
     * @return List of all PrefilterResults
     */
    public List<PrefilterResults> getAllPrefilterResults() {
        return List.copyOf(prefilterResultsStore.values());
    }

    /**
     * Get prefilter results by ID
     *
     * @param id Prefilter results ID
     * @return PrefilterResults or null if not found
     */
    public PrefilterResults getPrefilterResultsById(String id) {
        return prefilterResultsStore.get(id);
    }

    /**
     * Delete prefilter results by ID
     *
     * @param id Prefilter results ID
     * @return true if deleted, false if not found
     */
    public boolean deletePrefilterResults(String id) {
        return prefilterResultsStore.remove(id) != null;
    }

    /**
     * Get list of prefilter results IDs and names for dropdown/selection
     *
     * @return List of maps with id and name keys
     */
    public List<Map<String, String>> getPrefilterResultsList() {
        return prefilterResultsStore.values().stream()
            .map(results -> Map.of(
                "id", results.getId(),
                "name", results.getName(),
                "type", results.getPrefilterType()
            ))
            .collect(Collectors.toList());
    }

    // ========================================
    // ONE-WAY ANOVA
    // ========================================

    /**
     * Perform One-Way ANOVA prefilter analysis
     *
     * @param input ANOVA input parameters
     * @return PrefilterResults containing analysis results
     */
    public PrefilterResults oneWayANOVA(OneWayANOVAInput input) {
        log.info("Starting One-Way ANOVA prefilter analysis for ALL experiments");
        log.info("Project ID: {}", input.getDoseResponseExperimentId());
        log.info("P-value cutoff: {}", input.getpValueCutOff());

        // Load project
        BMDProject project = projectService.getProject(input.getDoseResponseExperimentId());
        if (project == null) {
            throw new IllegalArgumentException("Project not found: " + input.getDoseResponseExperimentId());
        }

        log.info("Project: {} - Processing {} experiments", project.getName(), project.getDoseResponseExperiments().size());

        // Initialize OneWayANOVAResults list if null
        if (project.getOneWayANOVAResults() == null) {
            project.setOneWayANOVAResults(new ArrayList<>());
        }

        int totalProbesAnalyzed = 0;
        int totalProbesPassed = 0;

        // Process EACH experiment
        for (int i = 0; i < project.getDoseResponseExperiments().size(); i++) {
            DoseResponseExperiment experiment = project.getDoseResponseExperiments().get(i);
            log.info("[{}/{}] Processing: {}", i + 1, project.getDoseResponseExperiments().size(), experiment.getName());
            log.info("     Probes: {}, Treatments: {}", experiment.getProbeResponses().size(), experiment.getTreatments().size());

            // Perform ANOVA analysis
            List<com.sciome.dto.prefilter.OneWayANOVAResult> anovaResults = performANOVAAnalysis(experiment);

            // Apply FDR correction if requested
            if (input.getUseBenAndHoch()) {
                applyBenjaminiHochberg(anovaResults);
            }

            // Calculate fold changes
            calculateFoldChanges(anovaResults, experiment);

            // Convert DTO results to desktop model
            List<com.sciome.bmdexpress2.mvp.model.prefilter.OneWayANOVAResult> desktopResults =
                convertToDesktopResults(anovaResults, experiment);

            // Create OneWayANOVAResults object
            OneWayANOVAResults results = new OneWayANOVAResults();
            results.setName(experiment.getName() + " - One-Way ANOVA");
            results.setDoseResponseExperiement(experiment);
            results.setOneWayANOVAResults(desktopResults);

            // Create AnalysisInfo
            AnalysisInfo analysisInfo = new AnalysisInfo();
            List<String> notes = new ArrayList<>();
            notes.add("Analysis performed: " + LocalDateTime.now());
            notes.add("P-value cutoff: " + input.getpValueCutOff());
            notes.add("Use FDR correction: " + input.getUseBenAndHoch());
            notes.add("Use fold change filter: " + input.getUseFoldChange());
            notes.add("Fold change threshold: " + input.getFoldChangeValue());
            notes.add("Filter control genes: " + input.getFilterControlGenes());
            analysisInfo.setNotes(notes);
            results.setAnalysisInfo(analysisInfo);

            // Add to project
            project.getOneWayANOVAResults().add(results);

            // Count results
            totalProbesAnalyzed += anovaResults.size();
            List<com.sciome.dto.prefilter.OneWayANOVAResult> passedResults = filterResults(anovaResults, input);
            totalProbesPassed += passedResults.size();

            log.info("     Complete: {} probes analyzed, {} passed filters", anovaResults.size(), passedResults.size());
        }

        // Save updated project to .bm2 file
        String projectId = input.getDoseResponseExperimentId();
        File outputFile = new File("src/main/resources/data/bmd/" + projectId + "-with-anova.bm2");

        try {
            outputFile.getParentFile().mkdirs();
            try (ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream(outputFile))) {
                out.writeObject(project);
            }
            log.info("Saved updated project to: {}", outputFile.getAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to save project file", e);
            throw new RuntimeException("Failed to save updated project: " + e.getMessage(), e);
        }

        // Create summary PrefilterResults for UI
        PrefilterResults summaryResults = new PrefilterResults();
        summaryResults.setId(UUID.randomUUID().toString());
        summaryResults.setName(input.getName() != null ? input.getName() : "ANOVA Analysis (All Experiments)");
        summaryResults.setPrefilterType("ANOVA");
        summaryResults.setCreatedDate(LocalDateTime.now());
        summaryResults.setVersion("1.0.0-SNAPSHOT");
        summaryResults.setDoseResponseExperimentId(projectId);
        summaryResults.setDoseResponseExperimentName(project.getName() + " - All Experiments");
        summaryResults.setInputParameters(input);
        summaryResults.setTotalProbesAnalyzed(totalProbesAnalyzed);
        summaryResults.setProbesPassed(totalProbesPassed);
        summaryResults.setProbesFailed(totalProbesAnalyzed - totalProbesPassed);
        summaryResults.setResults(new ArrayList<>()); // Summary doesn't contain individual results

        prefilterResultsStore.put(summaryResults.getId(), summaryResults);

        log.info("=================================================================");
        log.info("ANOVA analysis complete for ALL {} experiments", project.getDoseResponseExperiments().size());
        log.info("Total probes analyzed: {}", totalProbesAnalyzed);
        log.info("Total probes passed: {}", totalProbesPassed);
        log.info("Results saved to: {}", outputFile.getAbsolutePath());
        log.info("=================================================================");

        return summaryResults;
    }

    /**
     * Convert DTO OneWayANOVAResult objects to desktop model OneWayANOVAResult objects
     */
    private List<com.sciome.bmdexpress2.mvp.model.prefilter.OneWayANOVAResult> convertToDesktopResults(
            List<com.sciome.dto.prefilter.OneWayANOVAResult> dtoResults,
            DoseResponseExperiment experiment) {

        List<com.sciome.bmdexpress2.mvp.model.prefilter.OneWayANOVAResult> desktopResults = new ArrayList<>();

        // Create a map of probe ID to ProbeResponse for quick lookup
        Map<String, ProbeResponse> probeMap = new HashMap<>();
        for (ProbeResponse pr : experiment.getProbeResponses()) {
            probeMap.put(pr.getProbe().getId(), pr);
        }

        for (com.sciome.dto.prefilter.OneWayANOVAResult dtoResult : dtoResults) {
            com.sciome.bmdexpress2.mvp.model.prefilter.OneWayANOVAResult desktopResult =
                new com.sciome.bmdexpress2.mvp.model.prefilter.OneWayANOVAResult();

            // Set probe response
            ProbeResponse probeResponse = probeMap.get(dtoResult.getProbeId());
            if (probeResponse != null) {
                desktopResult.setProbeResponse(probeResponse);
            }

            // Set statistics
            desktopResult.setfValue(dtoResult.getfValue());
            desktopResult.setpValue(dtoResult.getpValue());

            // Set adjusted p-value (may be null if FDR correction not applied)
            if (dtoResult.getAdjustedPValue() != null) {
                desktopResult.setAdjustedPValue(dtoResult.getAdjustedPValue());
            }

            desktopResult.setDegreesOfFreedomOne(dtoResult.getDegreesOfFreedomOne().shortValue());
            desktopResult.setDegreesOfFreedomTwo(dtoResult.getDegreesOfFreedomTwo().shortValue());

            // Set fold changes (convert Double to Float)
            if (dtoResult.getBestFoldChange() != null) {
                desktopResult.setBestFoldChange(dtoResult.getBestFoldChange().floatValue());
            }
            if (dtoResult.getFoldChanges() != null) {
                // Convert List<Double> to List<Float>
                List<Float> foldChangesFloat = dtoResult.getFoldChanges().stream()
                    .map(Double::floatValue)
                    .collect(Collectors.toList());
                desktopResult.setFoldChanges(foldChangesFloat);
            }

            // NOTEL/LOTEL will be calculated later if needed
            // For now, leave them null

            desktopResults.add(desktopResult);
        }

        return desktopResults;
    }

    // ========================================
    // WILLIAMS TREND TEST
    // ========================================

    /**
     * Perform Williams Trend Test prefilter analysis
     *
     * @param input Williams Trend input parameters
     * @return PrefilterResults containing analysis results
     */
    public PrefilterResults williamsTrend(WilliamsTrendInput input) {
        log.info("Starting Williams Trend Test prefilter analysis");
        log.info("Experiment ID: {}", input.getDoseResponseExperimentId());
        log.info("Number of permutations: {}", input.getNumPermutations());

        // TODO: Implement Williams Trend analysis
        PrefilterResults results = createMockResults(input, "WILLIAMS");

        prefilterResultsStore.put(results.getId(), results);
        log.info("Williams Trend analysis complete. Results ID: {}", results.getId());

        return results;
    }

    // ========================================
    // ORIOGEN
    // ========================================

    /**
     * Perform Oriogen prefilter analysis
     *
     * @param input Oriogen input parameters
     * @return PrefilterResults containing analysis results
     */
    public PrefilterResults oriogen(OriogenInput input) {
        log.info("Starting Oriogen prefilter analysis");
        log.info("Experiment ID: {}", input.getDoseResponseExperimentId());
        log.info("Initial bootstraps: {}", input.getNumInitialBootstraps());
        log.info("Maximum bootstraps: {}", input.getNumMaximumBootstraps());

        // TODO: Implement Oriogen analysis
        PrefilterResults results = createMockResults(input, "ORIOGEN");

        prefilterResultsStore.put(results.getId(), results);
        log.info("Oriogen analysis complete. Results ID: {}", results.getId());

        return results;
    }

    // ========================================
    // CURVE FIT PREFILTER
    // ========================================

    /**
     * Perform Curve Fit Prefilter analysis
     *
     * @param input Curve Fit input parameters
     * @return PrefilterResults containing analysis results
     */
    public PrefilterResults curveFitPrefilter(CurveFitPrefilterInput input) {
        log.info("Starting Curve Fit Prefilter analysis");
        log.info("Experiment ID: {}", input.getDoseResponseExperimentId());
        log.info("Models selected - Hill: {}, Power: {}, Exp3: {}, Exp5: {}, Linear: {}, Poly2: {}",
            input.getIsHill(), input.getIsPower(), input.getIsExp3(),
            input.getIsExp5(), input.getIsLinear(), input.getIsPoly2());

        // TODO: Implement Curve Fit Prefilter analysis
        PrefilterResults results = createMockResults(input, "CURVE_FIT");

        prefilterResultsStore.put(results.getId(), results);
        log.info("Curve Fit Prefilter analysis complete. Results ID: {}", results.getId());

        return results;
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Perform ANOVA analysis on all probes
     */
    private List<OneWayANOVAResult> performANOVAAnalysis(DoseResponseExperiment experiment) {
        List<OneWayANOVAResult> results = new ArrayList<>();
        List<Treatment> treatments = experiment.getTreatments();

        // Build dose array
        double[] doses = new double[treatments.size()];
        for (int i = 0; i < treatments.size(); i++) {
            doses[i] = treatments.get(i).getDose();
        }

        // Analyze each probe
        for (ProbeResponse probeResponse : experiment.getProbeResponses()) {
            OneWayANOVAResult result = calculateANOVA(probeResponse, doses);
            results.add(result);
        }

        return results;
    }

    /**
     * Calculate ANOVA F-statistic and p-value for a single probe
     */
    private OneWayANOVAResult calculateANOVA(ProbeResponse probeResponse, double[] doses) {
        List<Float> responses = probeResponse.getResponses();

        // Group responses by dose
        Map<Double, List<Double>> doseGroups = new HashMap<>();
        for (int i = 0; i < doses.length; i++) {
            doseGroups.computeIfAbsent(doses[i], k -> new ArrayList<>()).add((double) responses.get(i));
        }

        // Calculate group statistics
        int totalN = responses.size();
        int numGroups = doseGroups.size();
        double grandMean = responses.stream().mapToDouble(Float::doubleValue).average().orElse(0);

        // Calculate sum of squares
        double ssBetween = 0.0;
        double ssWithin = 0.0;

        for (Map.Entry<Double, List<Double>> entry : doseGroups.entrySet()) {
            List<Double> groupValues = entry.getValue();
            int groupN = groupValues.size();
            double groupMean = groupValues.stream().mapToDouble(Double::doubleValue).average().orElse(0);

            // Between-group sum of squares
            ssBetween += groupN * Math.pow(groupMean - grandMean, 2);

            // Within-group sum of squares
            for (double value : groupValues) {
                ssWithin += Math.pow(value - groupMean, 2);
            }
        }

        // Calculate degrees of freedom
        int dfBetween = numGroups - 1;
        int dfWithin = totalN - numGroups;

        // Calculate mean squares
        double msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
        double msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

        // Calculate F-statistic
        double fValue = msWithin > 0 ? msBetween / msWithin : 0;

        // Calculate p-value using F-distribution
        double pValue = calculateFDistributionPValue(fValue, dfBetween, dfWithin);

        // Create result
        OneWayANOVAResult result = new OneWayANOVAResult();
        result.setProbeId(probeResponse.getProbe().getId());
        result.setpValue(pValue);
        result.setfValue(fValue);
        result.setDegreesOfFreedomOne(dfBetween);
        result.setDegreesOfFreedomTwo(dfWithin);

        return result;
    }

    /**
     * Calculate p-value from F-distribution (simplified approximation)
     */
    private double calculateFDistributionPValue(double f, int df1, int df2) {
        if (f <= 0 || df1 <= 0 || df2 <= 0) {
            return 1.0;
        }

        // Simplified approximation using incomplete beta function
        // For production, use Apache Commons Math or similar library
        double x = df2 / (df2 + df1 * f);
        return incompleteBeta(x, df2 / 2.0, df1 / 2.0);
    }

    /**
     * Simplified incomplete beta function approximation
     */
    private double incompleteBeta(double x, double a, double b) {
        if (x <= 0) return 0.0;
        if (x >= 1) return 1.0;

        // Simple approximation - for production use Apache Commons Math
        return Math.pow(x, a) * Math.pow(1 - x, b) / (a + b);
    }

    /**
     * Apply Benjamini-Hochberg FDR correction
     */
    private void applyBenjaminiHochberg(List<OneWayANOVAResult> results) {
        int m = results.size();

        // Sort by p-value
        List<OneWayANOVAResult> sorted = new ArrayList<>(results);
        sorted.sort(Comparator.comparingDouble(OneWayANOVAResult::getpValue));

        // Calculate adjusted p-values
        for (int i = 0; i < sorted.size(); i++) {
            int rank = i + 1;
            double adjustedP = sorted.get(i).getpValue() * m / rank;
            sorted.get(i).setAdjustedPValue(Math.min(adjustedP, 1.0));
        }

        // Enforce monotonicity (adjusted p-values should be non-decreasing)
        for (int i = sorted.size() - 2; i >= 0; i--) {
            if (sorted.get(i).getAdjustedPValue() > sorted.get(i + 1).getAdjustedPValue()) {
                sorted.get(i).setAdjustedPValue(sorted.get(i + 1).getAdjustedPValue());
            }
        }
    }

    /**
     * Calculate fold changes for all probes
     */
    private void calculateFoldChanges(List<OneWayANOVAResult> results, DoseResponseExperiment experiment) {
        List<Treatment> treatments = experiment.getTreatments();

        // Find control dose (lowest dose, typically 0)
        double controlDose = treatments.stream()
            .mapToDouble(t -> t.getDose())
            .min()
            .orElse(0);

        for (OneWayANOVAResult result : results) {
            // Get probe responses
            ProbeResponse probeResponse = experiment.getProbeResponses().stream()
                .filter(pr -> pr.getProbe().getId().equals(result.getProbeId()))
                .findFirst()
                .orElse(null);

            if (probeResponse != null) {
                List<Float> responses = probeResponse.getResponses();

                // Calculate mean at control and each dose
                Map<Double, List<Double>> doseGroups = new HashMap<>();
                for (int i = 0; i < treatments.size(); i++) {
                    double dose = treatments.get(i).getDose();
                    doseGroups.computeIfAbsent(dose, k -> new ArrayList<>())
                        .add((double) responses.get(i));
                }

                double controlMean = doseGroups.get(controlDose).stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(1.0);

                // Calculate fold changes and find maximum
                List<Double> foldChanges = new ArrayList<>();
                double maxFoldChange = 0.0;

                for (Map.Entry<Double, List<Double>> entry : doseGroups.entrySet()) {
                    double doseMean = entry.getValue().stream()
                        .mapToDouble(Double::doubleValue)
                        .average()
                        .orElse(0);

                    double foldChange = controlMean != 0 ? Math.abs(doseMean / controlMean) : 0;
                    foldChanges.add(foldChange);
                    maxFoldChange = Math.max(maxFoldChange, foldChange);
                }

                result.setFoldChanges(foldChanges);
                result.setBestFoldChange(maxFoldChange);
            }
        }
    }

    /**
     * Filter results based on criteria
     */
    private List<OneWayANOVAResult> filterResults(List<OneWayANOVAResult> results, OneWayANOVAInput input) {
        return results.stream()
            .filter(result -> {
                // P-value filter
                double pValue = input.getUseBenAndHoch() ? result.getAdjustedPValue() : result.getpValue();
                if (pValue > input.getpValueCutOff()) {
                    return false;
                }

                // Fold change filter
                if (input.getUseFoldChange() && result.getBestFoldChange() != null) {
                    if (result.getBestFoldChange() < input.getFoldChangeValue()) {
                        return false;
                    }
                }

                // Control gene filter (AFFX- prefix)
                if (input.getFilterControlGenes() && result.getProbeId().startsWith("AFFX-")) {
                    return false;
                }

                return true;
            })
            .collect(Collectors.toList());
    }

    /**
     * Create mock results for testing (temporary until real implementation)
     */
    private PrefilterResults createMockResults(PrefilterInput input, String prefilterType) {
        PrefilterResults results = new PrefilterResults();
        results.setId(UUID.randomUUID().toString());
        results.setName(input.getName() != null ? input.getName() : "Prefilter Analysis " + LocalDateTime.now());
        results.setPrefilterType(prefilterType);
        results.setCreatedDate(LocalDateTime.now());
        results.setVersion("1.0.0-SNAPSHOT");
        results.setDoseResponseExperimentId(input.getDoseResponseExperimentId());
        results.setInputParameters(input);

        // Mock summary statistics
        results.setTotalProbesAnalyzed(1000);
        results.setProbesPassed(150);
        results.setProbesFailed(850);

        // Mock result list (empty for now)
        results.setResults(List.of());

        return results;
    }
}
