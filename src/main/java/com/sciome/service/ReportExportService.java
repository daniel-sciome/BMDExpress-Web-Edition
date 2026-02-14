package com.sciome.service;

import com.sciome.dto.report.*;
import org.apache.poi.util.Units;
import org.apache.poi.xwpf.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportExportService {

    private static final Logger log = LoggerFactory.getLogger(ReportExportService.class);

    private final ReportStorageService storageService;

    public ReportExportService(ReportStorageService storageService) {
        this.storageService = storageService;
    }

    public byte[] exportToPdf(String reportId) throws Exception {
        ReportDto report = storageService.load(reportId);
        String xhtml = buildXhtml(report);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ITextRenderer renderer = new ITextRenderer();
        renderer.setDocumentFromString(xhtml);
        renderer.layout();
        renderer.createPDF(baos);

        log.info("PDF export generated for report: {}", reportId);
        return baos.toByteArray();
    }

    public byte[] exportToDocx(String reportId) throws Exception {
        ReportDto report = storageService.load(reportId);

        try (XWPFDocument doc = new XWPFDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            // Title
            XWPFParagraph titlePara = doc.createParagraph();
            titlePara.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = titlePara.createRun();
            titleRun.setText(report.getTitle());
            titleRun.setBold(true);
            titleRun.setFontSize(24);
            titleRun.addBreak();

            // Metadata
            XWPFParagraph metaPara = doc.createParagraph();
            metaPara.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun metaRun = metaPara.createRun();
            metaRun.setText("Project: " + report.getProjectId() + " | Template: " + report.getTemplateName());
            metaRun.setFontSize(10);
            metaRun.setColor("666666");
            metaRun.addBreak();

            // Sections
            List<ReportSectionDto> sortedSections = report.getSections().stream()
                    .sorted(Comparator.comparingInt(ReportSectionDto::getOrder))
                    .collect(Collectors.toList());

            // Build parent hierarchy for heading levels
            Set<String> parentIds = sortedSections.stream()
                    .map(ReportSectionDto::getParentId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            for (ReportSectionDto section : sortedSections) {
                int headingLevel = section.getParentId() == null ? 1 : 2;

                // Section heading
                XWPFParagraph heading = doc.createParagraph();
                heading.setStyle("Heading" + headingLevel);
                XWPFRun headingRun = heading.createRun();
                headingRun.setText(section.getTitle());
                headingRun.setBold(true);
                headingRun.setFontSize(headingLevel == 1 ? 18 : 14);

                // Section content (strip HTML for Word)
                if (section.getContent() != null && !section.getContent().isBlank()) {
                    String plainText = stripHtml(section.getContent());
                    String[] paragraphs = plainText.split("\n\n");
                    for (String para : paragraphs) {
                        if (!para.isBlank()) {
                            XWPFParagraph contentPara = doc.createParagraph();
                            XWPFRun contentRun = contentPara.createRun();
                            contentRun.setText(para.trim());
                            contentRun.setFontSize(11);
                        }
                    }
                }

                // Chart snapshots as images
                for (ChartSnapshotDto snapshot : section.getChartSnapshots()) {
                    try {
                        byte[] imageBytes = null;
                        // Try loading from disk first
                        try {
                            imageBytes = storageService.getSnapshotImage(reportId, snapshot.getId());
                        } catch (IOException ignored) {
                            // Fall back to base64 in the DTO
                            if (snapshot.getDataUrl() != null && snapshot.getDataUrl().startsWith("data:image")) {
                                String base64 = snapshot.getDataUrl().replaceFirst("^data:image/\\w+;base64,", "");
                                imageBytes = Base64.getDecoder().decode(base64);
                            }
                        }

                        if (imageBytes != null) {
                            XWPFParagraph imgPara = doc.createParagraph();
                            imgPara.setAlignment(ParagraphAlignment.CENTER);
                            XWPFRun imgRun = imgPara.createRun();
                            imgRun.addPicture(
                                    new ByteArrayInputStream(imageBytes),
                                    XWPFDocument.PICTURE_TYPE_PNG,
                                    snapshot.getTitle(),
                                    Units.toEMU(400),
                                    Units.toEMU(267)
                            );

                            // Caption
                            XWPFParagraph captionPara = doc.createParagraph();
                            captionPara.setAlignment(ParagraphAlignment.CENTER);
                            XWPFRun captionRun = captionPara.createRun();
                            captionRun.setText(snapshot.getTitle());
                            captionRun.setItalic(true);
                            captionRun.setFontSize(9);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to embed chart image: {}", snapshot.getId(), e);
                    }
                }
            }

            // Clinical data tables
            if (report.getClinicalDatasets() != null && !report.getClinicalDatasets().isEmpty()) {
                XWPFParagraph clinicalHeading = doc.createParagraph();
                clinicalHeading.setStyle("Heading1");
                XWPFRun clinRun = clinicalHeading.createRun();
                clinRun.setText("Appendix: Clinical Data");
                clinRun.setBold(true);
                clinRun.setFontSize(18);

                for (ClinicalDatasetDto dataset : report.getClinicalDatasets()) {
                    XWPFParagraph dsHeading = doc.createParagraph();
                    XWPFRun dsRun = dsHeading.createRun();
                    dsRun.setText(dataset.getName() + " (" + dataset.getSource() + ")");
                    dsRun.setBold(true);
                    dsRun.setFontSize(12);

                    if (dataset.getNarrativeSummary() != null && !dataset.getNarrativeSummary().isBlank()) {
                        XWPFParagraph narPara = doc.createParagraph();
                        XWPFRun narRun = narPara.createRun();
                        narRun.setText(dataset.getNarrativeSummary());
                        narRun.setFontSize(11);
                    }

                    if (dataset.getEndpoints() != null && !dataset.getEndpoints().isEmpty()) {
                        XWPFTable table = doc.createTable(dataset.getEndpoints().size() + 1, 7);
                        // Header
                        String[] headers = {"Category", "Endpoint", "Dose", "Sex", "Value", "Unit", "Significance"};
                        for (int i = 0; i < headers.length; i++) {
                            table.getRow(0).getCell(i).setText(headers[i]);
                        }
                        // Data rows
                        for (int r = 0; r < dataset.getEndpoints().size(); r++) {
                            ClinicalEndpointDto ep = dataset.getEndpoints().get(r);
                            XWPFTableRow row = table.getRow(r + 1);
                            row.getCell(0).setText(ep.getCategory() != null ? ep.getCategory() : "");
                            row.getCell(1).setText(ep.getEndpoint() != null ? ep.getEndpoint() : "");
                            row.getCell(2).setText(ep.getDose() != null ? ep.getDose() : "");
                            row.getCell(3).setText(ep.getSex() != null ? ep.getSex() : "");
                            row.getCell(4).setText(ep.getValue() != null ? String.valueOf(ep.getValue()) : "");
                            row.getCell(5).setText(ep.getUnit() != null ? ep.getUnit() : "");
                            row.getCell(6).setText(ep.getSignificance() != null ? ep.getSignificance() : "");
                        }
                    }
                }
            }

            doc.write(baos);
            log.info("DOCX export generated for report: {}", reportId);
            return baos.toByteArray();
        }
    }

    private String buildXhtml(ReportDto report) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" ");
        sb.append("\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n");
        sb.append("<html xmlns=\"http://www.w3.org/1999/xhtml\">\n<head>\n");
        sb.append("<style type=\"text/css\">\n");
        sb.append("body { font-family: serif; font-size: 11pt; line-height: 1.6; margin: 40px; }\n");
        sb.append("h1 { font-size: 20pt; text-align: center; margin-bottom: 10px; }\n");
        sb.append("h2 { font-size: 16pt; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }\n");
        sb.append("h3 { font-size: 13pt; margin-top: 16px; }\n");
        sb.append(".meta { text-align: center; color: #666; font-size: 9pt; margin-bottom: 30px; }\n");
        sb.append("table { width: 100%; border-collapse: collapse; margin: 10px 0; }\n");
        sb.append("th, td { border: 1px solid #999; padding: 4px 8px; font-size: 9pt; text-align: left; }\n");
        sb.append("th { background-color: #f0f0f0; font-weight: bold; }\n");
        sb.append("img { max-width: 100%; }\n");
        sb.append(".page-break { page-break-before: always; }\n");
        sb.append("</style>\n</head>\n<body>\n");

        // Title
        sb.append("<h1>").append(escapeXml(report.getTitle())).append("</h1>\n");
        sb.append("<div class=\"meta\">Project: ").append(escapeXml(report.getProjectId()));
        sb.append(" | Template: ").append(escapeXml(report.getTemplateName())).append("</div>\n");

        // Sections
        List<ReportSectionDto> sorted = report.getSections().stream()
                .sorted(Comparator.comparingInt(ReportSectionDto::getOrder))
                .collect(Collectors.toList());

        for (ReportSectionDto section : sorted) {
            String tag = section.getParentId() == null ? "h2" : "h3";
            sb.append("<").append(tag).append(">");
            sb.append(escapeXml(section.getTitle()));
            sb.append("</").append(tag).append(">\n");

            if (section.getContent() != null && !section.getContent().isBlank()) {
                // Content is already HTML, but we need to ensure it's valid XHTML
                String content = section.getContent()
                        .replaceAll("<br>", "<br/>")
                        .replaceAll("<hr>", "<hr/>");
                sb.append("<div>").append(content).append("</div>\n");
            }

            // Chart snapshots as inline base64 images
            for (ChartSnapshotDto snap : section.getChartSnapshots()) {
                if (snap.getDataUrl() != null) {
                    sb.append("<div style=\"text-align:center; margin:10px 0;\">\n");
                    sb.append("<img src=\"").append(snap.getDataUrl()).append("\" ");
                    sb.append("style=\"max-width:500px;\"/>\n");
                    sb.append("<div style=\"font-style:italic; font-size:9pt;\">");
                    sb.append(escapeXml(snap.getTitle())).append("</div>\n");
                    sb.append("</div>\n");
                }
            }
        }

        // Clinical data tables
        if (report.getClinicalDatasets() != null && !report.getClinicalDatasets().isEmpty()) {
            sb.append("<div class=\"page-break\"></div>\n");
            sb.append("<h2>Appendix: Clinical Data</h2>\n");
            for (ClinicalDatasetDto ds : report.getClinicalDatasets()) {
                sb.append("<h3>").append(escapeXml(ds.getName()));
                sb.append(" (").append(escapeXml(ds.getSource())).append(")</h3>\n");

                if (ds.getNarrativeSummary() != null) {
                    sb.append("<p>").append(escapeXml(ds.getNarrativeSummary())).append("</p>\n");
                }

                if (ds.getEndpoints() != null && !ds.getEndpoints().isEmpty()) {
                    sb.append("<table>\n<tr><th>Category</th><th>Endpoint</th><th>Dose</th>");
                    sb.append("<th>Sex</th><th>Value</th><th>Unit</th><th>Significance</th></tr>\n");
                    for (ClinicalEndpointDto ep : ds.getEndpoints()) {
                        sb.append("<tr>");
                        sb.append("<td>").append(escapeXml(ep.getCategory())).append("</td>");
                        sb.append("<td>").append(escapeXml(ep.getEndpoint())).append("</td>");
                        sb.append("<td>").append(escapeXml(ep.getDose())).append("</td>");
                        sb.append("<td>").append(escapeXml(ep.getSex())).append("</td>");
                        sb.append("<td>").append(ep.getValue() != null ? ep.getValue() : "").append("</td>");
                        sb.append("<td>").append(escapeXml(ep.getUnit())).append("</td>");
                        sb.append("<td>").append(escapeXml(ep.getSignificance())).append("</td>");
                        sb.append("</tr>\n");
                    }
                    sb.append("</table>\n");
                }
            }
        }

        sb.append("</body>\n</html>");
        return sb.toString();
    }

    private String stripHtml(String html) {
        return html.replaceAll("<[^>]+>", "")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&#39;", "'")
                .replaceAll("&quot;", "\"");
    }

    private String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
