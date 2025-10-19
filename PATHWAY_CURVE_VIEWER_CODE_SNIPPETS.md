# Pathway Curve Viewer - Code Snippets & Quick Reference

## Essential Code Snippets from BMDExpress-3

### 1. Getting Pathways from Data

```java
// Extract available pathways from category analysis results
Set<String> pathwaySet = new HashSet<>();
for (BMDExpressAnalysisDataSet results : categoryAnalysisResults) {
    for (BMDExpressAnalysisRow result : results.getAnalysisRows()) {
        if (filterPack == null || filterPack.passesFilter(result)) {
            CategoryAnalysisResult catResult = (CategoryAnalysisResult) result.getObject();
            if (catResult.getGenesThatPassedAllFilters() > 0) {
                pathwaySet.add(catResult.getCategoryDescription());
            }
        }
    }
}
List<String> pathways = new ArrayList<>(pathwaySet);
Collections.sort(pathways);
```

### 2. Getting Categories (Chemicals) for a Pathway

```java
private List<CategoryAnalysisResults> getCatResultsThatContainPathways(String pathway) {
    Set<CategoryAnalysisResults> catResults = new HashSet<>();
    
    for (BMDExpressAnalysisDataSet dataSet : categoryAnalysisResults) {
        for (BMDExpressAnalysisRow row : dataSet.getAnalysisRows()) {
            CategoryAnalysisResult result = (CategoryAnalysisResult) row.getObject();
            
            if (result.getCategoryDescription().equalsIgnoreCase(pathway) && 
                (filterPack == null || filterPack.passesFilter(row))) {
                
                if (row instanceof CombinedRow) {
                    catResults.add((CategoryAnalysisResults) ((CombinedRow) row).getParentObject());
                } else {
                    catResults.add((CategoryAnalysisResults) dataSet);
                    break;
                }
            }
        }
    }
    
    List<CategoryAnalysisResults> returnList = new ArrayList<>(catResults);
    returnList.sort(Comparator.comparing(CategoryAnalysisResults::getName));
    return returnList;
}
```

### 3. Getting Genes in a Pathway

```java
private List<String> getGenesThatAreInPathway(String pathway, 
                                               List<CategoryAnalysisResults> catResults) {
    Set<String> geneSet = new HashSet<>();
    
    for (BMDExpressAnalysisDataSet dataSet : categoryAnalysisResults) {
        for (BMDExpressAnalysisRow row : dataSet.getAnalysisRows()) {
            CategoryAnalysisResult result = (CategoryAnalysisResult) row.getObject();
            
            if (!result.getCategoryDescription().equalsIgnoreCase(pathway))
                continue;
            
            if (row instanceof CombinedRow && 
                !catResults.contains(((CombinedRow) row).getParentObject()))
                continue;
            
            if (result.getReferenceGeneProbeStatResults() == null)
                continue;
            
            // Extract unique gene symbols
            for (ReferenceGeneProbeStatResult rgps : result.getReferenceGeneProbeStatResults()) {
                if (rgps.getReferenceGene() != null && 
                    rgps.getReferenceGene().getGeneSymbol() != null) {
                    geneSet.add(rgps.getReferenceGene().getGeneSymbol());
                }
            }
        }
    }
    
    List<String> returnList = new ArrayList<>(geneSet);
    Collections.sort(returnList);
    return returnList;
}
```

### 4. Getting Chart Data (ProbeStatResults for Selected Genes)

```java
private Map<BMDResult, Set<ProbeStatResult>> getBMDResultsForCurveView(
        String pathway,
        List<CategoryAnalysisResults> catResults,
        List<String> genes) {
    
    Set<String> geneSet = new HashSet<>(genes);
    Map<BMDResult, Set<ProbeStatResult>> returnMap = new HashMap<>();
    
    for (BMDExpressAnalysisDataSet dataSet : categoryAnalysisResults) {
        for (BMDExpressAnalysisRow row : dataSet.getAnalysisRows()) {
            CategoryAnalysisResult result = (CategoryAnalysisResult) row.getObject();
            
            // Match pathway
            if (!result.getCategoryDescription().equalsIgnoreCase(pathway))
                continue;
            
            if (filterPack != null && !filterPack.passesFilter(row))
                continue;
            
            // Match selected category results
            if (row instanceof CombinedRow) {
                if (!catResults.contains(((CombinedRow) row).getParentObject()))
                    continue;
            }
            
            // Get BMD result reference
            CategoryAnalysisResults results = null;
            if (row instanceof CombinedRow) {
                results = (CategoryAnalysisResults) ((CombinedRow) row).getParentObject();
            } else {
                results = (CategoryAnalysisResults) dataSet;
            }
            
            // Extract probe results for selected genes
            if (result.getReferenceGeneProbeStatResults() == null)
                continue;
            
            for (ReferenceGeneProbeStatResult rgps : result.getReferenceGeneProbeStatResults()) {
                if (rgps.getReferenceGene() != null && 
                    rgps.getReferenceGene().getGeneSymbol() != null &&
                    geneSet.contains(rgps.getReferenceGene().getGeneSymbol())) {
                    
                    if (!returnMap.containsKey(results.getBmdResult())) {
                        returnMap.put(results.getBmdResult(), new HashSet<>());
                    }
                    returnMap.get(results.getBmdResult()).addAll(rgps.getProbeStatResults());
                }
            }
        }
    }
    
    return returnMap;
}
```

### 5. Creating Chart Data Series

```java
// JFreeCurve creates fitted curves like this:
for (BMDResult bmdResult : bmdResultToProbeStatResultMap.keySet()) {
    for (ProbeStatResult probeStatResult : bmdResultToProbeStatResultMap.get(bmdResult)) {
        // Get doses
        double[] doses = getDoses(bmdResult);
        
        // Create model
        BMDoseModel bmdModel = new BMDoseModel(
            probeStatResult.getBestStatResult(),
            probeStatResult.getProbeResponse().getProbe()
        );
        
        // Create series with interpolated points
        XYSeries modelSeries = new XYSeries(
            bmdResult.getName() + ": " + probeStatResult.toString()
        );
        
        Set<Double> uniqueDosesSet = new HashSet<>();
        for (double dose : doses) {
            uniqueDosesSet.add(dose);
        }
        List<Double> uniqueDoses = new ArrayList<>(uniqueDosesSet);
        Collections.sort(uniqueDoses);
        
        Double prevDose = null;
        for (Double dose : uniqueDoses) {
            if (prevDose == null) {
                prevDose = dose;
                continue;
            }
            
            double increment = (dose - prevDose) / 190.0;
            if (increment > 0.05 && prevDose < 10.0) {
                increment = 0.05;
            }
            
            for (double counter = prevDose; counter < dose; counter += increment) {
                modelSeries.add(counter, bmdModel.response(counter));
            }
            prevDose = dose;
        }
        
        seriesSet.addSeries(modelSeries);
    }
}

// Add marker annotations
XYDrawableAnnotation bmdMarker = new XYDrawableAnnotation(
    probeStatResult.getBestBMD().doubleValue(),
    bmdModel.response(probeStatResult.getBestBMD().doubleValue()),
    15, 15,
    new ColorBlock(Color.GREEN, 15, 15)
);

XYDrawableAnnotation bmdlMarker = new XYDrawableAnnotation(
    probeStatResult.getBestBMDL().doubleValue(),
    bmdModel.response(probeStatResult.getBestBMDL().doubleValue()),
    15, 15,
    new ColorBlock(Color.RED, 15, 15)
);

XYDrawableAnnotation bmduMarker = new XYDrawableAnnotation(
    probeStatResult.getBestBMDU().doubleValue(),
    bmdModel.response(probeStatResult.getBestBMDU().doubleValue()),
    15, 15,
    new ColorBlock(Color.BLUE, 15, 15)
);

plot.addAnnotation(bmdMarker);
plot.addAnnotation(bmdlMarker);
plot.addAnnotation(bmduMarker);
```

### 6. Getting Dose Values

```java
private double[] getDoses(BMDResult bmdResult) {
    DoseResponseExperiment experiment = bmdResult.getDoseResponseExperiment();
    double[] doses = new double[experiment.getTreatments().size()];
    
    for (int i = 0; i < experiment.getTreatments().size(); i++) {
        doses[i] = experiment.getTreatments().get(i).getDose();
    }
    
    return doses;
}
```

### 7. Getting Response Values for a Probe

```java
ProbeStatResult probeStatResult = ...; // From chart data

// Get all response measurements at each dose level
List<Float> responses = probeStatResult.getProbeResponse().getResponses();

// Or get as array (faster)
float[] responseArray = probeStatResult.getProbeResponse().getResponseArray();

// Get BMD information
Double bmd = probeStatResult.getBestBMD();
Double bmdl = probeStatResult.getBestBMDL();
Double bmdu = probeStatResult.getBestBMDU();
Double fitPValue = probeStatResult.getBestFitPValue();

// Get the statistical model
StatResult statResult = probeStatResult.getBestStatResult();
String modelName = statResult.toString(); // e.g., "Hill"
double[] curveParameters = statResult.getCurveParameters();

// Calculate response at any dose
double responseAtDose = statResult.getResponseAt(1.5); // dose = 1.5
```

### 8. Chart Axes Configuration

```java
// X-Axis: Logarithmic for Dose
LogAxis logAxis = new CustomJFreeLogAxis();
double[] doses = getDoses(new ArrayList<>(bmdResultToProbeStatResultMap.keySet()));
double lowRange = firstNonZeroDose(doses);
logAxis.setRange(new Range(lowRange, doses[doses.length - 1] * 1.1));
logAxis.setBase(10);
plot.setDomainAxis(logAxis);

// Y-Axis: Linear for Response
NumberAxis rangeAxis = (NumberAxis) plot.getRangeAxis();
rangeAxis.setAutoRangeIncludesZero(false);
rangeAxis.setLowerMargin(0.0);
```

### 9. Handling Zero Dose Special Case

```java
private double firstNonZeroDose(double[] doses) {
    boolean hasZeroLowDose = false;
    
    for (int i = 0; i < doses.length; i++) {
        if (doses[i] == 0.0) {
            hasZeroLowDose = true;
        }
        
        if (hasZeroLowDose && doses[i] > 0) {
            if (doses[i] > 1) {
                logZeroDose = 0.1;
                return 0.09;
            }
            logZeroDose = doses[i];
            double decade = 1.0;
            double decadeBelowLow = firstDecadeBelow(logZeroDose);
            for (decade = 1.0; decade >= decadeBelowLow; decade *= 0.1) {
                // Find appropriate decade
            }
            logZeroDose = decade;
            return decade * 0.9;
        }
    }
    
    // No zero dose
    logZeroDose = doses[0];
    return doses[0] * 0.9;
}

private double maskDose(double dose) {
    if (logDoseAxis && dose == 0) {
        return logZeroDose;
    }
    return dose;
}
```

### 10. Data Validation Before Display

```java
// Check for valid data before creating chart
boolean hasValidData = true;

// Verify BMDResult exists
if (categoryAnalysisResults.getBmdResult() == null) {
    hasValidData = false;
    // Show warning: Data was generated with older version of BMDExpress
}

// Verify best stat result exists
if (probeStatResult.getBestStatResult() == null) {
    // Skip this probe, but don't fail entire chart
    continue;
}

// Check for NaN or infinite values
double bmd = probeStatResult.getBestBMD();
if (Double.isNaN(bmd) || Double.isInfinite(bmd)) {
    // Skip this data point
    continue;
}

// Verify dose values exist
DoseResponseExperiment experiment = bmdResult.getDoseResponseExperiment();
if (experiment.getTreatments() == null || experiment.getTreatments().isEmpty()) {
    hasValidData = false;
}

if (hasValidData) {
    // Create chart
}
```

## Data Model Relationships

### Hierarchy
```
CategoryAnalysisResults (chemical analysis)
    |
    +-- BMDResult (statistical fitting)
    |   |
    |   +-- DoseResponseExperiment
    |   |   |
    |   |   +-- Treatment[] (doses)
    |   |   |   +-- dose: Float
    |   |   |   +-- name: String
    |   |   |
    |   |   +-- ProbeResponse[]
    |   |       +-- probe: Probe (ID)
    |   |       +-- responses: List<Float> (expression at each dose)
    |   |
    |   +-- ProbeStatResult[]
    |       +-- bestStatResult: StatResult (fitted curve)
    |       |   +-- BMD: double
    |       |   +-- BMDL: double
    |       |   +-- BMDU: double
    |       |   +-- curveParameters: double[]
    |       |   +-- fitPValue: double
    |       |
    |       +-- probeResponse: ProbeResponse
    |           +-- probe: Probe
    |           +-- responses: List<Float>
    |
    +-- CategoryAnalysisResult[] (pathways/GO terms)
        +-- categoryDescription: String (pathway name)
        +-- ReferenceGeneProbeStatResult[]
            +-- referenceGene: ReferenceGene
            |   +-- geneSymbol: String
            |   +-- id: String
            |
            +-- probeStatResults: ProbeStatResult[]
                +-- (links back to BMDResult.probeStatResults)
```

## Key Constants

```java
// StatResult model types
public abstract class StatResult {
    // Concrete types:
    // - HillResult
    // - PolyResult (polynomial)
    // - PowerResult
    // - ExponentialResult
    // - GCurvePResult
    // - ModelAveragingResult
}

// Adverse Direction
public enum AdverseDirectionEnum {
    UP,      // Expression increases with dose
    DOWN,    // Expression decreases with dose
    CONFLICT // Mixed direction
}

// Log Transformation
public enum LogTransformationEnum {
    BASE2,   // Log base 2
    BASE10,  // Log base 10
    NATURAL  // Natural log
}

// Chart Colors (predefined)
Color RED     // First chemical / BMDL marker
Color BLUE    // Second chemical / BMDU marker
Color BLACK   // Third chemical
Color GREEN   // Fourth chemical / BMD marker
```

## Common Operations

### Get All Data for a Chart

```typescript
// TypeScript/JavaScript equivalent for web app
async function getChartData(pathway: string, chemicals: string[], genes: string[]) {
    const response = await fetch('/api/pathway-curve-viewer/data', {
        method: 'POST',
        body: JSON.stringify({
            pathway,
            chemicals,
            genes
        })
    });
    
    const chartData = await response.json();
    
    // chartData contains:
    // - series: Array of {name, points, bmdMarkers}
    // - xAxis: {min, max, scale: 'log'}
    // - yAxis: {min, max, scale: 'linear', label: 'Log(Expression)'}
    // - title: pathway name
    
    return chartData;
}
```

### Display Curve Markers

```typescript
// Each curve has three markers:
markers: [
    {
        type: 'BMD',
        x: probeStatResult.getBestBMD(),
        y: bmdModel.response(probeStatResult.getBestBMD()),
        color: 'green',
        size: 15
    },
    {
        type: 'BMDL',
        x: probeStatResult.getBestBMDL(),
        y: bmdModel.response(probeStatResult.getBestBMDL()),
        color: 'red',
        size: 15
    },
    {
        type: 'BMDU',
        x: probeStatResult.getBestBMDU(),
        y: bmdModel.response(probeStatResult.getBestBMDU()),
        color: 'blue',
        size: 15
    }
]
```

