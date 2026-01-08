# Pathway Curve Viewer - Implementation Guide for Web Application

## Overview

This directory contains comprehensive documentation and code snippets for implementing the Curve Overlay / Pathway Curve Viewer feature in the BMDExpress-3 web application.

The Pathway Curve Viewer is a sophisticated dose-response visualization tool that:
- Allows users to explore dose-response relationships at the pathway level
- Combines multiple chemical analyses for side-by-side comparison
- Displays fitted statistical models as smooth curves with confidence bounds
- Uses logarithmic scale for dose and linear scale for log-transformed expression

## Documents in This Package

### 1. PATHWAY_CURVE_VIEWER_ANALYSIS.md (27KB, 826 lines)
**Comprehensive technical analysis of the PathwayCurveViewer implementation**

Contents:
- PathwayCurveViewer class overview and constructor parameters
- Complete user interaction flow (4-step process)
- Full data structure hierarchy with relationships
- Detailed documentation of 9 key Java classes with field listings and methods:
  - CategoryAnalysisResults
  - CategoryAnalysisResult
  - ReferenceGeneProbeStatResult
  - ProbeStatResult
  - ProbeResponse
  - StatResult (abstract base)
  - BMDResult
  - DoseResponseExperiment
  - Treatment
- JFreeCurve visualization class details
- Chart axes configuration (logarithmic dose, linear response)
- Benchmark dose marker system (BMD, BMDL, BMDU)
- Color scheme and legend information
- Data flow diagram from UI selection to rendered chart
- Curve fitting model explanation (BMDoseModel)
- Filtering and selection logic
- Multi-chemical comparison capabilities
- Data access quick reference table
- Implementation notes for web developers
- Example web API pseudo-code

### 2. PATHWAY_CURVE_VIEWER_CODE_SNIPPETS.md (15KB, 490 lines)
**Ready-to-use code examples from BMDExpress-3**

Contents:
- 10 essential Java code snippets:
  1. Extracting available pathways from data
  2. Getting categories (chemicals) for a pathway
  3. Extracting genes from a pathway
  4. Building chart data (ProbeStatResults)
  5. Creating chart data series with interpolation
  6. Getting dose values
  7. Accessing response/expression values
  8. Configuring chart axes
  9. Handling zero dose special case
  10. Data validation before display
- Data model hierarchy visualization
- Key Java enums and constants
- Common operations with TypeScript/JavaScript equivalents
- Marker display examples

## Quick Start for Implementation

### Step 1: Understand the Data Model
Read the **Data Structure Hierarchy** section (Section 3) in PATHWAY_CURVE_VIEWER_ANALYSIS.md to understand how data flows from:
```
CategoryAnalysisResults → Pathways → Genes → Probes → Statistical Models
```

### Step 2: Review the User Flow
Look at Section 2 (User Interaction Flow) to understand the 4-step process:
1. User selects pathway
2. User selects category/chemical
3. User selects genes
4. Chart is rendered

### Step 3: Implement Data Access Layer
Use the code snippets to implement these key methods:
1. `getAvailablePathways()` - Section 1 in CODE_SNIPPETS
2. `getChemicalsForPathway()` - Section 2 in CODE_SNIPPETS
3. `getGenesForPathway()` - Section 3 in CODE_SNIPPETS
4. `getChartData()` - Section 4 in CODE_SNIPPETS

### Step 4: Implement Chart Rendering
Use the code snippets for:
1. Creating fitted curves with interpolation - Section 5
2. Adding BMD/BMDL/BMDU markers - Also Section 5
3. Configuring axes - Section 8
4. Handling special cases - Section 9

### Step 5: Add Data Validation
Implement validation checks from Section 10 in CODE_SNIPPETS

## Key Concepts

### Dose-Response Relationship
- X-axis: **Dose** (logarithmic scale) - treatment/exposure level
- Y-axis: **Response** (linear scale, log-transformed) - gene expression change
- Each curve shows predicted expression across all dose levels for one probe

### Benchmark Dose (BMD)
- **BMD**: The dose estimated to produce a predefined response (benchmark response, typically 10% change)
- **BMDL**: Lower confidence bound on BMD
- **BMDU**: Upper confidence bound on BMD
- Displayed as colored boxes on the chart: GREEN (BMD), RED (BMDL), BLUE (BMDU)

### Fitted Models
Supported statistical models for curve fitting:
- Hill model - S-shaped dose-response
- Polynomial (Power, Linear, Quadratic, Cubic, etc.)
- Power model
- Exponential model
- G-CurveP model
- Model averaging

### Multi-Chemical Comparison
Multiple chemicals can be displayed simultaneously:
- Each chemical gets a unique color (RED, BLUE, BLACK, GREEN cycle)
- Each chemical can have multiple genes shown
- Each gene can have multiple probes
- Total curves = chemicals × genes × probes per gene

## Data Requirements

To display a curve, you need:
1. **Pathway name** - Category description from CategoryAnalysisResult
2. **Dose values** - Array of treatment doses from DoseResponseExperiment.treatments
3. **Fitted statistical model** - StatResult with curve parameters
4. **BMD values** - BMD, BMDL, BMDU from the fitted model
5. **Gene/Probe identification** - For legend and labeling

Typical data structure size:
- 100-300 pathways per analysis
- 1-100 genes per pathway
- 1-10 probes per gene
- 3-10 dose levels
- 50-500+ curves on single chart (manageable with proper rendering)

## Performance Considerations

1. **Curve Interpolation**: 190 points per dose interval
   - 5 dose levels = ~950 chart points per curve
   - 100 curves = ~95,000 chart points total
   - Use WebGL or canvas for large datasets

2. **Data Loading**: Load pathway list on init, genes/chart data on demand

3. **Caching**: Cache computed curves to avoid recalculation on zoom/pan

4. **Validation**: Filter out invalid data (NaN, infinite values, null models)

## Implementation Checklist

- [ ] Parse CategoryAnalysisResults JSON from backend
- [ ] Implement pathway autocomplete with "contains"/"begins with" search
- [ ] Implement chemistry/experiment multi-select
- [ ] Implement gene multi-select (update when pathways/chemicals change)
- [ ] Extract dose values from DoseResponseExperiment
- [ ] Calculate 190 interpolation points for each curve
- [ ] Implement StatResult.getResponseAt(dose) for each model type
- [ ] Render curves with logarithmic x-axis
- [ ] Add BMD/BMDL/BMDU markers at calculated positions
- [ ] Add legend with chemical:probe names
- [ ] Implement hover/tooltip showing values
- [ ] Add data validation and error handling
- [ ] Handle zero dose special case (map to decade below minimum)
- [ ] Test with multiple chemicals on same chart
- [ ] Optimize rendering for large datasets

## File Locations (BMDExpress-3)

Key source files referenced:
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/PathwayCurveViewer.java` - Main UI class
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/JFreeCurve.java` - Chart rendering
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/BMDoseModel.java` - Curve calculation
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/category/` - Data model classes

## Integration Points

### Backend API Requirements
The backend service should provide:
1. `GET /api/pathways?analysisIds=[]` - Available pathways
2. `GET /api/chemicals?pathway=X` - Chemicals containing pathway X
3. `GET /api/genes?pathway=X&chemicals=[]` - Genes in pathway for selected chemicals
4. `POST /api/chart-data` - Chart data with curves and markers

### Data Format Example
```json
{
  "title": "Apoptosis Pathway",
  "series": [
    {
      "name": "Chemical A: Probe_001 : TP53",
      "color": "#FF0000",
      "points": [
        {"x": 0.1, "y": 2.3},
        {"x": 0.15, "y": 2.4}
      ],
      "markers": [
        {
          "type": "BMD",
          "x": 0.45,
          "y": 3.2,
          "color": "green"
        }
      ]
    }
  ],
  "xAxis": {
    "label": "Dose",
    "type": "logarithmic",
    "min": 0.1,
    "max": 100
  },
  "yAxis": {
    "label": "Log(Expression)",
    "type": "linear"
  }
}
```

## Related Features

- **Category Results View** - Tabular display of category analysis results
- **Gene Expression Heatmap** - Expression changes across dose levels
- **Statistical Model Selector** - Choose between fitted models
- **Data Filtering** - Filter pathways/genes by p-value, fold change, etc.

## Questions & Clarifications

For any questions about the implementation:
1. Refer to PATHWAY_CURVE_VIEWER_ANALYSIS.md Section 3 for data structure details
2. Check PATHWAY_CURVE_VIEWER_CODE_SNIPPETS.md for specific code patterns
3. Review the source files in BMDExpress-3 for the original Java implementation

---

**Generated**: October 19, 2025
**Source**: BMDExpress-3 Analysis
**Target**: BMDExpress Web Application

