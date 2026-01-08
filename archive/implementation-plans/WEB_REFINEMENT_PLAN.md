# BMDExpress Web Refinement Plan

## Overview
This document outlines the adjustments needed to align the BMDExpress web application's tables and charts with the desktop JavaFX application.

---

## PART 1: Category Results Table

### Current State (Web)
- **10 columns total**: Category ID, Description, Genes, %, Fisher P-Value, BMD Mean, BMDL Mean, BMDU Mean, BMD Median, All Genes

### Desktop State
- **120+ columns** dynamically displayed based on data availability

### Adjustments Needed

#### Priority 1 - Essential Columns (Add immediately)
1. **Fisher's A, B, C, D Parameters** - Currently in DTO but not displayed
2. **BMDL Median** - Missing from table
3. **BMDU Median** - Missing from table
4. **BMD Minimum** - Missing from table
5. **BMD SD** - Missing from table
6. **BMDL/BMDU Minimum & SD** - Missing from table
7. **Input Genes Count** - Need to add to DTO (geneCountSignificantANOVA exists but not the same)
8. **Fisher's Left & Right P-Values** - In DTO but not displayed

#### Priority 2 - Important Statistical Columns (Add for full parity)
9. **Weighted Statistics** - bmdWMean, bmdWSD, bmdlWMean, etc. (need to add to DTO)
10. **Percentile Values** - 5th/10th percentile BMD, BMDL, BMDU (need to add to DTO)
11. **Gene Lists** - Entrez IDs, Gene Symbols, Probe IDs (need to add to DTO)
12. **Adverse Direction Stats** - Up/Down/Conflict counts (need to add to DTO)
13. **Fold Change Statistics** - Min/Max/Mean/Median (need to add to DTO)
14. **95% Confidence Intervals** - BMD/BMDL/BMDU bounds (need to add to DTO)

#### Priority 3 - Advanced Columns (Optional for future)
15. **Model Counts** - Distribution of BMDS models used
16. **IVIVE Dose Conversions** - If IVIVE analysis present
17. **Z-Score Statistics** - Min/Max/Mean/Median

---

## PART 2: Chart Data Accuracy

### Chart-by-Chart Comparison

| Chart | Desktop Data Fields | Web Current Fields | Status | Action Needed |
|-------|-------------------|-------------------|--------|---------------|
| **BMD vs P-Value Scatter** | X: bmdMean, Y: -log10(fishersTwoTail) | X: bmdMean, Y: negLog10P (calculated) | ✅ **CORRECT** | None |
| **Bubble Chart** | X: bmdMedian, Y: -log10(fishersTwoTail), Size: percentage | X: bmdMedian, Y: negLog10P, Size: percentage | ✅ **CORRECT** | None |
| **Box Plot** | BMD/BMDL/BMDU Mean values | BMD/BMDL/BMDU Mean values | ✅ **CORRECT** | None |
| **Range Plot** | BMDL Median, BMD Median, BMDU Median | BMDL Median, BMD Median, BMDU Median | ✅ **CORRECT** | None |
| **Bar Charts (6)** | BMD/BMDL/BMDU Mean & Median | BMD/BMDL/BMDU Mean & Median | ✅ **CORRECT** | None |
| **Accumulation Charts (6)** | BMD/BMDL/BMDU Mean & Median | BMD/BMDL/BMDU Mean & Median | ✅ **CORRECT** | None |
| **Best Models Pie** | Model statistics from StatResult | Model statistics from backend | ✅ **CORRECT** | None |
| **UMAP Scatter** | GO term UMAP embeddings with selection | GO term UMAP embeddings with brush select | ✅ **CORRECT** | None |
| **Venn Diagram** | Category Description overlap | Category Description overlap | ✅ **CORRECT** | None |
| **Curve Overlay** | Dose-response curves with BMD markers | Dose-response curves with BMD markers | ✅ **CORRECT** | None |

**✅ All charts are using the correct data fields!**

---

## PART 3: Missing Chart Types

**Desktop has these chart types that web doesn't:**

### 1. Mean Histograms (5 variants)
- BMD Mean Histogram
- BMDL Mean Histogram
- BMDU Mean Histogram
- BMD 5th Percentile Histogram
- BMD 10th Percentile Histogram

### 2. Median Histograms (3 variants)
- BMD Median Histogram
- BMDL Median Histogram
- BMDU Median Histogram

### 3. BMD vs BMDL Scatter Plots (4 variants)
- BMD Median vs BMDL Median
- BMD Mean vs BMDL Mean
- BMDU Mean vs BMD Mean
- BMDU Mean vs BMDL Mean

### 4. Violin Plot Per Category
- Shows BMD distribution for each individual category
- Requires BMD List data (semicolon-separated values)

### 5. Global Violin Plot
- Shows overall BMD Median distribution across all categories

---

## IMPLEMENTATION PLAN

### Phase 1: Table Column Expansion (Estimated: 2-3 hours)

#### Step 1.1: Extend DTO (1 hour)
**File:** `src/main/java/com/sciome/dto/CategoryAnalysisResultDto.java`

Add fields:
```java
// Weighted statistics
private Double bmdWMean;
private Double bmdWSD;
private Double bmdlWMean;
private Double bmdlWSD;
private Double bmduWMean;
private Double bmduWSD;

// Percentile values
private Double bmdFifthPercentileTotalGenes;
private Double bmdTenthPercentileTotalGenes;
private Double bmdlFifthPercentileTotalGenes;
private Double bmdlTenthPercentileTotalGenes;
private Double bmduFifthPercentileTotalGenes;
private Double bmduTenthPercentileTotalGenes;

// Gene lists
private String geneSymbols;  // comma-separated
private String probeIds;     // comma-separated
private String entrezGeneIds; // comma-separated

// Adverse direction
private Integer genesWithAdverseDirectionUp;
private Integer genesWithAdverseDirectionDown;
private Integer genesWithConflict;

// Fold change statistics
private Double meanFoldChange;
private Double minFoldChange;
private Double maxFoldChange;
private Double medianFoldChange;
private Double sdFoldChange;

// 95% Confidence intervals
private Double bmdLower95;
private Double bmdUpper95;
private Double bmdlLower95;
private Double bmdlUpper95;
private Double bmduLower95;
private Double bmduUpper95;
```

#### Step 1.2: Update DTO Converter (30 min)
**File:** `src/main/java/com/sciome/dto/CategoryAnalysisResultDto.java`

Update `fromDesktopObject()` method to map all new fields from `CategoryAnalysisResult`.

#### Step 1.3: Add Columns to Table (1 hour)
**File:** `src/main/frontend/components/CategoryResultsGrid.tsx`

Add column groups for better organization:
- Gene Counts group
- Fisher's Test group (A, B, C, D, Left, Right, Two-Tail)
- BMD Statistics group (Mean/Median/Min/SD/Weighted)
- BMDL Statistics group (Mean/Median/Min/SD/Weighted)
- BMDU Statistics group (Mean/Median/Min/SD/Weighted)
- Percentile group
- Fold Change group
- Adverse Direction group
- Confidence Intervals group

#### Step 1.4: Column Visibility Controls (30 min)
**File:** `src/main/frontend/components/CategoryResultsGrid.tsx`

Add column selector dropdown:
- Default view: Essential columns only (~15 columns)
- Standard view: Common statistical columns (~30 columns)
- Advanced view: All available columns (~50+ columns)
- Custom: User-selected columns

---

### Phase 2: Add Missing Chart Types (Estimated: 3-4 hours)

#### Step 2.1: Histogram Charts (1.5 hours)
**New file:** `src/main/frontend/components/charts/HistogramCharts.tsx`

Implements 8 histogram variants using Ant Design Column chart:
- BMD Mean Histogram
- BMDL Mean Histogram
- BMDU Mean Histogram
- BMD Median Histogram
- BMDL Median Histogram
- BMDU Median Histogram
- BMD 5th Percentile Histogram
- BMD 10th Percentile Histogram

Groups into tabs: Mean Histograms, Median Histograms, Percentile Histograms

#### Step 2.2: BMD vs BMDL Scatter Plots (1 hour)
**New file:** `src/main/frontend/components/charts/BMDvsBMDLScatter.tsx`

4 scatter plot variants with dropdown selector:
- BMD Median vs BMDL Median
- BMD Mean vs BMDL Mean
- BMDU Mean vs BMD Mean
- BMDU Mean vs BMDL Mean

#### Step 2.3: Violin Plots (1.5 hours)
**New files:**
- `src/main/frontend/components/charts/ViolinPlotPerCategory.tsx`
- `src/main/frontend/components/charts/GlobalViolinPlot.tsx`

Requirements:
- Need to add BMD List data to DTO (semicolon-separated string)
- Use @ant-design/charts Violin or custom D3 implementation
- Per-category: Shows distribution for individual categories
- Global: Shows overall BMD Median distribution

---

### Phase 3: Enhanced Table Features (Estimated: 1-2 hours)

#### Step 3.1: Column Formatting (30 min)
**File:** `src/main/frontend/components/CategoryResultsGrid.tsx`

- Scientific notation for very small p-values (< 0.001)
- Consistent decimal places across similar columns
- Color coding for significance thresholds (p < 0.05, p < 0.01, p < 0.001)
- Highlight minimum/maximum values in columns

#### Step 3.2: Expandable Rows (1 hour)
**File:** `src/main/frontend/components/CategoryResultsGrid.tsx`

- Click row to expand gene lists
- Show probe IDs, gene symbols, Entrez IDs in expandable section
- Display model counts breakdown
- Show individual gene BMD values

#### Step 3.3: Export Functionality (30 min)
**File:** `src/main/frontend/components/CategoryResultsGrid.tsx`

- Export visible columns to CSV
- Export all columns to Excel
- Copy selected rows to clipboard
- Download filtered data

---

## PRIORITY RECOMMENDATIONS

### High Priority (Do First)
1. ✅ Charts are already correct - **No action needed**
2. **Add missing table columns** (Fisher's A/B/C/D, BMDL Median, BMDU Median, SD values)
3. **Add column visibility controls** (Essential/Standard/Advanced/Custom views)

### Medium Priority (Nice to Have)
4. **Add histogram charts** (very common in desktop usage)
5. **Add BMD vs BMDL scatter plots**
6. **Add weighted statistics and percentiles** to DTO and table

### Low Priority (Future Enhancement)
7. **Add violin plots** (requires BMD List data - significant data transfer)
8. **Add adverse direction statistics**
9. **Add fold change and z-score statistics**
10. **Add IVIVE columns** (if IVIVE analysis present)

---

## SUMMARY OF KEY FINDINGS

### ✅ Good News
- All current charts are using the **correct data fields**
- Core functionality (scatter, box, range, bar, accumulation) is accurate
- Data transformations (neg log10 p-value) are correct
- Chart visualizations match desktop behavior

### ⚠️ Gaps Identified
- **Table** is showing only ~10% of available columns
- **Missing chart types**: Histograms, BMD vs BMDL scatter, Violin plots
- **DTO is incomplete**: Missing ~80% of fields from desktop CategoryAnalysisResult

### 🎯 Recommended Immediate Actions
1. Expand table columns to show Fisher's parameters, medians, SD values
2. Add column visibility toggle (Essential/Standard/Advanced)
3. Implement histogram charts (most commonly used after current charts)
4. Add BMD vs BMDL scatter plots

---

## DESKTOP APP REFERENCE

### Key Source Files (BMDExpress-3 Desktop)
- **Model Definition:** `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/category/CategoryAnalysisResult.java`
- **Column Headers:** `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/category/CategoryAnalysisResults.java`
- **Visualizations:** `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/view/visualization/CategoryAnalysisDataVisualizationView.java`
- **Table View:** `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/view/mainstage/dataview/CategoryAnalysisDataView.java`

### Desktop Table Column Order (120+ columns)
See detailed list in exploration results - includes all gene counts, Fisher's test parameters, BMD/BMDL/BMDU statistics (Mean/Median/Min/SD/Weighted), percentiles, gene lists, adverse direction stats, fold change stats, confidence intervals, model counts, IVIVE conversions, and z-scores.

---

## NOTES

- This plan focuses on **data accuracy and parity** with the desktop application
- Chart implementations are already correct and require no changes
- Table expansion is the primary work needed
- New chart types (histograms, scatter variants, violin) are optional enhancements
- All changes maintain backward compatibility with existing data

---

**Document Created:** 2025-10-21
**Desktop App Version:** BMDExpress-3
**Web App Location:** `/home/svobodadl/bmdexpress-web`
