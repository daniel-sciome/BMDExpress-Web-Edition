# Pathway Curve Viewer Documentation Index

## Quick Links

- **README**: Start here - [PATHWAY_CURVE_VIEWER_README.md](PATHWAY_CURVE_VIEWER_README.md)
- **Technical Analysis**: Detailed docs - [PATHWAY_CURVE_VIEWER_ANALYSIS.md](PATHWAY_CURVE_VIEWER_ANALYSIS.md)
- **Code Examples**: Implementation snippets - [PATHWAY_CURVE_VIEWER_CODE_SNIPPETS.md](PATHWAY_CURVE_VIEWER_CODE_SNIPPETS.md)

## Package Contents

| File | Size | Lines | Purpose |
|------|------|-------|---------|
| `PATHWAY_CURVE_VIEWER_README.md` | 12KB | 243 | Overview and quick start guide |
| `PATHWAY_CURVE_VIEWER_ANALYSIS.md` | 28KB | 826 | Complete technical analysis |
| `PATHWAY_CURVE_VIEWER_CODE_SNIPPETS.md` | 16KB | 490 | Ready-to-use code examples |
| **TOTAL** | **56KB** | **1,559** | **Complete documentation set** |

## What Is Pathway Curve Viewer?

A sophisticated dose-response visualization component that:

1. **Displays fitted dose-response curves** for genes in biological pathways
2. **Allows multi-chemical comparison** - overlay curves from different experiments
3. **Shows confidence bounds** - BMD, BMDL, BMDU markers for each curve
4. **Uses logarithmic dose scale** - standard for dose-response analysis
5. **Supports hierarchical selection** - Pathway → Chemical → Gene → Probe

### Example Use Case
A researcher wants to compare how two chemicals affect genes in the "Apoptosis" pathway:
- Select Pathway: "Apoptosis"
- Select Chemicals: "Chemical A", "Chemical B"
- Select Genes: "TP53", "BAX", "CASP3"
- View: 6 curves (2 chemicals × 3 genes), each with BMD markers

## How to Use This Documentation

### For Quick Understanding (15 minutes)
1. Read this INDEX file
2. Skim PATHWAY_CURVE_VIEWER_README.md Sections 1-4
3. Look at the data hierarchy diagram in CODE_SNIPPETS.md

### For Implementation (1-2 hours)
1. Read all of PATHWAY_CURVE_VIEWER_README.md
2. Study PATHWAY_CURVE_VIEWER_ANALYSIS.md Sections 1-6
3. Review PATHWAY_CURVE_VIEWER_CODE_SNIPPETS.md Sections 1-5
4. Follow the implementation checklist in README

### For Deep Understanding (3+ hours)
1. Read PATHWAY_CURVE_VIEWER_ANALYSIS.md completely
2. Study CODE_SNIPPETS.md carefully
3. Reference the original source files in BMDExpress-3
4. Understand the mathematical models (Section 7 in ANALYSIS.md)

### For Reference (as needed)
1. Use data access table in ANALYSIS.md Section 10
2. Use code snippets as templates
3. Check implementation checklist for status tracking

## Key Concepts to Understand

### 1. Hierarchical Data Structure
```
Analysis (Chemical)
  └── Pathway (e.g., "Apoptosis")
      └── Gene (e.g., "TP53")
          └── Probe (e.g., "Probe_001")
              └── Dose-Response Curve (fitted model)
```

### 2. Dose-Response Model
- Input: Dose value (X-axis, logarithmic scale)
- Output: Expression change (Y-axis, linear scale)
- Model: Fitted statistical function (Hill, Polynomial, etc.)
- Confidence bounds: BMD, BMDL, BMDU

### 3. Three Types of Data on Chart
- **Fitted Curves**: Smooth lines predicted by statistical model
- **Data Points**: Actual measurements at tested doses
- **Confidence Markers**: BMD (green), BMDL (red), BMDU (blue)

### 4. Multiple Curves Per Chart
- One curve per probe
- Multiple probes per gene
- Multiple genes per pathway
- Multiple chemicals (overlaid)

## Data Flow

```
User Input
  ↓
┌─────────────────────────────────────────────────────┐
│ 1. Select Pathway (autocomplete search)             │
│    Triggers: getCatResultsThatContainPathways()     │
└─────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────┐
│ 2. Select Chemical/Analysis (multi-select)          │
│    Triggers: Update available genes list            │
└─────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────┐
│ 3. Select Genes (multi-select)                      │
│    Triggers: getBMDResultsForCurveView()            │
└─────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────┐
│ 4. Build Chart                                      │
│    - Extract doses from DoseResponseExperiment      │
│    - Calculate curve points for each probe          │
│    - Add BMD/BMDL/BMDU markers                      │
│    - Render with log(dose) x-axis                   │
└─────────────────────────────────────────────────────┘
  ↓
Rendered Chart with Multiple Curves
```

## Key Classes & Data Structures

### Main Classes
| Class | Purpose | Location |
|-------|---------|----------|
| **CategoryAnalysisResults** | Container for one chemical's analysis | ANALYSIS Section 4.1 |
| **CategoryAnalysisResult** | One pathway/GO term result | ANALYSIS Section 4.2 |
| **ReferenceGeneProbeStatResult** | Gene to probes link | ANALYSIS Section 4.3 |
| **ProbeStatResult** | Statistical results for one probe | ANALYSIS Section 4.4 |
| **StatResult** | Fitted curve model (Hill, Poly, etc.) | ANALYSIS Section 4.6 |
| **BMDResult** | Statistical fitting results | ANALYSIS Section 4.7 |
| **DoseResponseExperiment** | Experimental design & data | ANALYSIS Section 4.8 |

### Data Values You Need
| Value | Purpose | Source |
|-------|---------|--------|
| Pathway name | Chart title, filtering | CategoryAnalysisResult.getCategoryDescription() |
| Chemical name | Legend prefix | CategoryAnalysisResults.getName() |
| Gene symbol | Legend label | ReferenceGeneProbeStatResult.getReferenceGene().getGeneSymbol() |
| Probe ID | Curve identifier | ProbeResponse.getProbe().getId() |
| Doses (array) | X-axis values | DoseResponseExperiment.getTreatments()[i].getDose() |
| Responses (array) | Raw Y-axis data | ProbeResponse.getResponses() |
| BMD value | Green marker position | StatResult.getBMD() |
| BMDL value | Red marker position | StatResult.getBMDL() |
| BMDU value | Blue marker position | StatResult.getBMDU() |
| Curve formula | Response calculation | StatResult.getResponseAt(dose) |

## Implementation Path

### Phase 1: Data Access (Backend)
- [ ] Parse CategoryAnalysisResults JSON
- [ ] Implement pathway enumeration
- [ ] Implement chemical enumeration
- [ ] Implement gene enumeration
- [ ] Implement chart data retrieval

### Phase 2: UI Components (Frontend)
- [ ] Pathway autocomplete textbox
- [ ] Chemical/experiment multi-select
- [ ] Gene multi-select
- [ ] Chart container component

### Phase 3: Curve Rendering (Frontend)
- [ ] Calculate interpolated curve points (190 points/interval)
- [ ] Implement logarithmic x-axis
- [ ] Implement linear y-axis
- [ ] Render curves with appropriate colors
- [ ] Add BMD/BMDL/BMDU markers
- [ ] Add legend

### Phase 4: Polish (Frontend)
- [ ] Tooltips on hover
- [ ] Legend interactivity (show/hide curves)
- [ ] Zoom and pan support
- [ ] Export as image
- [ ] Error handling

## Important Implementation Notes

### Axes
- **X-Axis**: ALWAYS logarithmic base 10
  - Special handling for dose = 0 (map to decade below min)
  - Range: min_dose * 0.9 to max_dose * 1.1
  - Format: Scientific notation (1E-2, 1E1, 1E4)

- **Y-Axis**: Linear for log-transformed expression
  - Data label: "Log(Expression)"
  - Auto-scaled with lower margin = 0
  - No zero inclusion

### Color Scheme
```
First chemical:    RED (#FF0000)
Second chemical:   BLUE (#0000FF)
Third chemical:    BLACK (#000000)
Fourth chemical:   GREEN (#00FF00)

BMD marker:        GREEN box
BMDL marker:       RED box
BMDU marker:       BLUE box
```

### Curve Interpolation
- 190 points calculated between each adjacent dose pair
- Formula: `response = StatResult.getResponseAt(dose)`
- Models supported: Hill, Polynomial, Power, Exponential, G-CurveP, Averaging

### Data Validation
- Check for null bestStatResult
- Filter NaN/infinite BMD values
- Verify dose array exists and non-empty
- Check BMDResult not null (compatibility issue with older versions)

## Common Gotchas

1. **Multiple Probes Per Gene**: Each probe is a separate curve
2. **One Gene Per Chemical Per Pathway**: Get all probes for that gene
3. **Dose = 0 Special Case**: Must map to non-zero value for log scale
4. **Response Values Are Log-Transformed**: Don't transform again
5. **BMD/BMDL/BMDU Are Dose Values**: Use as X coordinates, call response(dose) for Y
6. **Older File Versions**: BMDResult can be null - must check before use
7. **Parallel Arrays**: Responses[i] corresponds to Treatments[i].dose

## Performance Tips

1. **Lazy Loading**: Only compute curves when gene selection finishes
2. **Caching**: Store computed points to avoid recalculation
3. **Progressive Rendering**: Show curves as they complete
4. **Culling**: Only render points within visible range
5. **Batch Operations**: Don't update chart one point at a time
6. **Use Canvas/WebGL**: For >1000 points, use canvas rendering

## Troubleshooting

### Issue: Curve doesn't appear
- Check if bestStatResult is null
- Verify dose/response data exists
- Check for NaN/infinite values
- Verify chart axes are configured

### Issue: BMD markers in wrong position
- Verify BMD value is in dose range (x-axis)
- Check response calculation: bmdModel.response(bmd)
- Ensure y-axis scale matches response range

### Issue: Gaps in curves
- May be intentional (dose intervals)
- Check interpolation calculation
- Verify dose sorting is ascending

### Issue: Chart too crowded
- Limit number of genes/chemicals shown
- Implement curve filtering
- Use separate subplots
- Add opacity/alpha to curves

## References

- Original Java source: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/util/visualizations/curvefit/`
- Data models: `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/`
- JFreeChart documentation: Used for original Java implementation
- BMDExpress documentation: For statistical model details

## Support

For questions about:
- **Data structure**: See ANALYSIS.md Section 3 & 4
- **Code patterns**: See CODE_SNIPPETS.md
- **Implementation approach**: See README.md
- **Specific classes**: See ANALYSIS.md Section 4
- **Chart configuration**: See ANALYSIS.md Section 5
- **Original code**: Review source files in BMDExpress-3

---

**Last Updated**: October 19, 2025
**Total Documentation**: 56KB, 1,559 lines
**Status**: Complete analysis and code snippets ready for implementation
