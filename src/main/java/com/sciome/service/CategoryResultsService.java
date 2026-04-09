package com.sciome.service;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResult;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResults;
import com.sciome.bmdexpress2.mvp.model.category.ReferenceGeneProbeStatResult;
import com.sciome.bmdexpress2.mvp.model.stat.BMDResult;
import com.sciome.bmdexpress2.mvp.model.stat.ProbeStatResult;
import com.sciome.dto.AnalysisAnnotationDto;
import com.sciome.dto.BMDMarkersDto;
import com.sciome.dto.CategoryAnalysisResultsDto;
import com.sciome.dto.CurveDataDto;
import com.sciome.dto.DosePointDto;
import com.sciome.dto.PathwayInfoDto;
import com.sciome.dto.VennDiagramDataDto;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing and querying category analysis results within projects.
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class CategoryResultsService {

    private static final Logger logger = LoggerFactory.getLogger(CategoryResultsService.class);

    private final ProjectService projectService;

    @Autowired
    public CategoryResultsService(ProjectService projectService) {
        this.projectService = projectService;
    }

    /**
     * Find a specific category analysis result by name within a project (package-private, not exposed to browser).
     *
     * @param projectId the project identifier
     * @param categoryResultName the name of the category result to find (case-insensitive)
     * @return the CategoryAnalysisResults matching the name
     * @throws IllegalArgumentException if the project or result is not found
     */
    CategoryAnalysisResults findCategoryResult(String projectId, String categoryResultName) {
        BMDProject project = projectService.getProject(projectId);

        if (project.getCategoryAnalysisResults() == null) {
            throw new IllegalArgumentException("No category analysis results found in project " + projectId);
        }

        return project.getCategoryAnalysisResults().stream()
                .filter(result -> result.getName().equalsIgnoreCase(categoryResultName))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Category analysis result not found: " + categoryResultName + " in project " + projectId));
    }

    /**
     * Get the names of all category analysis results in a project.
     *
     * @param projectId the project identifier
     * @return list of category analysis result names
     * @throws IllegalArgumentException if the project is not found
     */
    public List<String> getCategoryResultNames(String projectId) {
        BMDProject project = projectService.getProject(projectId);

        if (project.getCategoryAnalysisResults() == null) {
            return List.of();
        }

        return project.getCategoryAnalysisResults().stream()
                .map(CategoryAnalysisResults::getName)
                .collect(Collectors.toList());
    }

    /**
     * Get category analysis results (converted to DTOs for browser consumption).
     *
     * @param projectId the project identifier
     * @param categoryResultName the name of the category result to retrieve
     * @return container DTO with experiment description and results list
     * @throws IllegalArgumentException if the project or result is not found
     */
    public CategoryAnalysisResultsDto getCategoryResults(String projectId, String categoryResultName) {
        BMDProject project = projectService.getProject(projectId);
        CategoryAnalysisResults categoryResults = findCategoryResult(projectId, categoryResultName);

        // DEBUG: Inspect object identities and ExperimentDescription status
        logger.info("============================================");
        logger.info("[DEBUG-WEBAPP] Inspecting category results: {}", categoryResultName);

        // Check what getExperimentDescription() returns (the convenience method)
        var directExpDesc = categoryResults.getExperimentDescription();
        logger.info("[DEBUG-WEBAPP] categoryResults.getExperimentDescription(): {}", directExpDesc);

        // Check the BMDResult's DoseResponseExperiment
        if (categoryResults.getBmdResult() != null) {
            var bmdDoseResp = categoryResults.getBmdResult().getDoseResponseExperiment();
            if (bmdDoseResp != null) {
                logger.info("[DEBUG-WEBAPP] BMDResult.DoseResponseExperiment.name: {}", bmdDoseResp.getName());
                logger.info("[DEBUG-WEBAPP] BMDResult.DoseResponseExperiment.identity: {}",
                    System.identityHashCode(bmdDoseResp));
                logger.info("[DEBUG-WEBAPP] BMDResult.DoseResponseExperiment.getExperimentDescription(): {}",
                    bmdDoseResp.getExperimentDescription());
            } else {
                logger.warn("[DEBUG-WEBAPP] BMDResult.DoseResponseExperiment is NULL!");
            }
        } else {
            logger.warn("[DEBUG-WEBAPP] categoryResults.getBmdResult() is NULL!");
        }

        // Check the project's DoseResponseExperiments list
        logger.info("[DEBUG-WEBAPP] Project's DoseResponseExperiments:");
        if (project.getDoseResponseExperiments() != null) {
            for (var exp : project.getDoseResponseExperiments()) {
                logger.info("  Name: {}", exp.getName());
                logger.info("    Identity: {}", System.identityHashCode(exp));
                logger.info("    Has ExperimentDescription: {}", exp.getExperimentDescription() != null);
                if (exp.getExperimentDescription() != null) {
                    logger.info("    Sex: {}", exp.getExperimentDescription().getSex());
                }
            }
        }
        logger.info("============================================");

        // Get experiment description - look it up by name from project's DoseResponseExperiments list
        // because the BMDResult's reference may be a stale object without the experiment description
        com.sciome.bmdexpress2.mvp.model.info.ExperimentDescription experimentDesc =
            findExperimentDescriptionByName(project, categoryResults);

        if (categoryResults.getCategoryAnalsyisResults() == null) {
            CategoryAnalysisResultsDto emptyDto = new CategoryAnalysisResultsDto();
            emptyDto.setName(categoryResults.getName());
            emptyDto.setExperimentDescription(
                com.sciome.dto.ExperimentDescriptionDto.fromDesktopObject(experimentDesc));
            emptyDto.setResults(List.of());
            return emptyDto;
        }

        CategoryAnalysisResultsDto dto = CategoryAnalysisResultsDto.fromDesktopObject(categoryResults);
        // Override with the experiment description we found from project lookup
        dto.setExperimentDescription(com.sciome.dto.ExperimentDescriptionDto.fromDesktopObject(experimentDesc));
        return dto;
    }

    /**
     * Find the ExperimentDescription by looking up the DoseResponseExperiment by name
     * from the project's list. This handles cases where serialized BMDResult references
     * point to stale objects that don't have the ExperimentDescription populated.
     */
    private com.sciome.bmdexpress2.mvp.model.info.ExperimentDescription findExperimentDescriptionByName(
            BMDProject project, CategoryAnalysisResults categoryResults) {

        // First try the convenience method (in case the reference is up-to-date)
        com.sciome.bmdexpress2.mvp.model.info.ExperimentDescription desc =
            categoryResults.getExperimentDescription();
        if (desc != null) {
            return desc;
        }

        // Fall back to looking up by name from the project's DoseResponseExperiments
        if (categoryResults.getBmdResult() != null &&
            categoryResults.getBmdResult().getDoseResponseExperiment() != null &&
            project.getDoseResponseExperiments() != null) {

            String expName = categoryResults.getBmdResult().getDoseResponseExperiment().getName();
            for (var exp : project.getDoseResponseExperiments()) {
                if (exp.getName() != null && exp.getName().equals(expName)) {
                    return exp.getExperimentDescription();
                }
            }
        }

        return null;
    }

    /**
     * Get annotation metadata for a category analysis result.
     *
     * Builds the annotation from the deserialized ExperimentDescription metadata
     * (chemical, sex, organ, species, platform) rather than parsing the name string.
     * The analysis type (GO_BP, GENE, etc.) is still extracted from the name since
     * it's not stored as structured data in the bm2 model.
     *
     * @param projectId the project identifier
     * @param categoryResultName the name of the category result
     * @return AnalysisAnnotationDto with metadata from ExperimentDescription
     * @throws IllegalArgumentException if the project or result is not found
     */
    public AnalysisAnnotationDto getCategoryResultAnnotation(String projectId, String categoryResultName) {
        BMDProject project = projectService.getProject(projectId);
        CategoryAnalysisResults catResults = findCategoryResult(projectId, categoryResultName);
        return buildAnnotationFromObject(project, catResults);
    }

    /**
     * Get annotation metadata for all category analysis results in a project.
     *
     * Iterates over the actual deserialized CategoryAnalysisResults objects and
     * pulls metadata from their linked ExperimentDescription. This handles projects
     * with multiple category analyses of the same type (e.g., multiple GO_BP results
     * from different experiments within the same bm2 file).
     *
     * @param projectId the project identifier
     * @return list of AnalysisAnnotationDto objects
     * @throws IllegalArgumentException if the project is not found
     */
    public List<AnalysisAnnotationDto> getAllCategoryResultAnnotations(String projectId) {
        BMDProject project = projectService.getProject(projectId);

        if (project.getCategoryAnalysisResults() == null) {
            return List.of();
        }

        return project.getCategoryAnalysisResults().stream()
                .map(catResults -> buildAnnotationFromObject(project, catResults))
                .collect(Collectors.toList());
    }

    /**
     * Build an AnalysisAnnotationDto from a CategoryAnalysisResults object.
     *
     * Pulls structured metadata (chemical, sex, organ, species, platform) from the
     * ExperimentDescription attached to the category result's DoseResponseExperiment.
     * Extracts analysis type (GO_BP, GENE, etc.) from the category result name since
     * this isn't stored as a separate field in the bm2 data model.
     *
     * Falls back gracefully when ExperimentDescription is missing — the annotation
     * will still have the fullName and analysis type, just no biological metadata.
     */
    private AnalysisAnnotationDto buildAnnotationFromObject(BMDProject project, CategoryAnalysisResults catResults) {
        String fullName = catResults.getName();
        AnalysisAnnotationDto dto = new AnalysisAnnotationDto(fullName);

        // --- Analysis type: extracted from the name string ---
        // This is universal across all bm2 files — the type indicator (GO_BP, GENE, etc.)
        // is always embedded in the category result name.
        dto.setAnalysisType(extractAnalysisType(fullName));

        // --- Experiment name: the linked DoseResponseExperiment name ---
        // This is the most distinguishing piece of info (e.g., "Furan_S1_kidney_RNAseqExtrapolated")
        // and includes chemical set and platform variant that aren't in ExperimentDescription yet.
        String experimentName = null;
        if (catResults.getBmdResult() != null &&
            catResults.getBmdResult().getDoseResponseExperiment() != null) {
            experimentName = catResults.getBmdResult().getDoseResponseExperiment().getName();
        }

        // --- Biological metadata: pulled from ExperimentDescription ---
        com.sciome.bmdexpress2.mvp.model.info.ExperimentDescription desc =
            findExperimentDescriptionByName(project, catResults);

        if (desc != null) {
            // Chemical name from TestArticleIdentifier
            if (desc.getTestArticle() != null && desc.getTestArticle().getName() != null) {
                dto.setChemical(desc.getTestArticle().getName());
            }
            dto.setSex(desc.getSex());
            dto.setOrgan(desc.getOrgan());
            dto.setSpecies(desc.getSpecies());
            dto.setPlatform(desc.getPlatform());
        }

        // --- Display names ---
        // Use the experiment name as the primary display since it contains all
        // distinguishing info (chemical set, organ, platform variant). Clean it
        // up by replacing underscores with spaces for readability.
        if (experimentName != null) {
            dto.setDisplayName(experimentName.replace('_', ' '));
        } else {
            // Fall back to metadata fields if experiment name isn't available
            String sex = dto.getSex() != null ? dto.getSex() : "?";
            String organ = dto.getOrgan() != null ? dto.getOrgan() : "?";
            String species = dto.getSpecies() != null ? dto.getSpecies() : "?";
            dto.setDisplayName(String.format("%s %s (%s)", sex, organ, species));
        }

        // Medium format: experiment name + metadata summary
        String sex = dto.getSex() != null ? dto.getSex() : "?";
        String organ = dto.getOrgan() != null ? dto.getOrgan() : "?";
        String species = dto.getSpecies() != null ? dto.getSpecies() : "?";
        String platform = dto.getPlatform() != null ? dto.getPlatform() : "?";
        dto.setDisplayNameMedium(String.format("%s %s | %s | %s", sex, organ, platform, species));

        // Store experiment name in prefix field for frontend access
        dto.setPrefix(experimentName);

        dto.setParseSuccess(desc != null);
        return dto;
    }

    /**
     * Extract the analysis type indicator from a category result name.
     *
     * Checks for known type strings embedded in the name. Checks specific GO subtypes
     * (GO_BP, GO_CC, GO_MF) before GO_ALL to avoid false matches.
     *
     * @param fullName the full category result name
     * @return the analysis type string, or null if not recognized
     */
    private String extractAnalysisType(String fullName) {
        if (fullName == null) return null;

        // Check specific GO subtypes first to avoid matching GO_ALL prematurely
        if (fullName.contains("GO_BP"))      return "GO_BP";
        if (fullName.contains("GO_CC"))      return "GO_CC";
        if (fullName.contains("GO_MF"))      return "GO_MF";
        if (fullName.contains("GO_ALL"))     return "GO_ALL";
        if (fullName.contains("GENE"))       return "GENE";
        if (fullName.contains("BioPlanet"))  return "BioPlanet";
        if (fullName.contains("Reactome"))   return "Reactome";
        if (fullName.contains("KEGG"))       return "KEGG";
        return null;
    }

    /**
     * Get available pathways from a category analysis result.
     *
     * @param projectId the project identifier
     * @param categoryResultName the name of the category result
     * @return list of pathway information DTOs
     * @throws IllegalArgumentException if the project or result is not found
     */
    public List<PathwayInfoDto> getPathways(String projectId, String categoryResultName) {
        CategoryAnalysisResults categoryResults = findCategoryResult(projectId, categoryResultName);

        if (categoryResults.getCategoryAnalsyisResults() == null) {
            return List.of();
        }

        // Extract unique pathways with gene counts
        Map<String, PathwayInfoDto> pathwayMap = new HashMap<>();

        for (CategoryAnalysisResult result : categoryResults.getCategoryAnalsyisResults()) {
            String pathwayId = result.getCategoryIdentifier() != null ?
                result.getCategoryIdentifier().toString() : "";
            String pathwayDescription = result.getCategoryDescription();

            // Count genes that passed filters
            int geneCount = 0;
            if (result.getReferenceGeneProbeStatResults() != null) {
                geneCount = result.getReferenceGeneProbeStatResults().size();
            }

            // Only include pathways with genes
            if (geneCount > 0 && pathwayDescription != null && !pathwayDescription.isEmpty()) {
                pathwayMap.putIfAbsent(pathwayDescription,
                    new PathwayInfoDto(pathwayId, pathwayDescription, geneCount));
            }
        }

        return pathwayMap.values().stream()
            .sorted(Comparator.comparing(PathwayInfoDto::getPathwayDescription))
            .collect(Collectors.toList());
    }

    /**
     * Get genes in a specific pathway.
     *
     * @param projectId the project identifier
     * @param categoryResultName the name of the category result
     * @param pathwayDescription the pathway description to filter by
     * @return list of unique gene symbols in the pathway
     * @throws IllegalArgumentException if the project or result is not found
     */
    public List<String> getGenesInPathway(String projectId, String categoryResultName, String pathwayDescription) {
        CategoryAnalysisResults categoryResults = findCategoryResult(projectId, categoryResultName);

        if (categoryResults.getCategoryAnalsyisResults() == null) {
            return List.of();
        }

        Set<String> geneSet = new HashSet<>();

        for (CategoryAnalysisResult result : categoryResults.getCategoryAnalsyisResults()) {
            if (!pathwayDescription.equalsIgnoreCase(result.getCategoryDescription())) {
                continue;
            }

            if (result.getReferenceGeneProbeStatResults() == null) {
                continue;
            }

            // Extract unique gene symbols
            for (ReferenceGeneProbeStatResult rgps : result.getReferenceGeneProbeStatResults()) {
                if (rgps.getReferenceGene() != null &&
                    rgps.getReferenceGene().getGeneSymbol() != null) {
                    geneSet.add(rgps.getReferenceGene().getGeneSymbol());
                }
            }
        }

        List<String> returnList = new ArrayList<>(geneSet);
        Collections.sort(returnList);
        return returnList;
    }

    /**
     * Get probe stat results for curve visualization.
     * Returns list of CurveDataDto for selected genes in a pathway.
     *
     * @param projectId the project identifier
     * @param categoryResultName the name of the category result
     * @param pathwayDescription the pathway description
     * @param geneSymbols list of gene symbols to include
     * @return list of CurveDataDto objects with curve and marker data
     * @throws IllegalArgumentException if the project or result is not found
     */
    public List<CurveDataDto> getCurveData(
            String projectId,
            String categoryResultName,
            String pathwayDescription,
            List<String> geneSymbols) {

        CategoryAnalysisResults categoryResults = findCategoryResult(projectId, categoryResultName);

        if (categoryResults.getCategoryAnalsyisResults() == null) {
            return List.of();
        }

        Set<String> geneSet = new HashSet<>(geneSymbols);
        List<CurveDataDto> curves = new ArrayList<>();

        BMDResult bmdResult = categoryResults.getBmdResult();
        if (bmdResult == null || bmdResult.getDoseResponseExperiment() == null) {
            return List.of();
        }

        // Get dose values from experiment
        List<Double> doses = new ArrayList<>();
        if (bmdResult.getDoseResponseExperiment().getTreatments() != null) {
            for (var treatment : bmdResult.getDoseResponseExperiment().getTreatments()) {
                if (treatment.getDose() != null) {
                    doses.add(treatment.getDose().doubleValue());
                }
            }
        }

        for (CategoryAnalysisResult result : categoryResults.getCategoryAnalsyisResults()) {
            if (!pathwayDescription.equalsIgnoreCase(result.getCategoryDescription())) {
                continue;
            }

            if (result.getReferenceGeneProbeStatResults() == null) {
                continue;
            }

            for (ReferenceGeneProbeStatResult rgps : result.getReferenceGeneProbeStatResults()) {
                String geneSymbol = rgps.getReferenceGene() != null ?
                    rgps.getReferenceGene().getGeneSymbol() : null;

                if (geneSymbol == null || !geneSet.contains(geneSymbol)) {
                    continue;
                }

                if (rgps.getProbeStatResults() == null) {
                    continue;
                }

                for (ProbeStatResult psr : rgps.getProbeStatResults()) {
                    CurveDataDto curve = buildCurveData(psr, geneSymbol, categoryResults.getName(),
                                                        pathwayDescription, doses);
                    if (curve != null) {
                        curves.add(curve);
                    }
                }
            }
        }

        return curves;
    }

    /**
     * Build a CurveDataDto from a ProbeStatResult.
     */
    private CurveDataDto buildCurveData(ProbeStatResult psr, String geneSymbol, String chemical,
                                        String pathwayDescription, List<Double> doses) {
        if (psr.getBestStatResult() == null || psr.getProbeResponse() == null) {
            return null;
        }

        var statResult = psr.getBestStatResult();
        var probeResponse = psr.getProbeResponse();

        CurveDataDto dto = new CurveDataDto();
        dto.setGeneSymbol(geneSymbol);
        dto.setProbeId(probeResponse.getProbe() != null ? probeResponse.getProbe().getId() : "unknown");
        dto.setCurveId(geneSymbol + "_" + dto.getProbeId());
        dto.setChemical(chemical);
        dto.setPathwayDescription(pathwayDescription);
        dto.setFittedModel(statResult.toString());

        // Build measured points (actual data)
        List<DosePointDto> measuredPoints = new ArrayList<>();
        List<Float> responses = probeResponse.getResponses();
        if (responses != null && responses.size() == doses.size()) {
            for (int i = 0; i < doses.size(); i++) {
                measuredPoints.add(new DosePointDto(doses.get(i), responses.get(i).doubleValue(), true));
            }
        }
        dto.setMeasuredPoints(measuredPoints);

        // Build interpolated curve points
        List<DosePointDto> curvePoints = buildInterpolatedCurve(statResult, doses);
        dto.setCurvePoints(curvePoints);

        // Build BMD markers
        BMDMarkersDto markers = new BMDMarkersDto();
        if (psr.getBestBMD() != null && !psr.getBestBMD().isNaN() && !psr.getBestBMD().isInfinite()) {
            markers.setBmd(psr.getBestBMD());
            markers.setBmdResponse(statResult.getResponseAt(psr.getBestBMD()));
        }
        if (psr.getBestBMDL() != null && !psr.getBestBMDL().isNaN() && !psr.getBestBMDL().isInfinite()) {
            markers.setBmdl(psr.getBestBMDL());
            markers.setBmdlResponse(statResult.getResponseAt(psr.getBestBMDL()));
        }
        if (psr.getBestBMDU() != null && !psr.getBestBMDU().isNaN() && !psr.getBestBMDU().isInfinite()) {
            markers.setBmdu(psr.getBestBMDU());
            markers.setBmduResponse(statResult.getResponseAt(psr.getBestBMDU()));
        }
        dto.setBmdMarkers(markers);

        // Set additional metadata
        dto.setBestBMD(psr.getBestBMD());
        dto.setBestBMDL(psr.getBestBMDL());
        dto.setBestBMDU(psr.getBestBMDU());
        Double aic = statResult.getAIC();
        if (aic != null) {
            dto.setAic(aic);
        }

        return dto;
    }

    /**
     * Build interpolated curve points (190 points per interval).
     */
    private List<DosePointDto> buildInterpolatedCurve(com.sciome.bmdexpress2.mvp.model.stat.StatResult statResult,
                                                       List<Double> doses) {
        List<DosePointDto> points = new ArrayList<>();

        if (doses == null || doses.isEmpty()) {
            return points;
        }

        // Get unique sorted doses
        Set<Double> uniqueDosesSet = new HashSet<>(doses);
        List<Double> uniqueDoses = new ArrayList<>(uniqueDosesSet);
        Collections.sort(uniqueDoses);

        // Interpolate between each pair of doses
        Double prevDose = null;
        for (Double dose : uniqueDoses) {
            if (prevDose == null) {
                prevDose = dose;
                continue;
            }

            // 190 points per interval (from BMDExpress code)
            double increment = (dose - prevDose) / 190.0;

            for (double counter = prevDose; counter < dose; counter += increment) {
                try {
                    double response = statResult.getResponseAt(counter);
                    if (!Double.isNaN(response) && !Double.isInfinite(response)) {
                        points.add(new DosePointDto(counter, response, false));
                    }
                } catch (Exception e) {
                    // Skip points that fail to calculate
                }
            }

            prevDose = dose;
        }

        return points;
    }

    /**
     * Get model counts for Best Models Pie Chart.
     * Returns a map of model names to their counts across all genes in the category analysis.
     *
     * @param projectId the project identifier
     * @param categoryResultName the name of the category result
     * @return map of model names to counts
     */
    public Map<String, Integer> getModelCounts(String projectId, String categoryResultName) {
        CategoryAnalysisResults categoryResults = findCategoryResult(projectId, categoryResultName);
        Map<String, Integer> modelCounts = new HashMap<>();
        Set<ProbeStatResult> processedProbes = new HashSet<>();

        if (categoryResults.getCategoryAnalsyisResults() == null) {
            return modelCounts;
        }

        for (CategoryAnalysisResult result : categoryResults.getCategoryAnalsyisResults()) {
            if (result.getReferenceGeneProbeStatResults() == null) {
                continue;
            }

            for (ReferenceGeneProbeStatResult rgps : result.getReferenceGeneProbeStatResults()) {
                if (rgps.getProbeStatResults() == null) {
                    continue;
                }

                for (ProbeStatResult psr : rgps.getProbeStatResults()) {
                    // Use ProbeStatResult object for uniqueness (same as desktop app)
                    if (processedProbes.contains(psr)) {
                        continue;
                    }

                    processedProbes.add(psr);

                    // Get the best model
                    var bestStatResult = psr.getBestStatResult();
                    if (bestStatResult != null) {
                        String modelName = bestStatResult.toString();
                        modelCounts.put(modelName, modelCounts.getOrDefault(modelName, 0) + 1);
                    }
                }
            }
        }

        return modelCounts;
    }

    /**
     * Calculate Venn diagram overlaps for 2-5 category analysis results.
     * Compares category descriptions (pathway names) across multiple datasets.
     *
     * @param projectId the project identifier
     * @param categoryResultNames list of 2-5 category result names to compare
     * @return VennDiagramDataDto with overlap counts and items
     * @throws IllegalArgumentException if the project or results are not found, or if count is not 2-5
     */
    public VennDiagramDataDto getVennDiagramData(String projectId, List<String> categoryResultNames) {
        if (categoryResultNames == null || categoryResultNames.size() < 2 || categoryResultNames.size() > 5) {
            throw new IllegalArgumentException("Venn diagram requires 2-5 category analysis results");
        }

        // Get all category results
        List<CategoryAnalysisResults> allResults = new ArrayList<>();
        for (String name : categoryResultNames) {
            allResults.add(findCategoryResult(projectId, name));
        }

        // Extract category descriptions from each result
        List<Set<String>> datasets = new ArrayList<>();
        List<String> setNames = new ArrayList<>();

        for (CategoryAnalysisResults results : allResults) {
            Set<String> categories = new HashSet<>();
            if (results.getCategoryAnalsyisResults() != null) {
                for (CategoryAnalysisResult result : results.getCategoryAnalsyisResults()) {
                    String categoryDesc = result.getCategoryDescription();
                    if (categoryDesc != null && !categoryDesc.isEmpty()) {
                        categories.add(categoryDesc);
                    }
                }
            }
            datasets.add(categories);
            setNames.add(results.getName());
        }

        // Calculate overlaps using binary encoding (like BMDExpress-3)
        Map<String, Integer> itemToSets = new HashMap<>();

        // Assign bit values: A=1, B=2, C=4, D=8, E=16
        int[] bitValues = {1, 2, 4, 8, 16};

        // Mark which sets each item belongs to
        for (int i = 0; i < datasets.size(); i++) {
            for (String item : datasets.get(i)) {
                itemToSets.put(item, itemToSets.getOrDefault(item, 0) + bitValues[i]);
            }
        }

        // Count overlaps (index by combined bit value)
        int maxCombinations = (int) Math.pow(2, datasets.size());
        int[] overlapCounts = new int[maxCombinations];
        Map<Integer, List<String>> overlapItemLists = new HashMap<>();

        for (int i = 0; i < maxCombinations; i++) {
            overlapItemLists.put(i, new ArrayList<>());
        }

        for (Map.Entry<String, Integer> entry : itemToSets.entrySet()) {
            int combinedValue = entry.getValue();
            overlapCounts[combinedValue]++;
            overlapItemLists.get(combinedValue).add(entry.getKey());
        }

        // Convert to maps for DTO
        Map<String, Integer> overlaps = new HashMap<>();
        Map<String, List<String>> overlapItems = new HashMap<>();

        for (int i = 1; i < maxCombinations; i++) {
            if (overlapCounts[i] > 0) {
                // Generate key like "A", "B", "A,B", "A,B,C", etc.
                String key = generateSetKey(i, datasets.size());
                overlaps.put(key, overlapCounts[i]);
                overlapItems.put(key, overlapItemLists.get(i));
            }
        }

        return new VennDiagramDataDto(setNames, overlaps, overlapItems, datasets.size());
    }

    /**
     * Generate a set key from a bit-encoded value.
     * Examples: 1="A", 3="A,B", 7="A,B,C"
     */
    private String generateSetKey(int value, int setCount) {
        List<String> sets = new ArrayList<>();
        String[] labels = {"A", "B", "C", "D", "E"};

        for (int i = 0; i < setCount; i++) {
            if ((value & (1 << i)) != 0) {
                sets.add(labels[i]);
            }
        }

        return String.join(",", sets);
    }

    /**
     * Get analysis parameters (notes) from the AnalysisInfo for a category result.
     * These notes contain information about the analysis configuration, such as
     * min/max gene filters applied during the analysis.
     *
     * @param projectId the project identifier
     * @param categoryResultName the name of the category result
     * @return list of analysis parameter notes
     * @throws IllegalArgumentException if the project or result is not found
     */
    public List<String> getAnalysisParameters(String projectId, String categoryResultName) {
        CategoryAnalysisResults categoryResults = findCategoryResult(projectId, categoryResultName);

        if (categoryResults.getAnalysisInfo() == null) {
            return List.of();
        }

        List<String> notes = categoryResults.getAnalysisInfo().getNotes();
        if (notes == null) {
            return List.of();
        }

        return new ArrayList<>(notes);
    }
}
