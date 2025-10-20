package com.sciome.service;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResult;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResults;
import com.sciome.bmdexpress2.mvp.model.category.ReferenceGeneProbeStatResult;
import com.sciome.bmdexpress2.mvp.model.stat.BMDResult;
import com.sciome.bmdexpress2.mvp.model.stat.ProbeStatResult;
import com.sciome.dto.AnalysisAnnotationDto;
import com.sciome.dto.BMDMarkersDto;
import com.sciome.dto.CategoryAnalysisResultDto;
import com.sciome.dto.CurveDataDto;
import com.sciome.dto.DosePointDto;
import com.sciome.dto.PathwayInfoDto;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
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

    private final ProjectService projectService;
    private final AnalysisNameParser analysisNameParser;

    @Autowired
    public CategoryResultsService(ProjectService projectService, AnalysisNameParser analysisNameParser) {
        this.projectService = projectService;
        this.analysisNameParser = analysisNameParser;
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
     * @return list of category analysis result DTOs
     * @throws IllegalArgumentException if the project or result is not found
     */
    public List<CategoryAnalysisResultDto> getCategoryResults(String projectId, String categoryResultName) {
        // Use package-private helper to get the desktop app object
        CategoryAnalysisResults categoryResults = findCategoryResult(projectId, categoryResultName);

        if (categoryResults.getCategoryAnalsyisResults() == null) {
            return List.of();
        }

        // Convert desktop app objects to DTOs for Hilla
        return categoryResults.getCategoryAnalsyisResults().stream()
                .map(CategoryAnalysisResultDto::fromDesktopObject)
                .collect(Collectors.toList());
    }

    /**
     * Get parsed annotation metadata for a category analysis result.
     *
     * @param projectId the project identifier
     * @param categoryResultName the name of the category result
     * @return AnalysisAnnotationDto with parsed metadata
     * @throws IllegalArgumentException if the project or result is not found
     */
    public AnalysisAnnotationDto getCategoryResultAnnotation(String projectId, String categoryResultName) {
        // Verify the result exists (will throw if not found)
        findCategoryResult(projectId, categoryResultName);

        // Parse the name into structured metadata
        return analysisNameParser.parse(categoryResultName);
    }

    /**
     * Get parsed annotation metadata for all category analysis results in a project.
     *
     * @param projectId the project identifier
     * @return list of AnalysisAnnotationDto objects
     * @throws IllegalArgumentException if the project is not found
     */
    public List<AnalysisAnnotationDto> getAllCategoryResultAnnotations(String projectId) {
        List<String> resultNames = getCategoryResultNames(projectId);
        return analysisNameParser.parseAll(resultNames);
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
        Set<String> processedProbes = new HashSet<>();

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
                    // Use probe ID to avoid counting the same probe multiple times
                    String probeId = psr.getProbeResponse() != null ?
                        psr.getProbeResponse().getProbe().getId() : null;

                    if (probeId == null || processedProbes.contains(probeId)) {
                        continue;
                    }

                    processedProbes.add(probeId);

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
}
