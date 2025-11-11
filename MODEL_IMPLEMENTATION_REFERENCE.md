# Model Implementation Reference - Code Snippets

## Model Response Calculations from BMDExpress-3

This document shows the exact implementations from the desktop JavaFX version that need to be replicated for the web version.

---

## Hill Model

**Source:** `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/HillResult.java`

```java
@Override
public double getResponseAt(double dose) {
    int base = 0;
    double theDose = dose;
    double nom = curveParameters[base + 1] * Math.pow(theDose, curveParameters[base + 2]);
    double denom = Math.pow(curveParameters[base + 3], curveParameters[base + 2])
            + Math.pow(theDose, curveParameters[base + 2]);
    return curveParameters[base] + nom / denom;
}
```

**Parameters:** `[intercept, v, n, k]`
**Formula:** `intercept + v * dose^n / (k^n + dose^n)`
**Parameter Count:** 4

**JavaScript Implementation:**
```javascript
function getHillResponse(dose, params) {
    // params[0] = intercept
    // params[1] = v
    // params[2] = n
    // params[3] = k
    const base = 0;
    const nom = params[base + 1] * Math.pow(dose, params[base + 2]);
    const denom = Math.pow(params[base + 3], params[base + 2]) 
                + Math.pow(dose, params[base + 2]);
    return params[base] + nom / denom;
}
```

---

## Power Model

**Source:** `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/PowerResult.java`

```java
@Override
public double getResponseAt(double dose) {
    int base = 0;
    return curveParameters[base] + curveParameters[base + 1] 
           * Math.pow(dose, curveParameters[base + 2]);
}
```

**Parameters:** `[control, slope, power]`
**Formula:** `control + slope * dose^power`
**Parameter Count:** 3

**JavaScript Implementation:**
```javascript
function getPowerResponse(dose, params) {
    // params[0] = control
    // params[1] = slope
    // params[2] = power
    const base = 0;
    return params[base] + params[base + 1] * Math.pow(dose, params[base + 2]);
}
```

---

## Exponential Models (4 variants)

**Source:** `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/ExponentialResult.java`

### Option 2: `a * exp(sign * b * dose)`

```java
private double exp2Function(int base, double dose) {
    double a = curveParameters[base + 1];
    double b = curveParameters[base + 2];
    return a * Math.exp(curveParameters[base] * b * dose);
}
```

**Parameters:** `[sign, a, b]`
**JavaScript:**
```javascript
function getExpOption2Response(dose, params) {
    // params[0] = sign (-1 or 1)
    // params[1] = a
    // params[2] = b
    const a = params[1];
    const b = params[2];
    return a * Math.exp(params[0] * b * dose);
}
```

### Option 3: `a * exp(sign * (b * dose)^d)`

```java
private double exp3Function(int base, double dose) {
    double a = curveParameters[base + 1];
    double b = curveParameters[base + 2];
    double d = curveParameters[base + 3];
    double expvalue = Math.pow(b * dose, d);
    return a * Math.exp(curveParameters[base] * expvalue);
}
```

**Parameters:** `[sign, a, b, d]`
**JavaScript:**
```javascript
function getExpOption3Response(dose, params) {
    // params[0] = sign
    // params[1] = a
    // params[2] = b
    // params[3] = d
    const a = params[1];
    const b = params[2];
    const d = params[3];
    const expvalue = Math.pow(b * dose, d);
    return a * Math.exp(params[0] * expvalue);
}
```

### Option 4: `a * (c - (c - 1) * exp(-b * dose))`

```java
private double exp4Function(int base, double dose) {
    double a = curveParameters[base + 1];
    double b = curveParameters[base + 2];
    double c = curveParameters[base + 3];
    return a * (c - (c - 1) * Math.exp(-b * dose));
}
```

**Parameters:** `[sign, a, b, c]` (sign not used in formula)
**JavaScript:**
```javascript
function getExpOption4Response(dose, params) {
    // params[0] = sign (not used)
    // params[1] = a
    // params[2] = b
    // params[3] = c
    const a = params[1];
    const b = params[2];
    const c = params[3];
    return a * (c - (c - 1) * Math.exp(-b * dose));
}
```

### Option 5: `a * (c - (c - 1) * exp(-(b * dose)^d))`

```java
private double exp5Function(int base, double dose) {
    double a = curveParameters[base + 1];
    double b = curveParameters[base + 2];
    double c = curveParameters[base + 3];
    double d = curveParameters[base + 4];
    double expvalue = Math.pow(b * dose, d);
    return a * (c - (c - 1) * Math.exp(-expvalue));
}
```

**Parameters:** `[sign, a, b, c, d]` (sign not used)
**JavaScript:**
```javascript
function getExpOption5Response(dose, params) {
    // params[0] = sign (not used)
    // params[1] = a
    // params[2] = b
    // params[3] = c
    // params[4] = d
    const a = params[1];
    const b = params[2];
    const c = params[3];
    const d = params[4];
    const expvalue = Math.pow(b * dose, d);
    return a * (c - (c - 1) * Math.exp(-expvalue));
}
```

---

## Polynomial Model (Dynamic Degree)

**Source:** `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/PolyResult.java`

```java
@Override
public double getResponseAt(double d) {
    return polyFunction(d, degree);
}

private double polyFunction(double dose, int degree) {
    int base = 0;
    int start = base + 1;
    return curveParameters[base] + polyValue(dose, start, 1, degree);
}

private double polyValue(double dose, int index, int cur, int max) {
    if (cur == max) {
        return curveParameters[index] * Math.pow(dose, max);
    } else {
        return curveParameters[index] * Math.pow(dose, cur) 
               + polyValue(dose, index + 1, cur + 1, max);
    }
}
```

**Parameters:** `[beta_0, beta_1, beta_2, ..., beta_n]` where n = degree
**Formula:** `beta_0 + beta_1*dose + beta_2*dose^2 + ... + beta_n*dose^n`

**JavaScript Implementation (Simplified):**
```javascript
function getPolyResponse(dose, params, degree) {
    // params[0] = beta_0
    // params[1] = beta_1
    // ... and so on
    
    let response = params[0];
    for (let i = 1; i <= degree; i++) {
        response += params[i] * Math.pow(dose, i);
    }
    return response;
}
```

---

## Model Type Detection

**From StatResult.java:**

```java
@JsonSubTypes({ 
    @Type(value = HillResult.class, name = "hill"),
    @Type(value = PolyResult.class, name = "poly"),
    @Type(value = ExponentialResult.class, name = "exponential"),
    @Type(value = PowerResult.class, name = "power"),
    @Type(value = GCurvePResult.class, name = "gcurvep"),
    @Type(value = ModelAveragingResult.class, name = "modelaveraging") 
})
```

**Model identification in JSON:**
```json
{
    "bestStatResult": {
        "@type": "hill",  // or "power", "exponential", "poly"
        "model": "Hill",  // Also stored as string
        "bmd": 5.5,
        "curveParameters": [...]
    }
}
```

**JavaScript Model Router:**
```javascript
function getResponse(dose, statResult) {
    const model = statResult['@type'] || statResult.model.toLowerCase();
    const params = statResult.curveParameters;
    
    switch(model) {
        case 'hill':
            return getHillResponse(dose, params);
        case 'power':
            return getPowerResponse(dose, params);
        case 'exponential':
            // Need to determine option (2,3,4, or 5)
            // Option is stored separately in ExponentialResult
            return getExponentialResponse(dose, params, statResult.option);
        case 'poly':
            // Degree is stored separately in PolyResult
            return getPolyResponse(dose, params, statResult.degree);
        default:
            throw new Error(`Unknown model type: ${model}`);
    }
}
```

---

## Curve Generation Algorithm

**From JFreeCurve.java:**

```java
private XYSeries createModels(ProbeStatResult probeStatResult, BMDResult bmdResult) {
    OnewayAnova oneway = new OnewayAnova();
    double[] doses = getDoses(bmdResult);
    oneway.setVariablesXX(0, doses);
    
    BMDoseModel bmdModel = new BMDoseModel(
        probeStatResult.getBestStatResult(),
        probeStatResult.getProbeResponse().getProbe()
    );
    bmdModel.setEstimates(oneway.estimates());
    double[] parameters = getParameters(probeStatResult);
    bmdModel.setParameters(parameters);

    // Create series
    XYSeries modelSeries = new XYSeries(
        bmdResult.getName() + ": " + probeStatResult.toString()
    );
    
    // Get unique doses
    Set<Double> uniqueDosesSet = new HashSet<>();
    for (int i = 0; i < doses.length; i++)
        uniqueDosesSet.add(doses[i]);
    List<Double> uniqueDoses = new ArrayList<>(uniqueDosesSet);
    Collections.sort(uniqueDoses);
    
    // Interpolate between each pair of doses
    Double prevDose = null;
    for (Double dose : uniqueDoses) {
        if (prevDose == null) {
            prevDose = dose;
            continue;
        }
        
        // ~190 points per interval
        double increment = (dose - prevDose) / 190.0;
        if (increment > .05 && prevDose < 10.0)
            increment = .05;
            
        for (double counter = prevDose; counter < dose; counter += increment)
            modelSeries.add(counter, bmdModel.response(counter));
            
        prevDose = dose;
    }
    
    return modelSeries;
}
```

**JavaScript Implementation:**
```javascript
function generateCurvePoints(probeStatResult, doses) {
    const points = [];
    const uniqueDoses = [...new Set(doses)].sort((a, b) => a - b);
    
    let prevDose = null;
    for (let dose of uniqueDoses) {
        if (prevDose === null) {
            prevDose = dose;
            continue;
        }
        
        // Generate interpolated points
        let increment = (dose - prevDose) / 190.0;
        if (increment > 0.05 && prevDose < 10.0)
            increment = 0.05;
        
        for (let counter = prevDose; counter < dose; counter += increment) {
            const response = getResponse(counter, probeStatResult.bestStatResult);
            points.push({ x: counter, y: response });
        }
        
        prevDose = dose;
    }
    
    return points;
}
```

---

## Chart Data Structure

**From JFreeCurve.java:**

```java
Map<BMDResult, Set<ProbeStatResult>> bmdResultToProbeStatResultMap
// Passed to chart constructor

// For each BMDResult key
for (BMDResult key : bmdResultToProbeStatResultMap.keySet()) {
    // For each ProbeStatResult in the set
    for (ProbeStatResult psr : bmdResultToProbeStatResultMap.get(key)) {
        // Create and add series
        seriesSet.addSeries(createModels(psr, key));
    }
}
```

**JavaScript Equivalent:**
```javascript
// Input structure
const chartData = {
    pathway: "Pathway Name",
    bmdResults: [
        {
            name: "Chemical A",
            probeStatResults: [
                {
                    probeId: "PROBE_001",
                    bestStatResult: { /* model data */ }
                },
                // ... more probes
            ]
        },
        // ... more analyses
    ]
};

// Chart generation
function generateChart(chartData) {
    const allSeries = [];
    
    for (let bmdResult of chartData.bmdResults) {
        for (let probeStatResult of bmdResult.probeStatResults) {
            const seriesName = `${bmdResult.name}: ${probeStatResult.probeId}`;
            const points = generateCurvePoints(
                probeStatResult, 
                bmdResult.doseResponseExperiment.doses
            );
            allSeries.push({
                name: seriesName,
                data: points,
                bmd: probeStatResult.bestStatResult.bmd,
                bmdl: probeStatResult.bestStatResult.bmdl,
                bmdu: probeStatResult.bestStatResult.bmdu
            });
        }
    }
    
    return createChart(allSeries, chartData.pathway);
}
```

---

## Testing Examples

### Hill Model Test Case
```javascript
// Hill: response = 1.0 + 2.5*dose^1.8/(5.0^1.8 + dose^1.8)
const hillParams = [1.0, 2.5, 1.8, 5.0];

// At dose = 0:
// nom = 2.5 * 0^1.8 = 0
// denom = 5.0^1.8 + 0^1.8 = 13.37
// response = 1.0 + 0/13.37 = 1.0
assert(getHillResponse(0, hillParams) === 1.0);

// At dose = 5.0:
// nom = 2.5 * 5^1.8 = 2.5 * 13.37 = 33.42
// denom = 13.37 + 13.37 = 26.74
// response = 1.0 + 33.42/26.74 = 2.25
assert(Math.abs(getHillResponse(5.0, hillParams) - 2.25) < 0.01);
```

### Power Model Test Case
```javascript
// Power: response = 0.5 + 0.1*dose^0.8
const powerParams = [0.5, 0.1, 0.8];

// At dose = 0:
// response = 0.5 + 0.1*0^0.8 = 0.5
assert(getPowerResponse(0, powerParams) === 0.5);

// At dose = 10:
// response = 0.5 + 0.1*10^0.8 = 0.5 + 0.1*6.31 = 1.131
assert(Math.abs(getPowerResponse(10, powerParams) - 1.131) < 0.01);
```

---

**End of Reference Document**
