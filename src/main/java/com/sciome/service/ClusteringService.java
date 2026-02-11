package com.sciome.service;

import com.sciome.analysis.clustering.CategoryClusteringService;
import com.sciome.analysis.clustering.CategoryClusteringService.ClusteringInputItem;
import com.sciome.analysis.clustering.CategoryClusteringService.ClusteringResult;
import com.sciome.analysis.clustering.CategoryClusteringService.LinkageMethod;
import com.sciome.dto.ClusteringInputItemDto;
import com.sciome.dto.ClusteringResultDto;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service for performing hierarchical clustering on category analysis results.
 * Exposes clustering functionality to the browser via Hilla BrowserCallable.
 *
 * <p>IMPLEMENTATION STATUS: INCOMPLETE</p>
 *
 * <p>This service depends on {@code CategoryClusteringService} which has NOT been implemented yet.
 * The application will fail at runtime when clustering is attempted.</p>
 *
 * <h3>TODO: Implement CategoryClusteringService</h3>
 * <p>Create {@code src/main/java/com/sciome/analysis/clustering/CategoryClusteringService.java} with:</p>
 * <ul>
 *   <li>Calculate Jaccard distance matrix between categories based on gene overlap</li>
 *   <li>Perform agglomerative hierarchical clustering with linkage methods (average, complete, single, ward)</li>
 *   <li>Cut dendrogram at specified number of clusters or auto-calculate optimal cut</li>
 *   <li>Return cluster assignments, leaf ordering, and linkage matrix for visualization</li>
 * </ul>
 *
 * <h3>Inner Classes Required:</h3>
 * <ul>
 *   <li>{@code ClusteringInputItem} - Input data with categoryId, genes (up/down/all)</li>
 *   <li>{@code ClusteringResult} - Output with clusterAssignments[], leavesOrder[], linkageMatrix[][]</li>
 *   <li>{@code LinkageMethod} - Enum: AVERAGE, COMPLETE, SINGLE, WARD</li>
 * </ul>
 *
 * <h3>Suggested Libraries:</h3>
 * <ul>
 *   <li>Smile (Statistical Machine Intelligence and Learning Engine) - has hierarchical clustering</li>
 *   <li>Apache Commons Math - has clustering algorithms</li>
 *   <li>Custom implementation using standard agglomerative algorithm</li>
 * </ul>
 *
 * <h3>Frontend Integration:</h3>
 * <p>The frontend hook {@code useGeneClusteringData.ts} is ready and calls this service.
 * DTOs are already generated: ClusteringInputItemDto, ClusteringResultDto.</p>
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class ClusteringService {

    private static final Logger logger = LoggerFactory.getLogger(ClusteringService.class);

    private final CategoryClusteringService clusteringService;

    public ClusteringService() {
        this.clusteringService = new CategoryClusteringService();
    }

    /**
     * Perform hierarchical clustering on category items.
     *
     * @param items list of category items with gene information
     * @param linkageMethod linkage method: "average", "complete", "single", or "ward"
     * @param numClusters number of clusters to create (0 = auto-calculate)
     * @return clustering result with cluster assignments and dendrogram data
     */
    public ClusteringResultDto performClustering(
            List<ClusteringInputItemDto> items,
            String linkageMethod,
            int numClusters) {

        logger.info("Performing clustering on {} items with method={}, numClusters={}",
                items != null ? items.size() : 0, linkageMethod, numClusters);

        // Convert DTOs to service input items
        List<ClusteringInputItem> inputItems = new ArrayList<>();
        if (items != null) {
            for (ClusteringInputItemDto dto : items) {
                ClusteringInputItem item = new ClusteringInputItem(
                        dto.getCategoryId(),
                        dto.getCategoryTitle(),
                        dto.getClusterBMD(),
                        dto.getGenesUp(),
                        dto.getGenesDown(),
                        dto.getAllGenes()
                );
                inputItems.add(item);
            }
        }

        // Parse linkage method
        LinkageMethod method = parseLinkageMethod(linkageMethod);

        // Perform clustering
        ClusteringResult result = clusteringService.performClustering(inputItems, method, numClusters);

        // Convert result to DTO
        return convertToDto(result);
    }

    /**
     * Parse linkage method string to enum.
     */
    private LinkageMethod parseLinkageMethod(String methodStr) {
        if (methodStr == null || methodStr.isEmpty()) {
            return LinkageMethod.AVERAGE;
        }

        switch (methodStr.toLowerCase()) {
            case "complete":
                return LinkageMethod.COMPLETE;
            case "single":
                return LinkageMethod.SINGLE;
            case "ward":
                return LinkageMethod.WARD;
            case "average":
            default:
                return LinkageMethod.AVERAGE;
        }
    }

    /**
     * Convert ClusteringResult to ClusteringResultDto.
     */
    private ClusteringResultDto convertToDto(ClusteringResult result) {
        ClusteringResultDto dto = new ClusteringResultDto();

        dto.setClusterAssignments(result.getClusterAssignments());
        dto.setLeavesOrder(result.getLeavesOrder());
        dto.setOrderedLabels(result.getOrderedLabels());
        dto.setOrderedClusters(result.getOrderedClusters());
        dto.setError(result.getError());

        // Convert double[][] linkage matrix to List<List<Double>> for JSON serialization
        if (result.getLinkageMatrix() != null) {
            List<List<Double>> linkageList = new ArrayList<>();
            for (double[] row : result.getLinkageMatrix()) {
                List<Double> rowList = new ArrayList<>();
                for (double value : row) {
                    rowList.add(value);
                }
                linkageList.add(rowList);
            }
            dto.setLinkageMatrix(linkageList);
        }

        return dto;
    }
}
