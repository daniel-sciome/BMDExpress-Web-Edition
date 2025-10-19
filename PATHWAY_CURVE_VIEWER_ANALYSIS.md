# Curve Overlay / PathwayCurveViewer Implementation Analysis
## BMDExpress-3 Architecture & Data Structures

---

## 1. PathwayCurveViewer Class Overview

### File Location
- **Main Implementation**: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/PathwayCurveViewer.java`
- **Related Classes**: 
  - `JFreeCurve.java` - Chart rendering and curve fitting
  - `BMDoseModel.java` - Mathematical model for dose-response calculations

### Class Hierarchy
```
PathwayCurveViewer extends SciomeChartBase<Number, Number>
```

### Constructor Input Parameters
```java
public PathwayCurveViewer(
    List<BMDExpressAnalysisDataSet> categoryAnalysisResults,
    DataFilterPack filterPack, 
    SciomeChartListener chartListener
)
```

**Parameters Explained:**
- `categoryAnalysisResults`: List of BMDExpress analysis datasets containing category analysis results (multiple chemicals can be compared)
- `filterPack`: Optional data filter to filter rows based on user criteria
- `chartListener`: Callback for chart interaction events

### Key Instance Variables
```java
private List<String> pathways;                                    // Available pathway names
private CheckComboBox<CategoryAnalysisResults> categoryAnalysisResultsCombo;  // Chemical/analysis selection
private CheckComboBox<String> geneCombo;                         // Gene selection dropdown
private List<BMDExpressAnalysisDataSet> categoryAnalysisResults;  // Input data
private JFreeCurve jfreeCurve;                                   // Chart renderer
private DataFilterPack filterPack;                               // Optional filter
private VBox vBox;                                               // UI container
```

---

## 2. User Interaction Flow

### Step 1: Pathway Selection
- User types pathway name in auto-complete text field
- Pathways are extracted from `CategoryAnalysisResult.getCategoryDescription()`
- Support for "begins with" or "contains" search modes

### Step 2: Category Analysis Results Selection
- User selects one or more `CategoryAnalysisResults` (represents different chemicals/experiments)
- Triggers `setUpCategoryAnalysisComboListener()` which filters available genes

### Step 3: Gene Selection
- User selects one or more genes from the pathway
- Genes come from `ReferenceGeneProbeStatResult.getReferenceGene().getGeneSymbol()`
- Triggers `setUpGeneComboListener()` which builds the curve visualization

### Step 4: Curve Display
- Method `getBMDResultsForCurveView()` creates a `Map<BMDResult, Set<ProbeStatResult>>`
- New `JFreeCurve` is instantiated with this data
- Chart is rendered and displayed in the VBox

---

## 3. Data Structure Hierarchy

```
CategoryAnalysisResults (container)
├── Name: String
├── CategoryAnalysisResult[] (one per pathway/GO term)
│   ├── CategoryDescription: String (pathway/GO name)
│   ├── GenesThatPassedAllFilters: Integer
│   ├── ReferenceGeneProbeStatResult[]
│   │   ├── ReferenceGene
│   │   │   ├── GeneSymbol: String
│   │   │   └── Id: String
│   │   └── ProbeStatResult[]
│   │       ├── ProbeResponse
│   │       │   └── Probe
│   │       │       └── Id: String (probe ID)
│   │       └── BestStatResult (StatResult)
│   │           ├── BMD: double
│   │           ├── BMDL: double
│   │           ├── BMDU: double
│   │           ├── CurveParameters: double[]
│   │           └── FitPValue: double
│   └── BMDResult (link to statistical analysis)
│       ├── ProbeStatResult[]
│       └── DoseResponseExperiment
│           └── Treatment[]
│               ├── Name: String
│               └── Dose: Float
```

---

## 4. Key Data Classes

### 4.1 CategoryAnalysisResults
**File**: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/category/CategoryAnalysisResults.java`

**Purpose**: Container for category analysis results (e.g., GO analysis, pathway analysis)

**Key Fields**:
```java
private String name;                              // Name of the analysis (e.g., chemical name)
private List<CategoryAnalysisResult> categoryAnalsyisResults;  // Results per category
private BMDResult bmdResult;                      // Reference to BMD statistical analysis
private AnalysisInfo analysisInfo;                // Metadata about the analysis

// Constants for chartable fields
public static final String BMD_MEAN = "BMD Mean";
public static final String BMD_MEDIAN = "BMD Median";
// ... many more statistical summaries
```

**Key Methods**:
```java
public BMDResult getBmdResult()                           // Get associated statistical analysis
public List<CategoryAnalysisResult> getCategoryAnalsyisResults()  // Get results for each category
public String getName()                                  // Get analysis name
```

---

### 4.2 CategoryAnalysisResult
**File**: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/category/CategoryAnalysisResult.java`

**Purpose**: Single category result (pathway/GO term/gene set)

**Key Fields**:
```java
private List<ReferenceGeneProbeStatResult> referenceGeneProbeStatResults;
private Integer genesThatPassedAllFilters;
private String categoryDescription;  // Via getCategoryDescription() - the pathway/GO name

// BMD statistics for the category
private Double bmdMean;
private Double bmdMedian;
private Double bmdMinimum;
private Double bmdSD;
// ... BMDL and BMDU equivalents
```

**Key Methods**:
```java
public List<ReferenceGeneProbeStatResult> getReferenceGeneProbeStatResults()
public String getCategoryDescription()        // Pathway/GO term name
public Integer getGenesThatPassedAllFilters()
```

---

### 4.3 ReferenceGeneProbeStatResult
**File**: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/category/ReferenceGeneProbeStatResult.java`

**Purpose**: Links a reference gene to its statistical results across all probes/treatments

**Key Fields**:
```java
private ReferenceGene referenceGene;              // Gene info (symbol, ID)
private List<ProbeStatResult> probeStatResults;   // Statistical results for all probes of this gene
private Double conflictMinCorrelation;
private AdverseDirectionEnum adverseDirection;    // UP, DOWN, or CONFLICT
```

**Key Methods**:
```java
public ReferenceGene getReferenceGene()                    // Get gene info
public List<ProbeStatResult> getProbeStatResults()         // Get all probe results
```

---

### 4.4 ProbeStatResult
**File**: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/ProbeStatResult.java`

**Purpose**: Statistical analysis results for a single probe

**Key Fields**:
```java
private ProbeResponse probeResponse;         // Dose-response data for this probe
private StatResult bestStatResult;           // Best fitting statistical model
private List<StatResult> statResults;        // All candidate statistical models

// Convenience cached values
private transient String genes;              // Gene symbol(s)
private transient String geneSymbols;        // Gene symbol(s)
```

**Key Methods**:
```java
public ProbeResponse getProbeResponse()       // Get probe response data
public StatResult getBestStatResult()         // Get best fitting model
public Double getBestBMD()                    // Get BMD from best model
public Double getBestBMDL()                   // Get BMDL from best model
public Double getBestBMDU()                   // Get BMDU from best model
public Double getBestFitPValue()              // Get p-value of fit
```

**Data Returned by Best Model**:
```
BMD: Benchmark Dose (dose at which response reaches BMR - usually 10% or 20%)
BMDL: Lower confidence limit on BMD
BMDU: Upper confidence limit on BMD
FitPValue: Statistical fit p-value (lower is better)
CurveParameters: Parameters for the fitted model equation (Hill, Poly, Power, etc.)
```

---

### 4.5 ProbeResponse
**File**: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/probe/ProbeResponse.java`

**Purpose**: Expression/response measurements at each dose level for a probe

**Key Fields**:
```java
private Probe probe;                    // Probe identifier
private transient List<Float> responses;  // Response values (loaded from responsesBlob)
private transient float[] responseArray;   // Response array (cached for efficiency)
private byte[] responsesBlob;             // Serialized response data

// Parallel to Treatment list in DoseResponseExperiment
// responses[i] corresponds to treatments[i].dose
```

**Key Methods**:
```java
public Probe getProbe()                      // Get probe info
public List<Float> getResponses()            // Get response values
public float[] getResponseArray()            // Get response array (faster)
```

---

### 4.6 StatResult (Abstract Base Class)
**File**: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/StatResult.java`

**Purpose**: Base class for fitted curve models (Hill, Polynomial, Power, Exponential, etc.)

**Key Fields**:
```java
private double BMD;                    // Benchmark Dose
private double BMDL;                   // Lower confidence limit
private double BMDU;                   // Upper confidence limit
private double fitPValue;              // Statistical p-value
private double fitLogLikelihood;       // Log likelihood of fit
private double AIC;                    // Akaike Information Criterion
private short adverseDirection;        // Dose response direction (UP, DOWN)
private double[] curveParameters;      // Model-specific parameters
private double rSquared;               // R-squared of fit
private boolean isStepFunction;        // Whether this is a step function
private double zscore;                 // Z-score of the response
```

**Key Methods**:
```java
public double getBMD()
public double getBMDL()
public double getBMDU()
public double getFitPValue()
public double getAIC()
public double[] getCurveParameters()
public abstract double getResponseAt(double dose)  // Calculate response at a given dose
```

**Concrete Implementations**:
- `HillResult` - Hill dose-response model
- `PolyResult` - Polynomial models
- `PowerResult` - Power model
- `ExponentialResult` - Exponential model
- `GCurvePResult` - G-CurveP model
- `ModelAveragingResult` - Model averaging

---

### 4.7 BMDResult
**File**: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/BMDResult.java`

**Purpose**: Container for all BMD analysis results for a dataset

**Key Fields**:
```java
private String name;                           // Name (e.g., "Chemical X Analysis")
private List<ProbeStatResult> probeStatResults;  // Results for all probes
private DoseResponseExperiment doseResponseExperiment;  // Dose/treatment info
private PrefilterResults prefilterResults;     // Pre-filter analysis results
private List<Float> wAUCList;                  // Weighted Area Under Curve
```

**Key Methods**:
```java
public String getName()
public List<ProbeStatResult> getProbeStatResults()
public DoseResponseExperiment getDoseResponseExperiment()
```

---

### 4.8 DoseResponseExperiment
**File**: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/DoseResponseExperiment.java`

**Purpose**: Experimental design and dose-response matrix

**Key Fields**:
```java
private String name;
private List<Treatment> treatments;      // List of dose levels
private List<ProbeResponse> probeResponses;  // Response data for all probes
private List<ReferenceGeneAnnotation> referenceGeneAnnotations;  // Probe to gene mapping
private LogTransformationEnum logTransformation;  // How data was log-transformed (BASE2, BASE10, etc.)
```

**Key Methods**:
```java
public List<Treatment> getTreatments()        // Get dose levels
public List<ProbeResponse> getProbeResponses()  // Get all response data
```

---

### 4.9 Treatment
**File**: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/probe/Treatment.java`

**Purpose**: Dose level definition

**Key Fields**:
```java
private String name;        // Dose name (e.g., "0 mg/kg", "10 mg/kg")
private Float dose;         // Dose value (numeric)
```

**Key Methods**:
```java
public String getName()
public Float getDose()
```

---

## 5. Chart Visualization: JFreeCurve Class

### File Location
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/JFreeCurve.java`

### Constructor
```java
public JFreeCurve(
    ModelGraphicsEvent modelGraphicsEventListener,
    String pathway,
    Map<BMDResult, Set<ProbeStatResult>> bmdResultToProbeStatResultMap
)
```

### Chart Configuration
```java
// Chart setup
chart = ChartFactory.createXYLineChart(
    pathway,                    // Title
    "Dose",                     // X-axis label
    "Log(Expression)",          // Y-axis label (log response)
    seriesSet,                  // Data
    PlotOrientation.VERTICAL,
    true,                       // Include legend
    true,                       // Include tooltips
    false                       // No URLs
);

// Use LogAxis for dose (x-axis)
LogAxis logAxis = new CustomJFreeLogAxis();
plot.setDomainAxis(logAxis);
```

### What Gets Plotted

#### 1. **Fitted Curves** (per gene/probe)
Each `ProbeStatResult` creates one fitted curve:

```java
private XYSeries createModels(ProbeStatResult probeStatResult, BMDResult bmdResult)
{
    // Get doses from treatments
    double[] doses = getDoses(bmdResult);
    
    // Create BMD model from the best statistical result
    BMDoseModel bmdModel = new BMDoseModel(
        probeStatResult.getBestStatResult(),
        probeStatResult.getProbeResponse().getProbe()
    );
    
    // For each dose interval, calculate points on the fitted curve
    for (double counter = prevDose; counter < dose; counter += increment)
        modelSeries.add(counter, bmdModel.response(counter));
    
    // Legend entry: "ChemicalName: ProbeID"
    XYSeries modelSeries = new XYSeries(
        bmdResult.getName() + ": " + probeStatResult.toString()
    );
}
```

**Series Name Format**: `{ChemicalName}: {ProbeID} : {Genes} : {GeneSymbols}`

#### 2. **Benchmark Dose Markers** (per curve)
```java
// Green box at BMD point
XYDrawableAnnotation ann = new XYDrawableAnnotation(
    probeStatResult.getBestBMD().doubleValue(),
    bmdModel.response(probeStatResult.getBestBMD().doubleValue()),
    15, 15,
    new ColorBlock(Color.GREEN, 15, 15)
);

// Red box at BMDL point
XYDrawableAnnotation ann1 = new XYDrawableAnnotation(
    probeStatResult.getBestBMDL().doubleValue(),
    ...,
    new ColorBlock(Color.RED, 15, 15)
);

// Blue box at BMDU point
XYDrawableAnnotation ann2 = new XYDrawableAnnotation(
    probeStatResult.getBestBMDU().doubleValue(),
    ...,
    new ColorBlock(Color.BLUE, 15, 15)
);
```

### Axes Details

**X-Axis (Dose)**:
- Type: Logarithmic (base 10)
- Special handling for dose = 0 (maps to a small non-zero value like 0.1)
- Format: Scientific notation (e.g., 1E-2, 1E1, 1E4)
- Range: From lowest non-zero dose to highest dose * 1.1

**Y-Axis (Response)**:
- Type: Linear
- Label: "Log(Expression)" 
- Data: Log-transformed expression/response values
- Range: Auto-scaled with lower margin 0, upper margin 0.01

### Color Scheme
```java
chartColors[0] = Color.RED;       // First chemical
chartColors[1] = Color.BLUE;      // Second chemical
chartColors[2] = Color.BLACK;     // Third chemical
chartColors[3] = Color.GREEN;     // Fourth chemical
```

### Markers Color Legend
- **GREEN box**: BMD point (dose at standard response benchmark)
- **RED box**: BMDL point (lower confidence bound)
- **BLUE box**: BMDU point (upper confidence bound)

---

## 6. Data Flow: From UI Selection to Chart

### Flow Diagram
```
User selects pathway (TextInput)
    ↓
PathwayCurveViewer.pathwayAutoCompleteTextField.textProperty().addListener()
    ↓
getCatResultsThatContainPathways(pathway)
    → Returns CategoryAnalysisResults[] where any result has this pathway
    ↓
User selects CategoryAnalysisResults (CheckComboBox)
    ↓
setUpCategoryAnalysisComboListener()
    ↓
getGenesThatAreInPathwayAndCategoryResults(pathway, selectedResults)
    → Returns list of unique gene symbols in pathway for selected analyses
    ↓
User selects genes (CheckComboBox)
    ↓
setUpGeneComboListener()
    ↓
getBMDResultsForCurveView(pathway, selectedResults, selectedGenes)
    → Returns Map<BMDResult, Set<ProbeStatResult>>
    ↓
new JFreeCurve(null, pathway, bmdResultMap)
    → For each ProbeStatResult in each BMDResult:
        - Get best StatResult
        - Create fitted curve points via BMDoseModel.response(dose)
        - Add BMD/BMDL/BMDU marker annotations
    ↓
Chart displayed in VBox with legend
```

### Key Method: `getBMDResultsForCurveView()`

```java
private Map<BMDResult, Set<ProbeStatResult>> getBMDResultsForCurveView(
    String pathway,
    List<CategoryAnalysisResults> catResults,
    List<String> genes
)
{
    Map<BMDResult, Set<ProbeStatResult>> returnMap = new HashMap<>();
    
    for (BMDExpressAnalysisDataSet dataSet : categoryAnalysisResults)
    {
        for (BMDExpressAnalysisRow row : dataSet.getAnalysisRows())
        {
            if (row.getObject() instanceof CategoryAnalysisResult)
            {
                CategoryAnalysisResult result = (CategoryAnalysisResult) row.getObject();
                
                // Check if pathway matches
                if (!result.getCategoryDescription().equalsIgnoreCase(pathway))
                    continue;
                
                // Check if this result's parent is selected
                if (!catResults.contains(parentResult))
                    continue;
                
                // Get the BMDResult (statistical analysis)
                CategoryAnalysisResults results = ...; // Parent container
                BMDResult bmdResult = results.getBmdResult();
                
                // For each gene in the pathway
                for (ReferenceGeneProbeStatResult rgps : result.getReferenceGeneProbeStatResults())
                {
                    if (genes.contains(rgps.getReferenceGene().getGeneSymbol()))
                    {
                        // Add all probe results for this gene
                        returnMap.get(bmdResult).addAll(rgps.getProbeStatResults());
                    }
                }
            }
        }
    }
    
    return returnMap;
}
```

---

## 7. Curve Fitting Model: BMDoseModel Class

### File Location
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/BMDoseModel.java`

### Purpose
Wraps a `StatResult` (fitted model) and calculates response at any dose value

### Constructor
```java
public BMDoseModel(StatResult theStatResult, Probe probe)
{
    this.theStatResult = theStatResult;  // Fitted statistical model
    identifier = probe.getId();
}
```

### Key Methods

```java
// Set parameters (BMD, BMDL, BMDU, fitPValue, AIC, fitLogLikelihood + curve-specific params)
public void setParameters(double[] params)

// Set statistical estimates from OneWayAnova
public void setEstimates(double[][] estimates)
    // estimates[i] = [dose, count, mean, sd, ciLeft, ciRight]

// Get response at a given dose (calls theStatResult.getResponseAt(dose))
public double response(double dose)

// Get model info
public String getModel()       // Model name (e.g., "Hill", "Power")
public double minimumDose()
public double maximumDose()
public double minimumResponse()
public double maximumResponse()
public double bmd()
public double bmdl()
public double bmdu()
```

### Curve Calculation
```
For each dose interval [d1, d2]:
    Create 190 intermediate points between d1 and d2
    For each point, calculate:
        response = StatResult.getResponseAt(dose)
    Add (dose, response) to XYSeries
```

**Result**: Smooth continuous curve from lowest to highest dose

---

## 8. Key Filtering and Selection Logic

### Loading Available Pathways

```java
// From PathwayCurveViewer constructor
for (BMDExpressAnalysisDataSet results : categoryAnalysisResults)
{
    for (BMDExpressAnalysisRow result : results.getAnalysisRows())
    {
        if (filterPack == null || filterPack.passesFilter(result))
        {
            if (((CategoryAnalysisResult) result.getObject()).getGenesThatPassedAllFilters() > 0)
            {
                pathwaySet.add(
                    ((CategoryAnalysisResult) result.getObject()).getCategoryDescription()
                );
            }
        }
    }
}
```

**Only includes pathways that**:
1. Pass the optional filter
2. Have at least one gene that passed all filters

### Extracting Genes from a Pathway

```java
private List<String> getGenesThatAreInPathwayAndCategoryResults(
    String pathway,
    List<CategoryAnalysisResults> catResults
)
{
    Set<String> geneSet = new HashSet<>();
    
    for (BMDExpressAnalysisDataSet dataSet : categoryAnalysisResults)
    {
        for (BMDExpressAnalysisRow row : dataSet.getAnalysisRows())
        {
            CategoryAnalysisResult result = (CategoryAnalysisResult) row.getObject();
            
            if (!result.getCategoryDescription().equalsIgnoreCase(pathway))
                continue;
            
            // Collect unique gene symbols
            for (ReferenceGeneProbeStatResult rgps : result.getReferenceGeneProbeStatResults())
            {
                if (rgps.getReferenceGene() != null 
                    && rgps.getReferenceGene().getGeneSymbol() != null)
                {
                    geneSet.add(rgps.getReferenceGene().getGeneSymbol());
                }
            }
        }
    }
    
    return new ArrayList<>(geneSet);  // Returns sorted list
}
```

---

## 9. Multi-Chemical Comparison

### How Multiple Chemicals Are Displayed

1. **Input**: `List<BMDExpressAnalysisDataSet>` contains results from multiple chemicals
2. **User Selection**: `CheckComboBox<CategoryAnalysisResults>` allows selecting multiple
3. **Result**: All selected chemicals' curves are plotted on same chart
4. **Legend**: `{ChemicalName}: {ProbeID}` for each curve

### Example
If user selects:
- Pathway: "Apoptosis"
- Chemicals: "Chemical A", "Chemical B"
- Genes: "TP53", "BAX"

The chart will display curves for:
- Chemical A TP53
- Chemical A BAX
- Chemical B TP53
- Chemical B BAX

Each with its own color and legend entry.

---

## 10. Data Access Summary Table

| What You Want | Path Through Objects | Type |
|---|---|---|
| **Pathway/Category Name** | CategoryAnalysisResult.getCategoryDescription() | String |
| **Chemical Name** | CategoryAnalysisResults.getName() or BMDResult.getName() | String |
| **Gene Symbol** | ReferenceGeneProbeStatResult.getReferenceGene().getGeneSymbol() | String |
| **Probe ID** | ProbeResponse.getProbe().getId() | String |
| **Dose Values** | DoseResponseExperiment.getTreatments()[i].getDose() | Float[] |
| **Response Values** | ProbeResponse.getResponses() | List<Float> |
| **BMD Value** | StatResult.getBMD() or ProbeStatResult.getBestBMD() | double |
| **BMDL Value** | StatResult.getBMDL() or ProbeStatResult.getBestBMDL() | double |
| **BMDU Value** | StatResult.getBMDU() or ProbeStatResult.getBestBMDU() | double |
| **Curve Parameters** | StatResult.getCurveParameters() | double[] |
| **Model Type** | StatResult.toString() | String (Hill, Poly, etc.) |
| **Fit Quality** | StatResult.getFitPValue() or getAIC() | double |
| **Response at Dose** | StatResult.getResponseAt(dose) | double |
| **# Genes in Category** | CategoryAnalysisResult.getGenesThatPassedAllFilters() | Integer |

---

## 11. Implementation Notes for Web Application

### Key Considerations

1. **Lazy Loading**: Dose-response data is stored as serialized byte blobs, deserialized on first access

2. **Performance**: 
   - 190 interpolation points per dose interval (configurable)
   - Multiple curves can be expensive to render
   - Filter pathways to only those with genes passing filters

3. **Logging/Scales**:
   - X-axis is always logarithmic (dose is log-scaled)
   - Y-axis is linear but data is log(expression)
   - Special handling for zero dose: maps to decade below minimum dose

4. **Confidence Intervals**:
   - Shown as colored boxes (annotations) at BMD, BMDL, BMDU points
   - Not as curves/shading - just point markers

5. **Data Validation**:
   - Check for null `bestStatResult` (some probes may not have valid fits)
   - Filter out infinite or NaN values
   - BMDResult can be null for older file formats

6. **Multi-Chemical Display**:
   - Each chemical gets a different color from predefined palette
   - Colors cycle: RED, BLUE, BLACK, GREEN
   - Legend shows all curves with chemical name prefix

7. **Gene-to-Probe Mapping**:
   - One gene can have multiple probes
   - Each probe gets its own curve on the chart
   - ReferenceGeneProbeStatResult holds the many-to-many relationship

---

## 12. Example Web API Pseudo-Code

### Initialization
```
POST /api/pathway-curve-viewer/init
Body: {
  categoryAnalysisIds: ["analysis1", "analysis2"],
  filterCriteria: {...}
}
Response: {
  availablePathways: ["Apoptosis", "Cell Cycle", "DNA Repair", ...],
  selectedChemicals: ["Chemical A", "Chemical B"]
}
```

### Get Genes for Pathway
```
GET /api/pathway-curve-viewer/genes?pathway={name}&chemicals={id1,id2}
Response: {
  genes: ["TP53", "BAX", "CASP3", ...],
  geneCount: 45
}
```

### Get Chart Data
```
POST /api/pathway-curve-viewer/chart-data
Body: {
  pathway: "Apoptosis",
  chemicals: ["Chemical A", "Chemical B"],
  genes: ["TP53", "BAX"]
}
Response: {
  title: "Apoptosis",
  series: [
    {
      name: "Chemical A: Probe_12345",
      color: "#FF0000",
      type: "line",
      points: [{x: 0.1, y: 2.3}, {x: 0.2, y: 2.5}, ...],
      markers: [
        {type: "BMD", x: 0.45, y: 3.2, color: "#00FF00"},
        {type: "BMDL", x: 0.35, y: 3.1, color: "#FF0000"},
        {type: "BMDU", x: 0.55, y: 3.3, color: "#0000FF"}
      ]
    },
    ...
  ],
  xAxis: {
    label: "Dose",
    type: "logarithmic",
    min: 0.1,
    max: 100
  },
  yAxis: {
    label: "Log(Expression)",
    type: "linear"
  }
}
```

---

## Summary

The Pathway Curve Viewer is a sophisticated multi-level hierarchical visualization that:

1. **Allows users to explore** dose-response relationships at the pathway level
2. **Combines multiple analyses** (chemicals/experiments) for comparison
3. **Uses fitted statistical models** to generate smooth curves
4. **Displays confidence bounds** as visual markers (BMD, BMDL, BMDU)
5. **Scales both axes appropriately** (log for dose, linear for response)
6. **Supports filtering** of data based on user criteria

The data is deeply nested but well-organized:
- Analysis Results → Categories (Pathways) → Reference Genes → Probes → Statistical Models
- Each level has its own container class with clear accessor methods
- The visualization ties together probe responses, fitted models, and gene metadata

