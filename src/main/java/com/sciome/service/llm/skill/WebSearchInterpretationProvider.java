package com.sciome.service.llm.skill;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * PubMed E-utilities implementation of InterpretationProvider.
 * Uses NCBI esearch + efetch (free for moderate use, no API key required).
 */
@Component
public class WebSearchInterpretationProvider implements InterpretationProvider {

    private static final Logger log = LoggerFactory.getLogger(WebSearchInterpretationProvider.class);
    private static final String ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
    private static final String EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
    private static final int MAX_RESULTS = 5;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String getName() {
        return "pubmed_web_search";
    }

    @Override
    public String interpretPathway(String pathwayName, String pathwayId,
                                    String species, String organ, String testArticle,
                                    List<String> geneSymbols) {
        try {
            // Build a targeted PubMed query
            StringBuilder query = new StringBuilder();
            query.append("\"").append(pathwayName).append("\"");
            if (testArticle != null && !testArticle.isEmpty()) {
                query.append(" AND \"").append(testArticle).append("\"");
            }
            if (organ != null && !organ.isEmpty()) {
                query.append(" AND ").append(organ);
            }
            query.append(" AND toxicology");

            return executePubMedSearch(query.toString());

        } catch (Exception e) {
            log.warn("Pathway interpretation failed for '{}': {}", pathwayName, e.getMessage());
            return "Literature search unavailable: " + e.getMessage();
        }
    }

    @Override
    public String searchLiterature(String queryContext, String testArticle, String organ) {
        try {
            StringBuilder query = new StringBuilder();
            if (testArticle != null && !testArticle.isEmpty()) {
                query.append("\"").append(testArticle).append("\"");
            }
            if (organ != null && !organ.isEmpty()) {
                if (query.length() > 0) query.append(" AND ");
                query.append(organ);
            }
            if (queryContext != null && !queryContext.isEmpty()) {
                if (query.length() > 0) query.append(" AND ");
                query.append(queryContext);
            }
            query.append(" AND toxicogenomics");

            return executePubMedSearch(query.toString());

        } catch (Exception e) {
            log.warn("Literature search failed: {}", e.getMessage());
            return "Literature search unavailable: " + e.getMessage();
        }
    }

    private String executePubMedSearch(String query) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);

            // Step 1: esearch to get PMIDs
            String searchUrl = ESEARCH_URL + "?db=pubmed&retmax=" + MAX_RESULTS
                    + "&sort=relevance&term=" + encodedQuery;
            String searchXml = restTemplate.getForObject(searchUrl, String.class);

            List<String> pmids = extractPmids(searchXml);
            if (pmids.isEmpty()) {
                return "No PubMed results found for: " + query;
            }

            // Step 2: efetch to get article summaries
            String ids = String.join(",", pmids);
            String fetchUrl = EFETCH_URL + "?db=pubmed&rettype=abstract&retmode=xml&id=" + ids;
            String fetchXml = restTemplate.getForObject(fetchUrl, String.class);

            return formatArticleSummaries(fetchXml, query);

        } catch (Exception e) {
            log.error("PubMed search failed for query '{}': {}", query, e.getMessage());
            return "PubMed search error: " + e.getMessage();
        }
    }

    private List<String> extractPmids(String xml) {
        List<String> pmids = new ArrayList<>();
        try {
            Document doc = DocumentBuilderFactory.newInstance()
                    .newDocumentBuilder()
                    .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));

            NodeList idNodes = doc.getElementsByTagName("Id");
            for (int i = 0; i < idNodes.getLength(); i++) {
                pmids.add(idNodes.item(i).getTextContent().trim());
            }
        } catch (Exception e) {
            log.warn("Failed to parse esearch XML: {}", e.getMessage());
        }
        return pmids;
    }

    private String formatArticleSummaries(String xml, String query) {
        StringBuilder sb = new StringBuilder();
        sb.append("PubMed results for: ").append(query).append("\n\n");

        try {
            Document doc = DocumentBuilderFactory.newInstance()
                    .newDocumentBuilder()
                    .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));

            NodeList articles = doc.getElementsByTagName("PubmedArticle");
            for (int i = 0; i < articles.getLength(); i++) {
                var article = articles.item(i);

                // Extract title
                NodeList titles = ((org.w3c.dom.Element) article).getElementsByTagName("ArticleTitle");
                String title = titles.getLength() > 0 ? titles.item(0).getTextContent() : "No title";

                // Extract PMID
                NodeList pmids = ((org.w3c.dom.Element) article).getElementsByTagName("PMID");
                String pmid = pmids.getLength() > 0 ? pmids.item(0).getTextContent() : "";

                // Extract abstract (first 300 chars)
                NodeList abstracts = ((org.w3c.dom.Element) article).getElementsByTagName("AbstractText");
                String abstractText = "";
                if (abstracts.getLength() > 0) {
                    abstractText = abstracts.item(0).getTextContent();
                    if (abstractText.length() > 300) {
                        abstractText = abstractText.substring(0, 300) + "...";
                    }
                }

                sb.append(i + 1).append(". ").append(title);
                if (!pmid.isEmpty()) {
                    sb.append(" (PMID: ").append(pmid).append(")");
                }
                sb.append("\n");
                if (!abstractText.isEmpty()) {
                    sb.append("   ").append(abstractText).append("\n");
                }
                sb.append("\n");
            }

            if (articles.getLength() == 0) {
                sb.append("No articles found.\n");
            }

        } catch (Exception e) {
            sb.append("Failed to parse article data: ").append(e.getMessage()).append("\n");
        }

        return sb.toString().trim();
    }
}
