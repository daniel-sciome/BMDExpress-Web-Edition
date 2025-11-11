# JavaFX Curve Overlay Visualization Implementation Analysis
## BMDExpress-3 Desktop Version

**Analysis Date:** 2025-11-11  
**Project:** BMDExpress-3 (JavaFX Desktop Application)  
**Scope:** Understanding the Pathway Curve Viewer and curve overlay implementation

---

## Executive Summary

The BMDExpress-3 desktop application uses **JFreeChart** to display curve overlay visualizations. The "Pathway Curve Viewer" allows users to:

1. Select a specific pathway (from Category Analysis results)
2. Choose which chemical/analysis datasets to include
3. Select specific genes within that pathway
4. Display multiple dose-response curves overlaid on a single chart

The curves are generated using statistical models (Hill, Power, Exponential, Polynomial) fitted to the data, with dose on the X-axis (log scale) and log(Expression) on the Y-axis.

---

## Architecture Overview

### Key Components

#### 1. **PathwayCurveViewer** (`PathwayCurveViewer.java`)
- **Location:** `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/`
- **Purpose:** Main UI component for the pathway curve visualization
- **Framework:** Extends `SciomeChartBase<Number, Number>` (JavaFX)
- **Key Responsibilities:**
  - Manages UI controls (TextFields, CheckComboBoxes)
  - Pathway selection with auto-complete
  - Category analysis results selection
  - Gene selection within pathway
  - Delegates chart rendering to `JFreeCurve`

#### 2. **JFreeCurve** (`JFreeCurve.java`)
- **Purpose:** Creates the actual chart using JFreeChart
- **Key Responsibilities:**
  - Creates XY line chart
  - Manages data series (one per gene/probe combination)
  - Handles log scale for dose axis
  - Adds annotations for BMD, BMDL, BMDU points
  - Configures colors and rendering

#### 3. **BMDoseModel** (`BMDoseModel.java`)
- **Purpose:** Encapsulates model parameters and calculations
- **Key Responsibilities:**
  - Stores curve parameters from statistical models
  - Calculates response values at given doses
  - Manages ANOVA estimates
  - Provides min/max dose and response ranges

---

## Data Flow and Structure

### Data Hierarchy

```
DoseResponseExperiment
├── Treatments (List<Treatment>)
│   └── dose (Float)
│   └── name (String)
└── ProbeResponses (List<ProbeResponse>)
    └── Probe
    └── Responses (List<Float>) - one per treatment

BMDResult
├── DoseResponseExperiment
├── ProbeStatResults (List<ProbeStatResult>)
│   ├── ProbeResponse
│   ├── BestStatResult
│   └── StatResults (List<StatResult>)

CategoryAnalysisResults
├── BMDResult
├── CategoryAnalysisRows (List<CategoryAnalysisResult>)
│   └── ReferenceGeneProbeStatResults
│       ├── ReferenceGene
│       └── ProbeStatResults (List<ProbeStatResult>)
```

### Curve Overlay Data Selection Flow

```
User selects Pathway
↓
PathwayCurveViewer fetches CategoryAnalysisResults containing pathway
↓
User selects Analyses (chemicals)
↓
PathwayCurveViewer filters genes in pathway x selected analyses
↓
User selects Genes
↓
PathwayCurveViewer creates Map<BMDResult, Set<ProbeStatResult>>
↓
JFreeCurve creates series for each entry
↓
For each ProbeStatResult:
  - Extracts best statistical model (Hill, Power, Exp, Poly)
  - Gets model parameters and dose values
  - Generates curve points
  - Creates XYSeries for chart
```

---

## Key Classes and Data Models

### 1. Treatment
**File:** `Treatment.java`
```
- name (String)       // e.g., "Control", "Low Dose", "High Dose"
- dose (Float)        // numeric dose value
```

### 2. ProbeResponse
**File:** `ProbeResponse.java`
```
- probe (Probe)           // probe identifier
- responses (List<Float>) // gene expression values
                          // one per treatment (dose)
```

### 3. DoseResponseExperiment
**File:** `DoseResponseExperiment.java`
```
- treatments (List<Treatment>)           // all dose levels
- probeResponses (List<ProbeResponse>)   // expression data
- doseGroups (List<DoseGroup>)          // grouped by dose
```

### 4. StatResult (Abstract Base Class)
**File:** `StatResult.java`

Subclasses:
- **HillResult** - Hill model
- **PowerResult** - Power model
- **ExponentialResult** - 4 exponential variants
- **PolyResult** - Polynomial model
- **GCurvePResult** - Special purpose
- **ModelAveragingResult** - Averaged parameters

**Key Fields:**
```
- BMD (double)                  // Benchmark Dose
- BMDL (double)                 // BMD Lower bound
- BMDU (double)                 // BMD Upper bound
- fitPValue (double)            // Model fit p-value
- fitLogLikelihood (double)     // Log likelihood
- AIC (double)                  // Akaike Information Criterion
- curveParameters (double[])    // Model-specific parameters
- rSquared (double)             // R-squared fit metric

// Abstract methods each model implements:
- getResponseAt(double dose)           // Calculate response at dose
- getResponseAt(double dose, double[] params)  // With custom params
- getFormulaText()               // Text representation
- getEquation()                  // Full equation
- getParametersNames()           // Parameter names
```

### 5. ProbeStatResult
**File:** `ProbeStatResult.java`
```
- probeResponse (ProbeResponse)   // Original response data
- bestStatResult (StatResult)     // Best fitted model
- statResults (List<StatResult>) // All models tried
```

### 6. ReferenceGeneProbeStatResult
**File:** `ReferenceGeneProbeStatResult.java`
```
- referenceGene (ReferenceGene)     // Gene info
- probeStatResults (List<ProbeStatResult>)  // All probes for gene
```

### 7. CategoryAnalysisResult (Abstract)
**File:** `CategoryAnalysisResult.java`

Key Method:
```java
public List<ReferenceGeneProbeStatResult> getReferenceGeneProbeStatResults()
```

---

## Model Implementations and Response Calculations

### Hill Model
**Class:** `HillResult.java`

**Formula:** `response = intercept + v * dose^n / (k^n + dose^n)`

**Parameters:**
- intercept (baseline response)
- v (amplitude)
- n (Hill coefficient - slope)
- k (k parameter)

**Implementation:**
```java
public double getResponseAt(double dose) {
    int base = 0;
    double theDose = dose;
    double nom = curveParameters[base + 1] * Math.pow(theDose, curveParameters[base + 2]);
    double denom = Math.pow(curveParameters[base + 3], curveParameters[base + 2])
            + Math.pow(theDose, curveParameters[base + 2]);
    return curveParameters[base] + nom / denom;
}
```

### Power Model
**Class:** `PowerResult.java`

**Formula:** `response = control + slope * dose^power`

**Parameters:**
- control (intercept)
- slope (coefficient)
- power (exponent)

**Implementation:**
```java
public double getResponseAt(double dose) {
    int base = 0;
    return curveParameters[base] + curveParameters[base + 1] 
           * Math.pow(dose, curveParameters[base + 2]);
}
```

### Exponential Models
**Class:** `ExponentialResult.java`

Four variants (option 2, 3, 4, 5):

**Option 2:** `response = a * exp(sign * b * dose)`
**Option 3:** `response = a * exp(sign * (b * dose)^d)`
**Option 4:** `response = a * (c - (c - 1) * exp(-b * dose))`
**Option 5:** `response = a * (c - (c - 1) * exp(-(b * dose)^d))`

### Polynomial Models
**Class:** `PolyResult.java`

**Formula:** `response = beta_0 + beta_1*dose + beta_2*dose^2 + ... + beta_n*dose^n`

**Dynamic degree:** Can be linear (degree 1) or higher

**Implementation:**
```java
public double getResponseAt(double dose) {
    return polyFunction(dose, degree);
}

private double polyFunction(double dose, int degree) {
    int base = 0;
    int start = base + 1;
    return curveParameters[base] + polyValue(dose, start, 1, degree);
}
```

---

## Chart Configuration and Rendering (JFreeCurve)

### Chart Setup

**Chart Type:** XY Line Chart
**Framework:** JFreeChart
**Viewer:** SciomeChartViewer (JavaFX-wrapped JFreeChart)

**Axes:**
- **Domain (X-axis):** Dose (Log10 scale)
- **Range (Y-axis):** Log(Expression) - linear scale

**Key Configuration:**

```java
XYSeriesCollection seriesSet = new XYSeriesCollection();
JFreeChart chart = ChartFactory.createXYLineChart(
    pathway,                    // Title
    "Dose",                    // Domain axis
    "Log(Expression)",         // Range axis
    seriesSet,
    PlotOrientation.VERTICAL,
    true,  // Include legend
    true,  // Include tooltips
    false  // No URLs
);

XYPlot plot = (XYPlot) chart.getPlot();
LogAxis logAxis = new CustomJFreeLogAxis();  // Log scale for dose
XYLineAndShapeRenderer renderer = new XYLineAndShapeRenderer();
```

### Series Creation

For each selected gene/probe combination (ProbeStatResult):

1. **Get dose values** from DoseResponseExperiment
2. **Create BMDoseModel** with:
   - Best statistical model (StatResult)
   - Probe information
   - ANOVA estimates
3. **Generate curve points** between unique doses
4. **Create XYSeries** from calculated points
5. **Add to seriesSet**

**Code from JFreeCurve.java:**
```java
for (BMDResult key : bmdResultToProbeStatResultMap.keySet())
    for (ProbeStatResult psr : bmdResultToProbeStatResultMap.get(key))
        seriesSet.addSeries(createModels(psr, key));
```

### Curve Point Generation

For each pair of consecutive doses, calculate interpolated points:

```java
List<Double> uniqueDoses = sorted unique doses
for (Double dose : uniqueDoses) {
    // Between previous dose and current dose
    double increment = (dose - prevDose) / 190.0;
    for (double counter = prevDose; counter < dose; counter += increment)
        modelSeries.add(counter, bmdModel.response(counter));
}
```

This creates smooth curves by sampling ~190 points between each dose interval.

### Annotations

Three marker points on each curve:

```java
// Green: BMD point
XYDrawableAnnotation ann = new XYDrawableAnnotation(
    bmdValue, 
    response(bmdValue), 
    15, 15,
    new ColorBlock(Color.GREEN, 15, 15)
);

// Red: BMDL point
XYDrawableAnnotation ann1 = new XYDrawableAnnotation(
    bmdlValue,
    response(bmdlValue),
    15, 15,
    new ColorBlock(Color.RED, 15, 15)
);

// Blue: BMDU point
XYDrawableAnnotation ann2 = new XYDrawableAnnotation(
    bmduValue,
    response(bmduValue),
    15, 15,
    new ColorBlock(Color.BLUE, 15, 15)
);
```

---

## Data Requirements for Web Implementation

### Essential Input Data

1. **DoseResponseExperiment:**
   - List of treatments (doses)
   - Expression values for each probe/gene

2. **ProbeStatResult:**
   - Probe ID
   - Best statistical model type (Hill/Power/Exp/Poly)
   - Model parameters (curveParameters array)
   - BMD, BMDL, BMDU values

3. **Gene Information:**
   - Gene symbol
   - Probe associations
   - Pathway membership

4. **Category Analysis Context:**
   - Pathway/category name
   - Filtered gene list
   - Associated chemical treatments

### Data Transfer Format

From the analysis files, the essential data structure for curve rendering:

```json
{
  "pathway": "Pathway Name",
  "analyses": [
    {
      "name": "Chemical A",
      "bmdResult": {
        "name": "Chemical A Results",
        "doseResponseExperiment": {
          "treatments": [
            {"dose": 0, "name": "Control"},
            {"dose": 10, "name": "10 mg/kg"}
          ]
        },
        "probeStatResults": [
          {
            "probeId": "PROBE_001",
            "bestStatResult": {
              "model": "Hill",
              "bmd": 5.5,
              "bmdl": 3.2,
              "bmdu": 9.8,
              "curveParameters": [1.2, 0.8, 2.1, 5.0]
            }
          }
        ]
      }
    }
  ]
}
```

---

## Key Observations for Web Implementation

### 1. **Log Dose Axis Handling**
- The desktop version uses logarithmic X-axis
- Special handling for zero doses (uses LogAxis with custom formatting)
- Doses below minimum are scaled logarithmically for visualization

### 2. **Model Parameter Storage**
- Each model type has different number of parameters
- Parameters are stored in fixed array: `curveParameters[]`
- Order matters for calculation accuracy

### 3. **Response Calculation Pattern**
- All models use `getResponseAt(double dose)` method
- Each model is responsible for its own formula
- Parameters extracted from array using base indices

### 4. **Curve Smoothness**
- Desktop version interpolates ~190 points per dose interval
- Creates visually smooth curves without storing raw data
- Could be optimized in web version (fewer points needed)

### 5. **Color Coding**
- Each curve: random color from palette
- BMD marker: Green
- BMDL marker: Red
- BMDU marker: Blue

### 6. **Legend and Labels**
- Series label format: `"[Analysis Name]: [Probe ID]"`
- Pathway name as chart title
- Clear axis labels (Dose, Log(Expression))

---

## Data Processing Workflow in Desktop App

### Step 1: PathwayCurveViewer Initialization
```
Load all pathways from CategoryAnalysisResults
↓
User enters pathway name (with auto-complete)
```

### Step 2: Analysis Selection
```
Find all CategoryAnalysisResults containing selected pathway
↓
Present as checkboxes (user selects chemicals/analyses)
```

### Step 3: Gene Selection
```
Filter genes:
  - In selected pathway
  - With filtered gene count > 0
  - In selected analyses
↓
Present as checkboxes
```

### Step 4: Chart Generation
```
For each selected gene:
  Find all ProbeStatResults in selected analyses
  │
  ├─ For each ProbeStatResult:
  │   Get ReferenceGeneProbeStatResult
  │   Get associated BMDResult
  │   Extract ProbeStatResult.bestStatResult
  │   Map: BMDResult -> Set<ProbeStatResult>
  │
  Create Map<BMDResult, Set<ProbeStatResult>>
  │
  Pass to JFreeCurve
  │
  JFreeCurve creates one XYSeries per ProbeStatResult
  │
  Add curves to chart
```

---

## Technical Considerations

### 1. **Model Type Determination**
The model type is determined by:
- `StatResult.getModel()` returns model name as string
- `StatResult.toString()` returns model class name
- Actual class type (Hill, Power, Exp, Poly, etc.)

### 2. **ANOVA Estimates**
The `BMDoseModel` uses ANOVA estimates for:
- Mean at each dose
- Confidence intervals
- Number of doses

Structure: `estimates[doseCount][columns]`
- Column 0: dose
- Column 1: weight
- Column 2: mean response
- Column n-2: lower CI
- Column n-1: upper CI

### 3. **Filter Application**
The PathwayCurveViewer applies DataFilterPack filters at multiple levels:
- Pathway filtering
- Gene filtering
- Result filtering

### 4. **Lazy Loading Optimization**
Charts are only created when data is selected, not preemptively.

---

## Files Location Reference

| Component | File Path |
|-----------|-----------|
| PathwayCurveViewer | `/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/PathwayCurveViewer.java` |
| JFreeCurve | `/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/JFreeCurve.java` |
| BMDoseModel | `/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/BMDoseModel.java` |
| DoseResponseExperiment | `/src/main/java/com/sciome/bmdexpress2/mvp/model/DoseResponseExperiment.java` |
| BMDResult | `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/BMDResult.java` |
| ProbeStatResult | `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/ProbeStatResult.java` |
| StatResult | `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/StatResult.java` |
| HillResult | `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/HillResult.java` |
| PowerResult | `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/PowerResult.java` |
| ExponentialResult | `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/ExponentialResult.java` |
| PolyResult | `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/PolyResult.java` |
| CategoryAnalysisResult | `/src/main/java/com/sciome/bmdexpress2/mvp/model/category/CategoryAnalysisResult.java` |
| ReferenceGeneProbeStatResult | `/src/main/java/com/sciome/bmdexpress2/mvp/model/category/ReferenceGeneProbeStatResult.java` |

---

## Implementation Checklist for Web Version

- [ ] Create data service to fetch analysis and gene data
- [ ] Implement pathway selector component
- [ ] Implement analysis/chemical multi-select
- [ ] Implement gene multi-select with filtering
- [ ] Create statistical model response calculator (Hill, Power, Exp, Poly)
- [ ] Create chart renderer with log scale support
- [ ] Implement curve interpolation algorithm
- [ ] Add BMD/BMDL/BMDU marker annotations
- [ ] Handle dose=0 on log scale
- [ ] Create series color assignment
- [ ] Add legend with series labels
- [ ] Add tooltips with dose/response values
- [ ] Test with various model types
- [ ] Validate against desktop visualization

---

**End of Analysis Document**
