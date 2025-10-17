package com.sciome.dto;

import java.util.List;
import java.util.Map;

/**
 * DTO for category analysis results formatted for table display
 */
public class CategoryAnalysisTableView {
    private String name;
    private List<String> columnHeader;
    private List<Map<String, Object>> categoryAnalsyisResults; // Keep typo for compatibility

    public CategoryAnalysisTableView() {
    }

    public CategoryAnalysisTableView(String name, List<String> columnHeader, List<Map<String, Object>> results) {
        this.name = name;
        this.columnHeader = columnHeader;
        this.categoryAnalsyisResults = results;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getColumnHeader() {
        return columnHeader;
    }

    public void setColumnHeader(List<String> columnHeader) {
        this.columnHeader = columnHeader;
    }

    public List<Map<String, Object>> getCategoryAnalsyisResults() {
        return categoryAnalsyisResults;
    }

    public void setCategoryAnalsyisResults(List<Map<String, Object>> categoryAnalsyisResults) {
        this.categoryAnalsyisResults = categoryAnalsyisResults;
    }
}
