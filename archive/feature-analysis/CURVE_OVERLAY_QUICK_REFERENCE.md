# Curve Overlay Visualization - Quick Reference Guide

## What It Does

Displays multiple dose-response curves overlaid on a single chart for a selected pathway, showing how genes respond to chemical treatment across different doses.

## Core Data Flow

```
Pathway Selected → Analyses Selected → Genes Selected → Chart Generated
                                                              ↓
                                                    Creates curve per gene
                                                    (using fitted model)
```

## Statistical Models and Their Formulas

### Hill Model
```
response = intercept + v * dose^n / (k^n + dose^n)
params: [intercept, v, n, k]
```

### Power Model
```
response = control + slope * dose^power
params: [control, slope, power]
```

### Exponential Models (4 variants)
```
Option 2: a * exp(sign * b * dose)
Option 3: a * exp(sign * (b * dose)^d)
Option 4: a * (c - (c - 1) * exp(-b * dose))
Option 5: a * (c - (c - 1) * exp(-(b * dose)^d))
```

### Polynomial Model
```
response = beta_0 + beta_1*dose + beta_2*dose^2 + ... + beta_n*dose^n
```

## Key Classes

| Class | Purpose | Key Info |
|-------|---------|----------|
| PathwayCurveViewer | UI for selecting data | Handles user selections |
| JFreeCurve | Chart renderer | Creates actual visualization |
| BMDoseModel | Model calculator | Computes response at doses |
| StatResult (subclasses) | Model implementations | Each model type implements getResponseAt() |

## Data Structure for Web

```
ProbeStatResult
├── probe: {id, ...}
├── bestStatResult: {
│   ├── model: "Hill" | "Power" | "Exp-2" | "Poly-2"
│   ├── bmd: 5.5
│   ├── bmdl: 3.2
│   ├── bmdu: 9.8
│   └── curveParameters: [1.2, 0.8, 2.1, 5.0]
└── probeResponse: {
    └── probe
```

## Chart Rendering

**X-axis:** Dose (Log10 scale)
**Y-axis:** Log(Expression) - linear
**Lines:** One per selected gene/probe (smooth curves)
**Markers:** 
- Green circle = BMD (Benchmark Dose)
- Red circle = BMDL (Lower bound)
- Blue circle = BMDU (Upper bound)

## Curve Generation Algorithm

1. Get all unique dose values
2. For each dose pair:
   - Calculate ~190 interpolated points between them
   - For each point: call model.getResponseAt(dose)
   - Add point to series
3. Add series to chart

## Response Calculation Example (Hill)

```javascript
// Given: intercept=1.0, v=2.5, n=1.8, k=5.0
// At dose=3.0:
nom = 2.5 * Math.pow(3.0, 1.8)      // 2.5 * 5.73 = 14.33
denom = Math.pow(5.0, 1.8) + Math.pow(3.0, 1.8)  // 13.37 + 5.73 = 19.10
response = 1.0 + 14.33/19.10 = 1.75
```

## Important Considerations

### Log Scale Handling
- Dose values on X-axis are logarithmic (base 10)
- Dose = 0 needs special handling (use LogAxis with custom formatter)
- Typically start range: 10x below minimum dose

### Parameter Array Indexing
- All models use `curveParameters[]` array
- Index 0 = first parameter (varies by model)
- Order is critical for correct calculation

### Interpolation
- Desktop version: ~190 points per dose interval
- Web version: Can optimize to fewer points (~50-100)
- Ensures visually smooth curves

## Data Files in BMDExpress-3

Key files showing implementation:
- `/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/PathwayCurveViewer.java` (UI logic)
- `/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/JFreeCurve.java` (chart rendering)
- `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/HillResult.java` (Hill model)
- `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/PowerResult.java` (Power model)
- `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/ExponentialResult.java` (Exponential models)
- `/src/main/java/com/sciome/bmdexpress2/mvp/model/stat/PolyResult.java` (Polynomial model)

## Web Implementation Priorities

1. **High Priority**
   - Hill model response calculation
   - Power model response calculation
   - Chart with log X-axis
   - Curve interpolation (100+ points)
   - BMD marker annotations

2. **Medium Priority**
   - Polynomial model
   - Exponential models
   - Legend formatting
   - Tooltip information

3. **Nice to Have**
   - Custom parameter entry
   - Model formula display
   - Export as image/data

