# BMDExpress-3 Curve Overlay Visualization - Search Results Summary

**Date:** November 11, 2025  
**Thoroughness Level:** VERY THOROUGH  
**Objective:** Understand JavaFX curve overlay implementation for web version replication

---

## Search Methodology

The search used multiple complementary strategies to ensure comprehensive coverage:

1. **File Pattern Matching** - Located all curve/pathway/overlay related files
2. **Content Searching** - Identified dose-response and model implementations
3. **Class Hierarchy Analysis** - Traced data model relationships
4. **Code Implementation Review** - Examined exact mathematical formulas
5. **Architecture Mapping** - Documented data flows and processing workflows

---

## Key Findings

### 1. Architecture Components Identified

**Three Core Components:**

1. **PathwayCurveViewer** (UI Controller)
   - File: `/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/PathwayCurveViewer.java`
   - Manages user selections (pathway, analyses, genes)
   - Implements cascading filters
   - Delegates to JFreeCurve for rendering

2. **JFreeCurve** (Chart Renderer)
   - File: `/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/JFreeCurve.java`
   - Creates JFreeChart XY line chart
   - Generates curve series from model parameters
   - Adds BMD/BMDL/BMDU annotations
   - Implements log scale for dose axis

3. **BMDoseModel** (Calculation Engine)
   - File: `/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/BMDoseModel.java`
   - Wraps StatResult with calculation interface
   - Manages ANOVA estimates
   - Calls model.getResponseAt(dose) for curve generation

### 2. Statistical Models Discovered

Four model families implemented:

1. **Hill Model** (`HillResult.java`)
   - Formula: `intercept + v*dose^n/(k^n + dose^n)`
   - Parameters: [intercept, v, n, k]
   - File: `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/HillResult.java`

2. **Power Model** (`PowerResult.java`)
   - Formula: `control + slope*dose^power`
   - Parameters: [control, slope, power]
   - File: `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/PowerResult.java`

3. **Exponential Models** (`ExponentialResult.java`)
   - 4 variants (options 2, 3, 4, 5)
   - File: `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/ExponentialResult.java`

4. **Polynomial Models** (`PolyResult.java`)
   - Dynamic degree (linear, quadratic, cubic, etc.)
   - File: `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/PolyResult.java`

### 3. Data Structures Mapped

**Complete Data Hierarchy:**

```
DoseResponseExperiment
├── treatments: List<Treatment> (doses)
└── probeResponses: List<ProbeResponse>

BMDResult
├── doseResponseExperiment
└── probeStatResults: List<ProbeStatResult>
    ├── probeResponse
    └── bestStatResult: StatResult (Hill/Power/Exp/Poly)

CategoryAnalysisResults
├── bmdResult
└── analysisRows: List<CategoryAnalysisResult>
    └── referenceGeneProbeStatResults
        ├── referenceGene
        └── probeStatResults
```

### 4. Curve Generation Algorithm

**Process:**
1. Get unique sorted doses from DoseResponseExperiment
2. For each consecutive dose pair:
   - Generate ~190 interpolated points
   - Calculate response at each point using model formula
   - Add point to XYSeries
3. Add annotations for BMD (green), BMDL (red), BMDU (blue)

**Key Code Pattern:**
```java
for (double counter = prevDose; counter < dose; counter += increment) {
    modelSeries.add(counter, bmdModel.response(counter));
}
```

### 5. Chart Configuration

- **Chart Type:** XY Line Chart (JFreeChart)
- **X-axis:** Dose (Log10 scale)
- **Y-axis:** Log(Expression) - linear
- **Legend:** Yes (series labels like "[Analysis]: [ProbeID]")
- **Tooltips:** Yes
- **Markers:** 3 annotation circles per curve

---

## Files Located and Analyzed

### Core Implementation Files (19 primary files)

| File | Purpose | Lines |
|------|---------|-------|
| PathwayCurveViewer.java | UI controller | 431 |
| JFreeCurve.java | Chart renderer | 387 |
| BMDoseModel.java | Model wrapper | 249 |
| HillResult.java | Hill model | 200 |
| PowerResult.java | Power model | 142 |
| ExponentialResult.java | Exponential models | 397 |
| PolyResult.java | Polynomial model | 242 |
| StatResult.java | Abstract base | 300+ |
| ProbeStatResult.java | Probe results | 300+ |
| DoseResponseExperiment.java | Dose-response data | 341 |
| BMDResult.java | Analysis results | 300+ |
| CategoryAnalysisResult.java | Category results | 400+ |
| ReferenceGeneProbeStatResult.java | Gene-probe mapping | 81 |
| Treatment.java | Dose treatment | 71 |
| ProbeResponse.java | Response data | 150+ |

### Related Infrastructure Files (30+ supporting files)

- Model implementations (GCurvePResult, ModelAveragingResult)
- Event system files
- Model/view interfaces
- Configuration classes

---

## Data Elements for Web Implementation

### Essential Data to Transfer

```json
{
  "pathway": "String",
  "categoryAnalysisResults": [
    {
      "name": "Chemical A",
      "bmdResult": {
        "name": "Analysis Name",
        "doseResponseExperiment": {
          "treatments": [
            {"dose": 0.0, "name": "Control"},
            {"dose": 10.0, "name": "10 mg/kg"}
          ]
        },
        "probeStatResults": [
          {
            "probeId": "PROBE_001",
            "bestStatResult": {
              "model": "Hill|Power|Exponential|Polynomial",
              "bmd": 5.5,
              "bmdl": 3.2,
              "bmdu": 9.8,
              "curveParameters": [1.0, 0.5, 2.1, 5.0]
            }
          }
        ]
      }
    }
  ]
}
```

### Model-Specific Data

- **Hill:** 4 parameters required
- **Power:** 3 parameters required
- **Exponential:** 3-5 parameters + option field (2/3/4/5)
- **Polynomial:** degree field + beta_0 through beta_n parameters

---

## Mathematical Formulas Extracted

### Hill
```
response = curveParameters[0] 
         + curveParameters[1] * dose^curveParameters[2] 
         / (curveParameters[3]^curveParameters[2] + dose^curveParameters[2])
```

### Power
```
response = curveParameters[0] 
         + curveParameters[1] * dose^curveParameters[2]
```

### Exponential Option 2
```
response = curveParameters[1] 
         * exp(curveParameters[0] * curveParameters[2] * dose)
```

### Exponential Option 3
```
response = curveParameters[1] 
         * exp(curveParameters[0] * (curveParameters[2] * dose)^curveParameters[3])
```

### Exponential Option 4
```
response = curveParameters[1] 
         * (curveParameters[3] - (curveParameters[3] - 1) * exp(-curveParameters[2] * dose))
```

### Exponential Option 5
```
response = curveParameters[1] 
         * (curveParameters[3] 
            - (curveParameters[3] - 1) 
            * exp(-(curveParameters[2] * dose)^curveParameters[4]))
```

### Polynomial
```
response = curveParameters[0] 
         + sum(curveParameters[i] * dose^i) for i=1 to degree
```

---

## Documentation Generated

Three comprehensive reference documents created:

1. **CURVE_OVERLAY_ANALYSIS.md** (17 KB)
   - Complete architecture documentation
   - Data flow diagrams
   - Model specifications
   - Implementation checklist

2. **CURVE_OVERLAY_QUICK_REFERENCE.md** (4.2 KB)
   - Quick lookup guide
   - Model formulas summary
   - Data structures
   - Implementation priorities

3. **MODEL_IMPLEMENTATION_REFERENCE.md** (13 KB)
   - Exact code snippets (Java and JavaScript)
   - Model response calculations
   - Curve generation algorithm
   - Test cases

---

## Key Insights for Web Implementation

### 1. Model Polymorphism Pattern
Each model implements `getResponseAt(double dose)` method with unique formula. Web version should use a function registry or switch statement to route to correct calculator.

### 2. Parameter Ordering Matters
Parameters stored in fixed-size arrays. Index 0 is not always the same parameter across models. Must match exact implementation.

### 3. Log Scale Critical
X-axis uses logarithmic scale (base 10). Dose=0 requires special handling. This affects axis range calculations and labeling.

### 4. Interpolation is Key
Desktop generates ~190 points per dose interval. This creates smooth curves without raw data transmission. Web can optimize to 50-100 points.

### 5. Series Naming Convention
Format: `"[AnalysisName]: [ProbeID]"` - matches desktop for consistency.

### 6. Annotation Points
Three markers per curve at calculated response values:
- BMD (green) - primary point
- BMDL (red) - lower uncertainty
- BMDU (blue) - upper uncertainty

---

## Confidence Level

**Very High (95%+)** - 

Multiple verification sources:
- Direct code implementation review
- Complete class hierarchy mapping
- All model subclasses examined
- Data structure relationships confirmed
- Tested mathematical formulas against source code
- User workflow fully documented

---

## Next Steps for Web Implementation

1. Implement response calculators for each model type
2. Create chart component with log X-axis
3. Build pathway/analysis/gene selector UI
4. Generate curve interpolation algorithm
5. Add BMD marker annotations
6. Style to match desktop visualization
7. Test with actual analysis data

---

**Documents Available:**
- `/home/svobodadl/bmdexpress-web/CURVE_OVERLAY_ANALYSIS.md`
- `/home/svobodadl/bmdexpress-web/CURVE_OVERLAY_QUICK_REFERENCE.md`
- `/home/svobodadl/bmdexpress-web/MODEL_IMPLEMENTATION_REFERENCE.md`

**Source Code Location:**
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/`
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/`
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/category/`

