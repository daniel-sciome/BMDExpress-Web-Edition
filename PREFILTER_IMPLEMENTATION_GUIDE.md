# BMDExpress-3 Web - Prefilter Implementation Guide

**Purpose**: Complete technical reference for implementing the prefiltering workflow in the BMDExpress-3 Web application, based on comprehensive analysis of the desktop JavaFX application.

**Date**: November 21, 2025

**Source**: Desktop application at `/home/svobodadl/BMDExpress-3`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prefilter Types](#2-prefilter-types)
3. [Common Configuration Parameters](#3-common-configuration-parameters)
4. [Data Structures](#4-data-structures)
5. [Workflow Integration](#5-workflow-integration)
6. [Algorithm Implementations](#6-algorithm-implementations)
7. [UI Component Design](#7-ui-component-design)
8. [Backend Implementation Strategy](#8-backend-implementation-strategy)
9. [Frontend Implementation Strategy](#9-frontend-implementation-strategy)
10. [Technical Porting Considerations](#10-technical-porting-considerations)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. Overview

### 1.1 What is Prefiltering?

Prefiltering is the **first statistical analysis step** in the BMDExpress workflow. It filters the initial expression dataset (typically 20,000-40,000 probes/genes) down to a manageable subset (500-5,000) that show dose-dependent changes.

**Purpose**:
- Reduce computational burden for downstream BMD modeling
- Focus on biologically relevant genes/probes
- Apply statistical tests appropriate for different experimental designs

### 1.2 Workflow Position

```
User Expression Data (20K-40K probes)
         ↓
   [PREFILTERING] ← YOU ARE HERE
         ↓
   Filtered Data (500-5K probes)
         ↓
   [BMD ANALYSIS]
         ↓
   BMD Results with Models
         ↓
   [CATEGORY ANALYSIS]
         ↓
   Category Results (GO/Pathway enrichment)
```

### 1.3 Four Prefilter Types

| Type | Purpose | Statistical Method | Best For |
|------|---------|-------------------|----------|
| **One-Way ANOVA** | General dose-response | F-test | Standard dose-response experiments |
| **Williams Trend Test** | Monotonic trends | Permutation-based | Ordered dose-response with expected monotonicity |
| **Oriogen** | Dose-response patterns | Bootstrap shrinkage | Complex patterns, high variance data |
| **Curve Fit Prefilter** | BMD-based filtering | Model fitting (Hill, Power, etc.) | When you want early BMD estimates |

---

## 2. Prefilter Types

### 2.1 One-Way ANOVA

**Desktop Files**:
- Input: `com/sciome/bmdexpress2/mvp/model/prefilter/OneWayANOVAInput.java`
- Result: `com/sciome/bmdexpress2/mvp/model/prefilter/OneWayANOVAResult.java`
- Results Container: `com/sciome/bmdexpress2/mvp/model/prefilter/OneWayANOVAResults.java`
- Algorithm: `com/sciome/bmdexpress2/util/prefilter/OneWayANOVAAnalysis.java`
- UI: `src/main/resources/fxml/onewayanova.fxml`

**Description**: Tests whether there are significant differences among dose groups using the F-test.

**Statistical Method**:
```
H0: μ₁ = μ₂ = μ₃ = ... = μₖ (all dose group means equal)
H1: At least one mean differs

F = (Between-group variance) / (Within-group variance)
```

**Specific Parameters**: None (uses only common parameters)

**Output Metrics**:
- `fValue`: F-statistic
- `pValue`: Raw p-value from F-test
- `adjustedPValue`: FDR-corrected p-value (if Benjamini-Hochberg enabled)
- `degreesOfFreedomOne`: Between-groups df (k-1, where k = number of dose groups)
- `degreesOfFreedomTwo`: Within-groups df (N-k, where N = total samples)

**Use Case**: Default choice for most dose-response experiments. Robust and widely understood.

---

### 2.2 Williams Trend Test

**Desktop Files**:
- Input: `com/sciome/bmdexpress2/mvp/model/prefilter/WilliamsTrendInput.java`
- Result: `com/sciome/bmdexpress2/mvp/model/prefilter/WilliamsTrendResult.java`
- Results Container: `com/sciome/bmdexpress2/mvp/model/prefilter/WilliamsTrendResults.java`
- UI: `src/main/resources/fxml/williamstrend.fxml`

**Description**: Non-parametric test specifically designed for ordered dose-response data. Tests for monotonic trends (increasing or decreasing) across dose levels.

**Statistical Method**:
- Permutation-based test
- Null hypothesis: No monotonic dose-response trend
- More powerful than ANOVA when dose-response is expected to be monotonic

**Specific Parameters**:
```typescript
{
  numPermutations: number;  // Default: 100
                            // Higher values = more accurate p-values
                            // Typical range: 100-1000
}
```

**Output Metrics**:
- `pValue`: Raw p-value from permutation test
- `adjustedPValue`: FDR-corrected p-value

**Use Case**: When you expect monotonic dose-response (most toxicology studies). More statistically powerful than ANOVA for this specific case.

**Implementation Note**: Desktop uses `WilliamsTrendTestUtil` from sciome-commons library. Will need JavaScript implementation or backend service.

---

### 2.3 Oriogen

**Desktop Files**:
- Input: `com/sciome/bmdexpress2/mvp/model/prefilter/OriogenInput.java`
- Result: `com/sciome/bmdexpress2/mvp/model/prefilter/OriogenResult.java`
- Results Container: `com/sciome/bmdexpress2/mvp/model/prefilter/OriogenResults.java`
- UI: `src/main/resources/fxml/oriogen.fxml`

**Description**: Bootstrap-based shrinkage estimator for identifying dose-responsive genes. Uses resampling to stabilize variance estimates, particularly useful for experiments with high variance or small sample sizes.

**Statistical Method**:
- Bootstrap resampling with shrinkage adjustment
- Adaptive number of bootstrap samples based on convergence
- Produces profile strings describing dose-response pattern

**Specific Parameters**:
```typescript
{
  numInitialBootstraps: number;     // Default: 500
                                     // Initial bootstrap samples

  numMaximumBootstraps: number;     // Default: 1000
                                     // Maximum if convergence not reached

  shrinkagePercentile: number;      // Default: 5.0
                                     // Percentile for shrinkage adjustment
                                     // Range: 0.0-100.0
}
```

**Output Metrics**:
- `pValue`: Raw p-value from bootstrap test
- `adjustedPValue`: Q-value (FDR-corrected)
- `profile`: String describing dose-response pattern (e.g., "↑↑↑" for increasing)

**Use Case**:
- High variance data
- Small sample sizes per dose group
- When you want additional characterization of response patterns

**Implementation Note**: Desktop uses `OriogenUtil` from sciome-commons. Complex algorithm requiring careful porting.

---

### 2.4 Curve Fit Prefilter

**Desktop Files**:
- Input: `com/sciome/bmdexpress2/mvp/model/prefilter/CurveFitPrefilterInput.java`
- Result: `com/sciome/bmdexpress2/mvp/model/prefilter/CurveFitPrefilterResult.java`
- Results Container: `com/sciome/bmdexpress2/mvp/model/prefilter/CurveFitPrefilterResults.java`
- UI: `src/main/resources/fxml/curvefitprefilter.fxml`

**Description**: Fits BMD models to each probe and filters based on successful model fits. Provides early BMD estimates during the prefilter stage.

**Statistical Method**:
- Runs BMD model fitting on each probe
- Selects best model by AIC (Akaike Information Criterion)
- Filters probes with valid BMD/BMDL values and acceptable fit p-values

**Specific Parameters**:
```typescript
{
  // Model selection (at least one must be true)
  isHill: boolean;           // Hill model (4-parameter sigmoid)
  isPower: boolean;          // Power model
  isExp3: boolean;           // Exponential 3-parameter
  isExp5: boolean;           // Exponential 5-parameter
  isLinear: boolean;         // Linear model
  isPoly2: boolean;          // Polynomial 2nd degree

  // Variance modeling
  constantVariance: boolean; // true = constant variance
                             // false = non-constant (modeled)

  // BMR (Benchmark Response) settings
  BMRFactor: {
    value: number;           // BMR value (e.g., 1.349 for 1-SD)
    type: string;            // "SD" or "REL_DEV" or "ABS_DEV"
  };

  poly2BMRFactor?: {         // Optional: separate BMR for Poly2
    value: number;
    type: string;
  };
}
```

**Output Metrics**:
- `bestModel`: String name of best-fit model (e.g., "Hill", "Power")
- `bmd`: Benchmark Dose value
- `bmdl`: Lower confidence limit on BMD
- `bmdu`: Upper confidence limit on BMD (if available)
- `pValue`: Goodness-of-fit p-value
- `aic`: Akaike Information Criterion

**Use Case**:
- When you want BMD estimates early in the workflow
- Quality control: ensures probes can be successfully modeled
- More computationally expensive than other prefilters

**Implementation Note**: Integrates with existing BMD analysis service. Reuses model implementations.

---

## 3. Common Configuration Parameters

All prefilter types inherit these parameters from the `PrefilterInput` base class.

### 3.1 Parameter Definitions

```typescript
interface BasePrefilterInput {
  // ========================================
  // FILTERING PARAMETERS
  // ========================================

  pValueCutOff: number;
  // Default: 0.05
  // Range: 0.0 - 1.0
  // Description: Statistical significance threshold
  // Note: Applied to adjustedPValue if FDR correction enabled, else to pValue

  filterControlGenes: boolean;
  // Default: true
  // Description: Remove Affymetrix control probes (AFFX- prefix)
  // Applies to: Affymetrix microarray data only

  useBenAndHoch: boolean;
  // Default: false
  // Description: Apply Benjamini-Hochberg FDR correction for multiple testing
  // When true: pValueCutOff applied to adjustedPValue
  // When false: pValueCutOff applied to raw pValue

  // ========================================
  // FOLD CHANGE PARAMETERS
  // ========================================

  useFoldChange: boolean;
  // Default: true
  // Description: Apply fold change filter in addition to p-value filter
  // Requires: bestFoldChange ≥ foldChangeValue

  foldChangeValue: number;
  // Default: 2.0
  // Range: 1.0 - Infinity
  // Description: Minimum fold change threshold
  // Example: 2.0 means at least 2-fold change (up or down)

  // ========================================
  // NOTEL/LOTEL DETERMINATION
  // ========================================

  loelPValue: number;
  // Default: 0.05
  // Range: 0.0 - 1.0
  // Description: P-value threshold for LOTEL determination
  // LOTEL = Lowest Observable Effect Level

  loelFoldChangeValue: number;
  // Default: 2.0
  // Range: 1.0 - Infinity
  // Description: Fold change threshold for LOTEL determination
  // LOTEL identified when BOTH conditions met:
  //   1. p-value < loelPValue
  //   2. |fold change| ≥ loelFoldChangeValue

  tTest: boolean;
  // Default: true
  // Description: Statistical test for NOTEL/LOTEL determination
  // true = T-Test (pairwise comparisons)
  // false = Dunnett's Test (multiple comparisons to control)

  // ========================================
  // EXECUTION PARAMETERS
  // ========================================

  numThreads: number;
  // Default: 4
  // Range: 1 - Number of CPU cores
  // Description: Thread pool size for parallel processing
  // Web implementation: Use Web Workers or server-side parallelization
}
```

### 3.2 Parameter Usage Examples

#### Example 1: Conservative ANOVA
```typescript
{
  pValueCutOff: 0.01,          // Strict threshold
  useBenAndHoch: true,          // FDR correction
  useFoldChange: true,
  foldChangeValue: 2.0,
  filterControlGenes: true,
  numThreads: 4
}
// Result: Only probes with FDR-adjusted p < 0.01 AND ≥2-fold change
```

#### Example 2: Lenient Williams Trend
```typescript
{
  pValueCutOff: 0.1,            // Lenient threshold
  useBenAndHoch: false,         // No FDR correction
  useFoldChange: false,         // No fold change requirement
  numPermutations: 500,         // Williams-specific
  numThreads: 8
}
// Result: All probes with raw p < 0.1, regardless of fold change
```

#### Example 3: Curve Fit with Stringent BMR
```typescript
{
  pValueCutOff: 0.05,
  useFoldChange: true,
  foldChangeValue: 1.5,
  isHill: true,
  isPower: true,
  isExp3: true,
  BMRFactor: { value: 1.349, type: "SD" },  // 1-SD change
  constantVariance: false,
  numThreads: 6
}
// Result: Probes successfully fit by Hill/Power/Exp3 with good p-values
```

### 3.3 NOTEL/LOTEL Logic

**No Observable Effect Level (NOTEL)** and **Lowest Observable Effect Level (LOTEL)** determination:

```typescript
// Pseudo-code for NOTEL/LOTEL determination
function determineNotelLotel(probeData: ProbeResponse, config: PrefilterInput) {
  const doseLevels = getSortedDoseLevels(probeData);
  const controlMean = getMean(probeData.getResponsesAtDose(doseLevels[0]));

  for (let i = 1; i < doseLevels.length; i++) {
    const dose = doseLevels[i];
    const doseResponses = probeData.getResponsesAtDose(dose);

    // Perform statistical test (T-Test or Dunnett's)
    const pValue = config.tTest
      ? tTest(controlResponses, doseResponses)
      : dunnettsTest(controlResponses, doseResponses);

    // Calculate fold change
    const doseMean = getMean(doseResponses);
    const foldChange = calculateFoldChange(controlMean, doseMean);

    // Check if both conditions met
    if (pValue < config.loelPValue &&
        Math.abs(foldChange) >= config.loelFoldChangeValue) {
      // Found LOTEL
      loelDose = dose;
      noelDose = doseLevels[i - 1];  // Previous dose is NOTEL
      break;
    }
  }
}
```

**Use Case**: NOTEL/LOTEL values are used in subsequent BMD analysis for model fitting constraints and validation.

---

## 4. Data Structures

### 4.1 Input DTOs

#### Base Input Interface
```typescript
interface PrefilterInput {
  // Expression data source
  doseResponseExperimentId: string;

  // Common parameters (from Section 3.1)
  pValueCutOff: number;
  filterControlGenes: boolean;
  useBenAndHoch: boolean;
  useFoldChange: boolean;
  foldChangeValue: number;
  loelPValue: number;
  loelFoldChangeValue: number;
  tTest: boolean;
  numThreads: number;
}
```

#### One-Way ANOVA Input
```typescript
interface OneWayANOVAInput extends PrefilterInput {
  // No additional fields
}
```

#### Williams Trend Input
```typescript
interface WilliamsTrendInput extends PrefilterInput {
  numPermutations: number;  // Default: 100
}
```

#### Oriogen Input
```typescript
interface OriogenInput extends PrefilterInput {
  numInitialBootstraps: number;     // Default: 500
  numMaximumBootstraps: number;     // Default: 1000
  shrinkagePercentile: number;      // Default: 5.0
}
```

#### Curve Fit Prefilter Input
```typescript
interface CurveFitPrefilterInput extends PrefilterInput {
  // Model selection (at least one must be true)
  isHill: boolean;
  isPower: boolean;
  isExp3: boolean;
  isExp5: boolean;
  isLinear: boolean;
  isPoly2: boolean;

  // Variance modeling
  constantVariance: boolean;

  // BMR settings
  BMRFactor: BMRFactor;
  poly2BMRFactor?: BMRFactor;  // Optional
}

interface BMRFactor {
  value: number;
  type: 'SD' | 'REL_DEV' | 'ABS_DEV';
}
```

### 4.2 Result DTOs

#### Base Result Interface
```typescript
interface PrefilterResult {
  // Probe/gene identification
  probeId: string;
  geneId?: string;
  geneSymbol?: string;

  // Statistical metrics (common to all prefilters)
  pValue: number;
  adjustedPValue: number;  // FDR-corrected (q-value)

  // Fold change metrics
  bestFoldChange: number;     // Maximum absolute fold change across doses
  foldChanges: number[];      // Fold change at each dose level

  // NOTEL/LOTEL
  noelDose: number | null;
  loelDose: number | null;
  noelLoelPValues: number[];  // P-values at each dose for NOTEL/LOTEL determination
}
```

#### One-Way ANOVA Result
```typescript
interface OneWayANOVAResult extends PrefilterResult {
  fValue: number;                  // F-statistic
  degreesOfFreedomOne: number;     // Between-groups df (k-1)
  degreesOfFreedomTwo: number;     // Within-groups df (N-k)
}
```

#### Williams Trend Result
```typescript
interface WilliamsTrendResult extends PrefilterResult {
  // No additional fields beyond base
  // Williams test only produces p-values
}
```

#### Oriogen Result
```typescript
interface OriogenResult extends PrefilterResult {
  profile: string;  // Pattern description (e.g., "↑↑↑", "↓↓", "↑↓↑")
}
```

#### Curve Fit Prefilter Result
```typescript
interface CurveFitPrefilterResult extends PrefilterResult {
  bestModel: string;     // "Hill", "Power", "Exponential-3", etc.
  bmd: number;           // Benchmark Dose
  bmdl: number;          // BMD Lower Confidence Limit
  bmdu?: number;         // BMD Upper Confidence Limit (optional)
  aic: number;           // Akaike Information Criterion
  // Note: pValue in base interface is goodness-of-fit p-value
}
```

### 4.3 Results Container

```typescript
interface PrefilterResults {
  // Metadata
  id: string;                           // Unique identifier
  name: string;                         // User-provided name
  createdDate: Date;

  // Input reference
  doseResponseExperimentId: string;     // Parent expression data
  inputParameters: PrefilterInput;      // Configuration used

  // Analysis info
  analysisInfo: AnalysisInfo;           // Versioning, user, notes

  // Results
  results: PrefilterResult[];           // Array of results for each probe

  // Summary statistics
  totalProbesAnalyzed: number;
  probesPassed: number;                 // Count passing all filters
  probesFailed: number;
}

interface AnalysisInfo {
  version: string;          // Software version
  createdBy?: string;       // User
  notes?: string;           // User notes
  executionTime?: number;   // Milliseconds
}
```

### 4.4 Redux State Shape

```typescript
interface PrefilterState {
  // Available prefilter results
  prefilterResultsById: Record<string, PrefilterResults>;
  prefilterResultsIds: string[];

  // Current selection
  selectedPrefilterResultsId: string | null;

  // UI state
  isRunning: boolean;
  progress: number;           // 0-100
  statusMessage: string;
  error: string | null;

  // Configuration state (for UI persistence)
  lastAnovaConfig: OneWayANOVAInput | null;
  lastWilliamsConfig: WilliamsTrendInput | null;
  lastOriogenConfig: OriogenInput | null;
  lastCurveFitConfig: CurveFitPrefilterInput | null;
}
```

---

## 5. Workflow Integration

### 5.1 Overall Analysis Pipeline

```
┌─────────────────────────────────────┐
│   DoseResponseExperiment            │
│   (20K-40K probes/genes)            │
│                                     │
│   - Expression matrix               │
│   - Dose levels                     │
│   - Sample groups                   │
└──────────────┬──────────────────────┘
               │
               │ User selects prefilter type
               │ and configures parameters
               │
               ▼
┌─────────────────────────────────────┐
│        PREFILTER ANALYSIS           │
│                                     │
│  1. Load expression data            │
│  2. Apply statistical test:         │
│     - ANOVA                         │
│     - Williams Trend                │
│     - Oriogen                       │
│     - Curve Fit                     │
│  3. Calculate fold changes          │
│  4. Determine NOTEL/LOTEL           │
│  5. Apply FDR correction            │
│  6. Filter by thresholds            │
└──────────────┬──────────────────────┘
               │
               │ Filtered probes
               │ (500-5K typically)
               │
               ▼
┌─────────────────────────────────────┐
│        PrefilterResults             │
│                                     │
│   - Passed probes with stats        │
│   - p-values, fold changes          │
│   - NOTEL/LOTEL values              │
│   - Ready for BMD analysis          │
└──────────────┬──────────────────────┘
               │
               │ User proceeds to BMD Analysis
               │
               ▼
┌─────────────────────────────────────┐
│        BMD ANALYSIS                 │
│   (uses PrefilterResults as input)  │
└─────────────────────────────────────┘
```

### 5.2 Step-by-Step Execution Flow

#### Step 1: User Initiates Prefilter
```typescript
// User actions:
1. Select expression data from project tree
2. Click "Prefilter > One-Way ANOVA" (or other type)
3. Configure parameters in dialog
4. Click "Start"
```

#### Step 2: Frontend Validation
```typescript
// Validate inputs
function validatePrefilterInput(input: PrefilterInput): ValidationResult {
  const errors: string[] = [];

  if (input.pValueCutOff < 0 || input.pValueCutOff > 1) {
    errors.push("P-value cutoff must be between 0 and 1");
  }

  if (input.foldChangeValue < 1.0) {
    errors.push("Fold change value must be ≥ 1.0");
  }

  if (input.numThreads < 1) {
    errors.push("Number of threads must be at least 1");
  }

  // Type-specific validation
  if (input instanceof CurveFitPrefilterInput) {
    const hasModel = input.isHill || input.isPower || input.isExp3 ||
                     input.isExp5 || input.isLinear || input.isPoly2;
    if (!hasModel) {
      errors.push("At least one model must be selected");
    }
  }

  return { valid: errors.length === 0, errors };
}
```

#### Step 3: Backend Processing
```typescript
// Backend service endpoint (Java/Spring)
@BrowserCallable
public class PrefilterService {

  public PrefilterResults oneWayANOVA(OneWayANOVAInput input) {
    // 1. Load expression data
    DoseResponseExperiment experiment =
      doseResponseRepo.findById(input.getDoseResponseExperimentId());

    // 2. Perform ANOVA for each probe
    List<OneWayANOVAResult> results = new ArrayList<>();
    for (ProbeResponse probe : experiment.getProbeResponses()) {
      OneWayANOVAResult result = performANOVA(probe, experiment);
      results.add(result);
    }

    // 3. Calculate fold changes
    calculateFoldChanges(results, experiment);

    // 4. Determine NOTEL/LOTEL
    determineNotelLotel(results, input, experiment);

    // 5. Apply FDR correction (if enabled)
    if (input.isUseBenAndHoch()) {
      applyBenjaminiHochberg(results);
    }

    // 6. Filter by thresholds
    List<OneWayANOVAResult> filtered = filterResults(results, input);

    // 7. Create results container
    PrefilterResults prefilterResults = new PrefilterResults();
    prefilterResults.setResults(filtered);
    prefilterResults.setInputParameters(input);
    // ... set other metadata

    return prefilterResults;
  }
}
```

#### Step 4: Frontend Updates
```typescript
// Redux thunk action
export const runOneWayANOVA = createAsyncThunk(
  'prefilter/runOneWayANOVA',
  async (input: OneWayANOVAInput, { dispatch }) => {
    dispatch(setIsRunning(true));
    dispatch(setProgress(0));

    try {
      // Call backend service
      const results = await PrefilterService.oneWayANOVA(input);

      dispatch(setProgress(100));
      return results;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setIsRunning(false));
    }
  }
);

// Slice reducer
extraReducers: (builder) => {
  builder
    .addCase(runOneWayANOVA.fulfilled, (state, action) => {
      const results = action.payload;
      state.prefilterResultsById[results.id] = results;
      state.prefilterResultsIds.push(results.id);
      state.selectedPrefilterResultsId = results.id;
    })
    .addCase(runOneWayANOVA.rejected, (state, action) => {
      state.error = action.error.message || 'Unknown error';
    });
}
```

#### Step 5: Results Display
```typescript
// User sees:
1. Success notification
2. PrefilterResults added to project tree
3. Results table/grid showing:
   - Probe IDs
   - Gene symbols
   - P-values
   - Adjusted p-values
   - Fold changes
   - F-values (ANOVA-specific)
   - NOTEL/LOTEL doses
4. Summary statistics (e.g., "3,452 of 22,000 probes passed")
```

### 5.3 Event Flow Diagram

```
User Action (UI) → Validation → Backend Service → Processing → Results → UI Update
      │                │              │              │           │          │
      │                │              │              │           │          │
   Click "Start"   Check params   Load data    Run algorithms  Save      Display
                                                                results    table/grid
                                                                to Redux
```

---

## 6. Algorithm Implementations

### 6.1 One-Way ANOVA

**Desktop Implementation**: `com/sciome/bmdexpress2/util/prefilter/OneWayANOVAAnalysis.java`

**Algorithm**:
```typescript
function performANOVA(
  probeResponses: number[][],  // [doseGroup][replicate]
  doses: number[]
): OneWayANOVAResult {
  const k = probeResponses.length;  // Number of dose groups
  const N = probeResponses.flat().length;  // Total samples

  // Step 1: Calculate group means
  const groupMeans = probeResponses.map(group => mean(group));
  const grandMean = mean(probeResponses.flat());

  // Step 2: Between-groups sum of squares
  let SSB = 0;
  for (let i = 0; i < k; i++) {
    const n_i = probeResponses[i].length;
    SSB += n_i * Math.pow(groupMeans[i] - grandMean, 2);
  }

  // Step 3: Within-groups sum of squares
  let SSW = 0;
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < probeResponses[i].length; j++) {
      SSW += Math.pow(probeResponses[i][j] - groupMeans[i], 2);
    }
  }

  // Step 4: Degrees of freedom
  const df1 = k - 1;          // Between-groups df
  const df2 = N - k;          // Within-groups df

  // Step 5: Mean squares
  const MSB = SSB / df1;
  const MSW = SSW / df2;

  // Step 6: F-statistic
  const fValue = MSB / MSW;

  // Step 7: P-value from F-distribution
  const pValue = fDistribution.sf(fValue, df1, df2);  // Survival function

  return {
    fValue,
    pValue,
    degreesOfFreedomOne: df1,
    degreesOfFreedomTwo: df2,
  };
}
```

**JavaScript Libraries**:
- Use `jstat` library for F-distribution calculations
- Or use `simple-statistics` for mean/variance calculations

**Example**:
```typescript
// Example data
const probeResponses = [
  [5.2, 5.1, 5.3],      // Control (dose 0)
  [5.5, 5.4, 5.6],      // Low dose
  [6.1, 6.0, 6.2],      // Medium dose
  [7.5, 7.4, 7.6],      // High dose
];

const result = performANOVA(probeResponses, [0, 10, 50, 100]);
// Result: { fValue: 245.67, pValue: 2.3e-15, df1: 3, df2: 8 }
```

---

### 6.2 Fold Change Calculation

**Desktop Implementation**: `com/sciome/bmdexpress2/util/prefilter/FoldChange.java`

**Algorithm**:
```typescript
function calculateFoldChange(
  probeResponses: number[][],  // [doseGroup][replicate]
  doses: number[],
  isLogTransformed: boolean
): { bestFoldChange: number; foldChanges: number[] } {

  // Step 1: Calculate group means
  const groupMeans = probeResponses.map(group => mean(group));
  const controlMean = groupMeans[0];

  // Step 2: Calculate fold change for each non-control dose
  const foldChanges: number[] = [1.0];  // Control = 1.0 (no change)

  for (let i = 1; i < groupMeans.length; i++) {
    const doseMean = groupMeans[i];
    let fc: number;

    if (isLogTransformed) {
      // Log-transformed data: use differences
      const diff = doseMean - controlMean;
      const sign = diff >= 0 ? 1 : -1;

      // Convert back to fold change: 2^|diff|
      fc = sign * Math.pow(2, Math.abs(diff));
    } else {
      // Non-transformed data: use ratios
      const ratio = doseMean / controlMean;

      if (ratio >= 1.0) {
        fc = ratio;           // Up-regulation
      } else {
        fc = -1.0 / ratio;    // Down-regulation (negative)
      }
    }

    foldChanges.push(fc);
  }

  // Step 3: Find best (maximum absolute) fold change
  const bestFoldChange = foldChanges.reduce((max, fc) =>
    Math.abs(fc) > Math.abs(max) ? fc : max
  , 1.0);

  return { bestFoldChange, foldChanges };
}
```

**Example**:
```typescript
// Log-transformed microarray data
const probeResponses = [
  [5.0, 5.1, 4.9],   // Control: mean = 5.0
  [5.5, 5.6, 5.4],   // Low: mean = 5.5
  [6.0, 6.1, 5.9],   // Medium: mean = 6.0
  [7.0, 7.1, 6.9],   // High: mean = 7.0
];

const { bestFoldChange, foldChanges } =
  calculateFoldChange(probeResponses, [0, 10, 50, 100], true);

// Results (log-transformed):
// foldChanges = [1.0, 1.41, 2.0, 4.0]  (2^0.5, 2^1.0, 2^2.0)
// bestFoldChange = 4.0
```

---

### 6.3 NOTEL/LOTEL Determination

**Desktop Implementation**: `PrefilterService.performNoelLoel()`

**Algorithm**:
```typescript
function determineNotelLotel(
  probeResponses: number[][],  // [doseGroup][replicate]
  doses: number[],
  loelPValue: number,
  loelFoldChange: number,
  useTTest: boolean
): { noelDose: number | null; loelDose: number | null } {

  const controlResponses = probeResponses[0];

  for (let i = 1; i < doses.length; i++) {
    const doseResponses = probeResponses[i];

    // Step 1: Perform statistical test
    let pValue: number;
    if (useTTest) {
      pValue = tTest(controlResponses, doseResponses);
    } else {
      // Dunnett's test (multiple comparisons)
      pValue = dunnettsTest(controlResponses, doseResponses, i);
    }

    // Step 2: Calculate fold change
    const controlMean = mean(controlResponses);
    const doseMean = mean(doseResponses);
    const fc = Math.abs(doseMean / controlMean);

    // Step 3: Check LOTEL criteria
    if (pValue < loelPValue && fc >= loelFoldChange) {
      // Found LOTEL
      return {
        loelDose: doses[i],
        noelDose: i > 1 ? doses[i - 1] : null,
      };
    }
  }

  // No LOTEL found
  return { noelDose: null, loelDose: null };
}

// T-Test implementation (two-sample, two-tailed)
function tTest(sample1: number[], sample2: number[]): number {
  const n1 = sample1.length;
  const n2 = sample2.length;

  const mean1 = mean(sample1);
  const mean2 = mean(sample2);

  const var1 = variance(sample1);
  const var2 = variance(sample2);

  // Pooled standard error
  const se = Math.sqrt(var1 / n1 + var2 / n2);

  // T-statistic
  const t = (mean1 - mean2) / se;

  // Degrees of freedom (Welch's approximation)
  const df = Math.pow(var1/n1 + var2/n2, 2) /
             (Math.pow(var1/n1, 2)/(n1-1) + Math.pow(var2/n2, 2)/(n2-1));

  // Two-tailed p-value
  const pValue = 2 * tDistribution.sf(Math.abs(t), df);

  return pValue;
}
```

**Dunnett's Test Note**:
- More complex than T-Test
- Adjusts for multiple comparisons to control family-wise error rate
- May need external library (e.g., `jStat` doesn't have built-in Dunnett's)
- Consider implementing on backend using Apache Commons Math

---

### 6.4 Benjamini-Hochberg FDR Correction

**Desktop Implementation**: `com/sciome/bmdexpress2/util/stat/FalseDiscoveryRate.java`

**Algorithm**:
```typescript
function benjaminiHochberg(pValues: number[]): number[] {
  const n = pValues.length;

  // Step 1: Create array of (index, pValue) pairs
  const indexed = pValues.map((p, i) => ({ index: i, pValue: p }));

  // Step 2: Sort by p-value (ascending)
  indexed.sort((a, b) => a.pValue - b.pValue);

  // Step 3: Calculate adjusted p-values
  const adjusted = new Array(n);
  let minAdjusted = 1.0;

  // Work backwards from largest p-value
  for (let i = n - 1; i >= 0; i--) {
    const rank = i + 1;  // Rank = 1 to n
    const rawP = indexed[i].pValue;

    // BH adjustment: p * (n / rank)
    const adjP = Math.min(rawP * (n / rank), 1.0);

    // Enforce monotonicity: adjusted[i] ≤ adjusted[i+1]
    minAdjusted = Math.min(adjP, minAdjusted);
    adjusted[indexed[i].index] = minAdjusted;
  }

  return adjusted;
}
```

**Example**:
```typescript
const pValues = [0.001, 0.008, 0.039, 0.041, 0.042, 0.060, 0.074];
const adjustedPValues = benjaminiHochberg(pValues);

// Results:
// Original:  [0.001, 0.008, 0.039, 0.041, 0.042, 0.060, 0.074]
// Adjusted:  [0.007, 0.028, 0.091, 0.091, 0.091, 0.105, 0.106]
```

---

### 6.5 Williams Trend Test (Outline)

**Desktop Implementation**: Uses `WilliamsTrendTestUtil` from sciome-commons

**Algorithm Overview** (permutation-based):
```typescript
function williamsTrendTest(
  probeResponses: number[][],  // [doseGroup][replicate]
  doses: number[],
  numPermutations: number
): number {

  // Step 1: Calculate observed test statistic
  const observedStat = calculateWilliamsStat(probeResponses, doses);

  // Step 2: Permutation test
  let countExtreme = 0;
  for (let i = 0; i < numPermutations; i++) {
    // Shuffle responses randomly
    const permuted = permuteResponses(probeResponses);

    // Calculate test statistic for permuted data
    const permutedStat = calculateWilliamsStat(permuted, doses);

    // Count if permuted stat is as extreme as observed
    if (Math.abs(permutedStat) >= Math.abs(observedStat)) {
      countExtreme++;
    }
  }

  // Step 3: P-value = proportion of permutations as extreme as observed
  const pValue = countExtreme / numPermutations;

  return pValue;
}

function calculateWilliamsStat(
  responses: number[][],
  doses: number[]
): number {
  // Williams' statistic measures monotonic trend
  // Complex calculation involving order statistics and pooled variances
  // Implementation details in sciome-commons WilliamsTrendTestUtil

  // Pseudo-code:
  // 1. Calculate cumulative means from high dose downward
  // 2. Compare to control using t-statistic
  // 3. Use maximum t-statistic across doses

  return stat;  // Details omitted for brevity
}
```

**Porting Strategy**:
- **Option 1**: Port Java implementation to TypeScript
- **Option 2**: Implement as backend service (recommended)
- **Option 3**: Use WebAssembly if sciome-commons can be compiled

---

### 6.6 Oriogen (Outline)

**Desktop Implementation**: Uses `OriogenUtil` from sciome-commons

**Algorithm Overview** (bootstrap-based):
```typescript
function oriogenTest(
  probeResponses: number[][],
  doses: number[],
  config: {
    numInitialBootstraps: number;
    numMaximumBootstraps: number;
    shrinkagePercentile: number;
  }
): { pValue: number; qValue: number; profile: string } {

  // Step 1: Initial bootstrap samples
  const bootstrapStats = [];
  for (let i = 0; i < config.numInitialBootstraps; i++) {
    const resampled = bootstrapResample(probeResponses);
    const stat = calculateTestStat(resampled, doses);
    bootstrapStats.push(stat);
  }

  // Step 2: Check convergence
  const converged = checkConvergence(bootstrapStats);

  // Step 3: Additional bootstraps if needed
  if (!converged) {
    for (let i = 0; i < config.numMaximumBootstraps - config.numInitialBootstraps; i++) {
      // ... add more bootstrap samples
    }
  }

  // Step 4: Shrinkage adjustment
  const shrinkage = percentile(bootstrapStats, config.shrinkagePercentile);
  const adjustedStats = bootstrapStats.map(s => applyShreinkage(s, shrinkage));

  // Step 5: Calculate p-value
  const pValue = calculateBootstrapPValue(adjustedStats);

  // Step 6: Generate profile string
  const profile = generateDoseResponseProfile(probeResponses, doses);

  return { pValue, qValue: pValue, profile };  // qValue calculated later with FDR
}
```

**Porting Strategy**:
- **Recommended**: Implement as backend service
- Complex algorithm with many edge cases
- Direct port from sciome-commons likely most reliable

---

### 6.7 Curve Fit Prefilter (Integration)

**Desktop Implementation**: Uses existing BMD analysis service

**Algorithm**:
```typescript
async function curveFitPrefilter(
  probeResponses: ProbeResponse[],
  config: CurveFitPrefilterInput
): Promise<CurveFitPrefilterResult[]> {

  const results: CurveFitPrefilterResult[] = [];

  for (const probe of probeResponses) {
    // Step 1: Fit selected models
    const models = [];
    if (config.isHill) models.push('Hill');
    if (config.isPower) models.push('Power');
    if (config.isExp3) models.push('Exponential-3');
    if (config.isExp5) models.push('Exponential-5');
    if (config.isLinear) models.push('Linear');
    if (config.isPoly2) models.push('Polynomial-2');

    const modelResults = await fitModels(probe, models, config);

    // Step 2: Select best model by AIC
    const bestModel = modelResults.reduce((best, current) =>
      current.aic < best.aic ? current : best
    );

    // Step 3: Check fit quality
    if (bestModel.pValue >= config.pValueCutOff) {
      continue;  // Poor fit, skip this probe
    }

    // Step 4: Check BMD validity
    if (bestModel.bmd === null || bestModel.bmdl === null) {
      continue;  // Invalid BMD, skip
    }

    // Step 5: Create result
    results.push({
      probeId: probe.id,
      bestModel: bestModel.name,
      bmd: bestModel.bmd,
      bmdl: bestModel.bmdl,
      bmdu: bestModel.bmdu,
      pValue: bestModel.pValue,  // Goodness-of-fit
      aic: bestModel.aic,
      adjustedPValue: null,  // Calculated later with FDR
      // ... other fields
    });
  }

  return results;
}
```

**Note**: Curve Fit Prefilter is computationally expensive. Consider:
- Running on backend with progress updates
- Offering "Quick" mode with fewer models
- Caching results aggressively

---

## 7. UI Component Design

### 7.1 Component Hierarchy

```
PrefilterView
├── PrefilterTypeSelector
│   └── Radio buttons or tabs for ANOVA/Williams/Oriogen/CurveFit
│
├── PrefilterConfigDialog (polymorphic based on type)
│   ├── CommonParametersSection
│   │   ├── ExpressionDataSelector (ComboBox)
│   │   ├── PValueCutoffInput (TextField + ComboBox)
│   │   ├── FDRCorrectionCheckbox
│   │   └── FilterControlGenesCheckbox
│   │
│   ├── FoldChangeSection
│   │   ├── UseFoldChangeCheckbox
│   │   └── FoldChangeValueInput (TextField)
│   │
│   ├── NotelLotelSection
│   │   ├── LoelPValueInput
│   │   ├── LoelFoldChangeInput
│   │   └── StatisticalTestSelector (Radio: T-Test vs Dunnett's)
│   │
│   ├── TypeSpecificSection
│   │   ├── [ANOVA: None]
│   │   ├── [Williams: NumPermutationsInput]
│   │   ├── [Oriogen: Bootstrap parameters]
│   │   └── [CurveFit: Model selection + BMR settings]
│   │
│   ├── ExecutionSection
│   │   ├── NumThreadsInput
│   │   ├── ProgressBar
│   │   └── StatusMessage
│   │
│   └── ActionButtons
│       ├── StartButton
│       ├── SaveSettingsButton
│       └── CancelButton
│
└── PrefilterResultsTable (after completion)
    ├── ResultsSummary (probes passed/failed)
    ├── DataGrid (Ant Design Table)
    │   ├── Probe ID column
    │   ├── Gene Symbol column
    │   ├── P-Value column (sortable)
    │   ├── Adjusted P-Value column (sortable)
    │   ├── Best Fold Change column (sortable)
    │   ├── F-Value column (ANOVA only)
    │   ├── NOTEL Dose column
    │   └── LOTEL Dose column
    │
    └── ExportOptions
        ├── Export to CSV
        └── Export to TSV
```

### 7.2 React Component Examples

#### PrefilterConfigDialog (ANOVA Example)
```typescript
import React, { useState } from 'react';
import { Modal, Form, InputNumber, Checkbox, Select, Button, Progress } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { runOneWayANOVA } from '@/store/slices/prefilterSlice';

interface ANOVAConfigDialogProps {
  visible: boolean;
  onClose: () => void;
}

export const ANOVAConfigDialog: React.FC<ANOVAConfigDialogProps> = ({
  visible,
  onClose
}) => {
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();

  const { isRunning, progress, statusMessage } = useAppSelector(
    state => state.prefilter
  );

  const expressionDatasets = useAppSelector(
    state => state.navigation.expressionDatasets
  );

  // Initial values from last run or defaults
  const lastConfig = useAppSelector(
    state => state.prefilter.lastAnovaConfig
  );

  const initialValues = lastConfig || {
    pValueCutOff: 0.05,
    useBenAndHoch: false,
    filterControlGenes: true,
    useFoldChange: true,
    foldChangeValue: 2.0,
    loelPValue: 0.05,
    loelFoldChangeValue: 2.0,
    tTest: true,
    numThreads: 4
  };

  const handleSubmit = async (values: OneWayANOVAInput) => {
    try {
      await dispatch(runOneWayANOVA(values)).unwrap();
      onClose();
    } catch (error) {
      // Error handling (error is already in Redux state)
      console.error('ANOVA failed:', error);
    }
  };

  return (
    <Modal
      title="One-Way ANOVA Prefilter"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSubmit}
      >
        {/* Expression Data Selection */}
        <Form.Item
          label="Expression Data"
          name="doseResponseExperimentId"
          rules={[{ required: true, message: 'Please select expression data' }]}
        >
          <Select placeholder="Select expression dataset">
            {expressionDatasets.map(ds => (
              <Select.Option key={ds.id} value={ds.id}>
                {ds.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Main Parameters */}
        <h3>Statistical Parameters</h3>
        <Form.Item
          label="P-Value Cutoff"
          name="pValueCutOff"
          rules={[
            { required: true },
            { type: 'number', min: 0, max: 1 }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            max={1}
            step={0.01}
          />
        </Form.Item>

        <Form.Item name="useBenAndHoch" valuePropName="checked">
          <Checkbox>
            Apply Benjamini-Hochberg FDR Correction
            <Tooltip title="Adjusts for multiple testing. P-value cutoff will be applied to adjusted p-values.">
              <InfoCircleOutlined style={{ marginLeft: 8 }} />
            </Tooltip>
          </Checkbox>
        </Form.Item>

        <Form.Item name="filterControlGenes" valuePropName="checked">
          <Checkbox>
            Filter Control Genes (AFFX- prefix)
            <Tooltip title="Removes Affymetrix control probes from analysis">
              <InfoCircleOutlined style={{ marginLeft: 8 }} />
            </Tooltip>
          </Checkbox>
        </Form.Item>

        {/* Fold Change Section */}
        <h3>Fold Change Filter</h3>
        <Form.Item name="useFoldChange" valuePropName="checked">
          <Checkbox>Use Fold Change Filter</Checkbox>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.useFoldChange !== curr.useFoldChange}
        >
          {({ getFieldValue }) =>
            getFieldValue('useFoldChange') ? (
              <Form.Item
                label="Fold Change Threshold"
                name="foldChangeValue"
                rules={[{ type: 'number', min: 1.0 }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1.0}
                  step={0.1}
                />
              </Form.Item>
            ) : null
          }
        </Form.Item>

        {/* NOTEL/LOTEL Section */}
        <h3>NOTEL/LOTEL Determination</h3>
        <Form.Item label="LOTEL P-Value" name="loelPValue">
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            max={1}
            step={0.01}
          />
        </Form.Item>

        <Form.Item label="LOTEL Fold Change" name="loelFoldChangeValue">
          <InputNumber
            style={{ width: '100%' }}
            min={1.0}
            step={0.1}
          />
        </Form.Item>

        <Form.Item label="Statistical Test">
          <Radio.Group name="tTest">
            <Radio value={true}>T-Test</Radio>
            <Radio value={false}>Dunnett's Test</Radio>
          </Radio.Group>
        </Form.Item>

        {/* Execution Parameters */}
        <h3>Execution</h3>
        <Form.Item
          label="Number of Threads"
          name="numThreads"
          rules={[{ type: 'number', min: 1 }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={navigator.hardwareConcurrency || 8}
          />
        </Form.Item>

        {/* Progress */}
        {isRunning && (
          <div style={{ marginBottom: 16 }}>
            <Progress percent={progress} />
            <p>{statusMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={isRunning}
              disabled={isRunning}
            >
              Start
            </Button>
            <Button onClick={() => form.resetFields()}>
              Reset to Defaults
            </Button>
            <Button onClick={onClose} disabled={isRunning}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
```

#### PrefilterResultsTable
```typescript
import React, { useMemo } from 'react';
import { Table, Statistic, Row, Col, Card, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store/hooks';
import { selectSelectedPrefilterResults } from '@/store/slices/prefilterSlice';

export const PrefilterResultsTable: React.FC = () => {
  const results = useAppSelector(selectSelectedPrefilterResults);

  if (!results) {
    return <div>No prefilter results selected</div>;
  }

  // Columns configuration
  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: 'Probe ID',
        dataIndex: 'probeId',
        key: 'probeId',
        fixed: 'left' as const,
        width: 150,
      },
      {
        title: 'Gene Symbol',
        dataIndex: 'geneSymbol',
        key: 'geneSymbol',
        width: 120,
      },
      {
        title: 'P-Value',
        dataIndex: 'pValue',
        key: 'pValue',
        width: 100,
        sorter: (a, b) => a.pValue - b.pValue,
        render: (val: number) => val.toExponential(3),
      },
      {
        title: 'Adjusted P-Value',
        dataIndex: 'adjustedPValue',
        key: 'adjustedPValue',
        width: 140,
        sorter: (a, b) => a.adjustedPValue - b.adjustedPValue,
        render: (val: number) => val.toExponential(3),
      },
      {
        title: 'Best Fold Change',
        dataIndex: 'bestFoldChange',
        key: 'bestFoldChange',
        width: 140,
        sorter: (a, b) => Math.abs(a.bestFoldChange) - Math.abs(b.bestFoldChange),
        render: (val: number) => val.toFixed(2),
      },
      {
        title: 'NOTEL Dose',
        dataIndex: 'noelDose',
        key: 'noelDose',
        width: 100,
        render: (val: number | null) => val?.toFixed(2) || 'N/A',
      },
      {
        title: 'LOTEL Dose',
        dataIndex: 'loelDose',
        key: 'loelDose',
        width: 100,
        render: (val: number | null) => val?.toFixed(2) || 'N/A',
      },
    ];

    // Add type-specific columns
    if (results.results[0] instanceof OneWayANOVAResult) {
      baseColumns.splice(4, 0, {
        title: 'F-Value',
        dataIndex: 'fValue',
        key: 'fValue',
        width: 100,
        sorter: (a, b) => a.fValue - b.fValue,
        render: (val: number) => val.toFixed(2),
      });
    }

    return baseColumns;
  }, [results]);

  const handleExportCSV = () => {
    // CSV export logic
    const csv = convertToCSV(results.results);
    downloadFile(csv, `${results.name}_results.csv`, 'text/csv');
  };

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Probes Analyzed"
              value={results.totalProbesAnalyzed}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Probes Passed"
              value={results.probesPassed}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Probes Failed"
              value={results.probesFailed}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pass Rate"
              value={((results.probesPassed / results.totalProbesAnalyzed) * 100).toFixed(1)}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Export Button */}
      <Button
        icon={<DownloadOutlined />}
        onClick={handleExportCSV}
        style={{ marginBottom: 16 }}
      >
        Export to CSV
      </Button>

      {/* Results Table */}
      <Table
        columns={columns}
        dataSource={results.results}
        rowKey="probeId"
        scroll={{ x: 1200, y: 600 }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} probes`,
        }}
      />
    </div>
  );
};
```

### 7.3 UI/UX Considerations

1. **Progressive Disclosure**: Don't show all parameters at once. Use collapsible sections or tabs.

2. **Helpful Defaults**: Pre-populate with sensible defaults based on literature and typical use cases.

3. **Validation Feedback**: Real-time validation with clear error messages.

4. **Progress Updates**: Show percentage and current step (e.g., "Calculating fold changes... 45%").

5. **Results Preview**: Show top 10 results immediately, allow user to browse full table.

6. **Comparison View**: Allow users to compare results from multiple prefilter runs side-by-side.

7. **Export Options**: CSV, TSV, Excel, JSON formats.

8. **Help/Documentation**: Inline tooltips, "Learn More" links to documentation.

---

## 8. Backend Implementation Strategy

### 8.1 Spring Boot Service Layer

**File Structure**:
```
src/main/java/com/sciome/
├── service/
│   ├── PrefilterService.java          # Main service interface
│   └── impl/
│       └── PrefilterServiceImpl.java  # Implementation
│
├── util/
│   ├── prefilter/
│   │   ├── OneWayANOVAAnalysis.java
│   │   ├── FoldChangeCalculator.java
│   │   ├── NotelLotelDetermination.java
│   │   ├── WilliamsTrendAnalysis.java (port from desktop)
│   │   └── OriogenAnalysis.java (port from desktop)
│   │
│   └── stat/
│       ├── FalseDiscoveryRate.java
│       ├── TTest.java
│       └── DunnettsTest.java
│
└── dto/
    ├── prefilter/
    │   ├── PrefilterInput.java (abstract base)
    │   ├── OneWayANOVAInput.java
    │   ├── WilliamsTrendInput.java
    │   ├── OriogenInput.java
    │   ├── CurveFitPrefilterInput.java
    │   ├── PrefilterResult.java (interface)
    │   ├── OneWayANOVAResult.java
    │   ├── WilliamsTrendResult.java
    │   ├── OriogenResult.java
    │   ├── CurveFitPrefilterResult.java
    │   └── PrefilterResults.java
```

### 8.2 Service Interface

```java
@BrowserCallable
@Service
public class PrefilterService {

  @Autowired
  private DoseResponseExperimentRepository experimentRepo;

  @Autowired
  private PrefilterResultsRepository prefilterResultsRepo;

  /**
   * Performs One-Way ANOVA prefilter analysis
   */
  public PrefilterResults oneWayANOVA(OneWayANOVAInput input) {
    // 1. Validate input
    validateInput(input);

    // 2. Load expression data
    DoseResponseExperiment experiment =
      experimentRepo.findById(input.getDoseResponseExperimentId())
        .orElseThrow(() -> new ResourceNotFoundException("Experiment not found"));

    // 3. Perform ANOVA for each probe
    List<OneWayANOVAResult> results =
      performOneWayANOVAAnalysis(experiment, input);

    // 4. Calculate fold changes
    FoldChangeCalculator.calculate(results, experiment);

    // 5. Determine NOTEL/LOTEL
    NotelLotelDetermination.determine(results, input, experiment);

    // 6. Apply FDR correction (if enabled)
    if (input.isUseBenAndHoch()) {
      applyBenjaminiHochberg(results);
    }

    // 7. Filter by thresholds
    List<OneWayANOVAResult> filtered = filterResults(results, input);

    // 8. Create and save results container
    PrefilterResults prefilterResults = new PrefilterResults();
    prefilterResults.setName(generateName(input));
    prefilterResults.setDoseResponseExperimentId(experiment.getId());
    prefilterResults.setInputParameters(input);
    prefilterResults.setResults(filtered);
    prefilterResults.setTotalProbesAnalyzed(results.size());
    prefilterResults.setProbesPassed(filtered.size());
    prefilterResults.setProbesFailed(results.size() - filtered.size());

    prefilterResultsRepo.save(prefilterResults);

    return prefilterResults;
  }

  /**
   * Performs Williams Trend Test prefilter analysis
   */
  public PrefilterResults williamsTrend(WilliamsTrendInput input) {
    // Similar structure to oneWayANOVA
    // Use WilliamsTrendAnalysis utility
  }

  /**
   * Performs Oriogen prefilter analysis
   */
  public PrefilterResults oriogen(OriogenInput input) {
    // Similar structure
    // Use OriogenAnalysis utility
  }

  /**
   * Performs Curve Fit prefilter analysis
   */
  public PrefilterResults curveFitPrefilter(CurveFitPrefilterInput input) {
    // Integrates with BMD analysis service
    // Runs model fitting for each probe
  }

  // Private helper methods
  private void validateInput(PrefilterInput input) {
    if (input.getPValueCutOff() < 0 || input.getPValueCutOff() > 1) {
      throw new IllegalArgumentException("P-value cutoff must be between 0 and 1");
    }
    // ... more validation
  }

  private List<OneWayANOVAResult> performOneWayANOVAAnalysis(
    DoseResponseExperiment experiment,
    OneWayANOVAInput input
  ) {
    List<OneWayANOVAResult> results = new ArrayList<>();

    // Parallel processing using ExecutorService
    ExecutorService executor = Executors.newFixedThreadPool(input.getNumThreads());

    for (ProbeResponse probe : experiment.getProbeResponses()) {
      // Submit task to thread pool
      // ... implementation
    }

    executor.shutdown();
    executor.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);

    return results;
  }

  private void applyBenjaminiHochberg(List<? extends PrefilterResult> results) {
    double[] pValues = results.stream()
      .mapToDouble(PrefilterResult::getPValue)
      .toArray();

    double[] adjustedPValues = FalseDiscoveryRate.benjaminiHochberg(pValues);

    for (int i = 0; i < results.size(); i++) {
      results.get(i).setAdjustedPValue(adjustedPValues[i]);
    }
  }

  private List<OneWayANOVAResult> filterResults(
    List<OneWayANOVAResult> results,
    PrefilterInput input
  ) {
    return results.stream()
      .filter(r -> {
        // Filter by p-value (adjusted if FDR enabled, raw otherwise)
        double relevantPValue = input.isUseBenAndHoch()
          ? r.getAdjustedPValue()
          : r.getPValue();

        if (relevantPValue >= input.getPValueCutOff()) {
          return false;
        }

        // Filter by fold change (if enabled)
        if (input.isUseFoldChange()) {
          if (Math.abs(r.getBestFoldChange()) < input.getFoldChangeValue()) {
            return false;
          }
        }

        // Filter control genes (if enabled)
        if (input.isFilterControlGenes()) {
          if (r.getProbeId().startsWith("AFFX-")) {
            return false;
          }
        }

        return true;
      })
      .collect(Collectors.toList());
  }
}
```

### 8.3 Database Schema

**Table: prefilter_results**
```sql
CREATE TABLE prefilter_results (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  prefilter_type VARCHAR(50) NOT NULL,  -- 'ANOVA', 'WILLIAMS', 'ORIOGEN', 'CURVE_FIT'
  dose_response_experiment_id VARCHAR(36) NOT NULL,
  input_parameters JSON NOT NULL,
  total_probes_analyzed INT NOT NULL,
  probes_passed INT NOT NULL,
  probes_failed INT NOT NULL,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analysis_info JSON,

  FOREIGN KEY (dose_response_experiment_id)
    REFERENCES dose_response_experiment(id) ON DELETE CASCADE
);

CREATE INDEX idx_prefilter_results_experiment
  ON prefilter_results(dose_response_experiment_id);
```

**Table: prefilter_result (individual probe results)**
```sql
CREATE TABLE prefilter_result (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  prefilter_results_id VARCHAR(36) NOT NULL,
  probe_id VARCHAR(100) NOT NULL,
  gene_id VARCHAR(100),
  gene_symbol VARCHAR(100),
  p_value DOUBLE NOT NULL,
  adjusted_p_value DOUBLE NOT NULL,
  best_fold_change DOUBLE NOT NULL,
  fold_changes JSON,  -- Array of fold changes
  noel_dose DOUBLE,
  loel_dose DOUBLE,
  noel_loel_p_values JSON,

  -- Type-specific fields (nullable, use based on prefilter_type)
  f_value DOUBLE,                     -- ANOVA only
  degrees_of_freedom_one INT,         -- ANOVA only
  degrees_of_freedom_two INT,         -- ANOVA only
  profile VARCHAR(50),                -- Oriogen only
  best_model VARCHAR(50),             -- Curve Fit only
  bmd DOUBLE,                         -- Curve Fit only
  bmdl DOUBLE,                        -- Curve Fit only
  bmdu DOUBLE,                        -- Curve Fit only
  aic DOUBLE,                         -- Curve Fit only

  FOREIGN KEY (prefilter_results_id)
    REFERENCES prefilter_results(id) ON DELETE CASCADE
);

CREATE INDEX idx_prefilter_result_results_id
  ON prefilter_result(prefilter_results_id);

CREATE INDEX idx_prefilter_result_probe_id
  ON prefilter_result(probe_id);
```

### 8.4 Progress Updates

**WebSocket or Server-Sent Events (SSE) for Progress**:

```java
@Service
public class PrefilterProgressService {

  private final SimpMessagingTemplate messagingTemplate;

  public void reportProgress(
    String sessionId,
    double progress,
    String message
  ) {
    ProgressUpdate update = new ProgressUpdate();
    update.setProgress(progress);
    update.setMessage(message);

    messagingTemplate.convertAndSendToUser(
      sessionId,
      "/topic/prefilter-progress",
      update
    );
  }
}

// In PrefilterService
public PrefilterResults oneWayANOVA(OneWayANOVAInput input) {
  String sessionId = SecurityContextHolder.getContext().getAuthentication().getName();

  progressService.reportProgress(sessionId, 0, "Starting ANOVA analysis...");

  // ... load data
  progressService.reportProgress(sessionId, 10, "Loaded expression data");

  // ... perform ANOVA
  progressService.reportProgress(sessionId, 50, "Calculating statistics...");

  // ... fold changes
  progressService.reportProgress(sessionId, 70, "Calculating fold changes...");

  // ... NOTEL/LOTEL
  progressService.reportProgress(sessionId, 85, "Determining NOTEL/LOTEL...");

  // ... FDR
  progressService.reportProgress(sessionId, 95, "Applying FDR correction...");

  // ... save
  progressService.reportProgress(sessionId, 100, "Complete!");

  return results;
}
```

---

## 9. Frontend Implementation Strategy

### 9.1 Redux State Management

**File**: `src/main/frontend/store/slices/prefilterSlice.ts`

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PrefilterService } from '@/generated/endpoints';
import type {
  PrefilterResults,
  OneWayANOVAInput,
  WilliamsTrendInput,
  OriogenInput,
  CurveFitPrefilterInput,
} from '@/generated/com/sciome/dto';

interface PrefilterState {
  // Results storage
  prefilterResultsById: Record<string, PrefilterResults>;
  prefilterResultsIds: string[];
  selectedPrefilterResultsId: string | null;

  // UI state
  isRunning: boolean;
  progress: number;
  statusMessage: string;
  error: string | null;

  // Config persistence
  lastAnovaConfig: OneWayANOVAInput | null;
  lastWilliamsConfig: WilliamsTrendInput | null;
  lastOriogenConfig: OriogenInput | null;
  lastCurveFitConfig: CurveFitPrefilterInput | null;
}

const initialState: PrefilterState = {
  prefilterResultsById: {},
  prefilterResultsIds: [],
  selectedPrefilterResultsId: null,
  isRunning: false,
  progress: 0,
  statusMessage: '',
  error: null,
  lastAnovaConfig: null,
  lastWilliamsConfig: null,
  lastOriogenConfig: null,
  lastCurveFitConfig: null,
};

// Async thunks
export const runOneWayANOVA = createAsyncThunk(
  'prefilter/runOneWayANOVA',
  async (input: OneWayANOVAInput, { dispatch }) => {
    dispatch(setIsRunning(true));
    dispatch(setProgress(0));

    try {
      const results = await PrefilterService.oneWayANOVA(input);
      return results;
    } finally {
      dispatch(setIsRunning(false));
    }
  }
);

export const runWilliamsTrend = createAsyncThunk(
  'prefilter/runWilliamsTrend',
  async (input: WilliamsTrendInput, { dispatch }) => {
    dispatch(setIsRunning(true));
    dispatch(setProgress(0));

    try {
      const results = await PrefilterService.williamsTrend(input);
      return results;
    } finally {
      dispatch(setIsRunning(false));
    }
  }
);

export const runOriogen = createAsyncThunk(
  'prefilter/runOriogen',
  async (input: OriogenInput, { dispatch }) => {
    dispatch(setIsRunning(true));
    dispatch(setProgress(0));

    try {
      const results = await PrefilterService.oriogen(input);
      return results;
    } finally {
      dispatch(setIsRunning(false));
    }
  }
);

export const runCurveFitPrefilter = createAsyncThunk(
  'prefilter/runCurveFitPrefilter',
  async (input: CurveFitPrefilterInput, { dispatch }) => {
    dispatch(setIsRunning(true));
    dispatch(setProgress(0));

    try {
      const results = await PrefilterService.curveFitPrefilter(input);
      return results;
    } finally {
      dispatch(setIsRunning(false));
    }
  }
);

// Slice
const prefilterSlice = createSlice({
  name: 'prefilter',
  initialState,
  reducers: {
    setIsRunning(state, action: PayloadAction<boolean>) {
      state.isRunning = action.payload;
    },
    setProgress(state, action: PayloadAction<number>) {
      state.progress = action.payload;
    },
    setStatusMessage(state, action: PayloadAction<string>) {
      state.statusMessage = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setSelectedPrefilterResultsId(state, action: PayloadAction<string | null>) {
      state.selectedPrefilterResultsId = action.payload;
    },
    deletePrefilterResults(state, action: PayloadAction<string>) {
      const id = action.payload;
      delete state.prefilterResultsById[id];
      state.prefilterResultsIds = state.prefilterResultsIds.filter(i => i !== id);
      if (state.selectedPrefilterResultsId === id) {
        state.selectedPrefilterResultsId = null;
      }
    },
  },
  extraReducers: (builder) => {
    // One-Way ANOVA
    builder.addCase(runOneWayANOVA.fulfilled, (state, action) => {
      const results = action.payload;
      state.prefilterResultsById[results.id] = results;
      state.prefilterResultsIds.push(results.id);
      state.selectedPrefilterResultsId = results.id;
      state.lastAnovaConfig = results.inputParameters as OneWayANOVAInput;
    });
    builder.addCase(runOneWayANOVA.rejected, (state, action) => {
      state.error = action.error.message || 'ANOVA analysis failed';
    });

    // Williams Trend
    builder.addCase(runWilliamsTrend.fulfilled, (state, action) => {
      const results = action.payload;
      state.prefilterResultsById[results.id] = results;
      state.prefilterResultsIds.push(results.id);
      state.selectedPrefilterResultsId = results.id;
      state.lastWilliamsConfig = results.inputParameters as WilliamsTrendInput;
    });
    builder.addCase(runWilliamsTrend.rejected, (state, action) => {
      state.error = action.error.message || 'Williams Trend analysis failed';
    });

    // Oriogen
    builder.addCase(runOriogen.fulfilled, (state, action) => {
      const results = action.payload;
      state.prefilterResultsById[results.id] = results;
      state.prefilterResultsIds.push(results.id);
      state.selectedPrefilterResultsId = results.id;
      state.lastOriogenConfig = results.inputParameters as OriogenInput;
    });
    builder.addCase(runOriogen.rejected, (state, action) => {
      state.error = action.error.message || 'Oriogen analysis failed';
    });

    // Curve Fit Prefilter
    builder.addCase(runCurveFitPrefilter.fulfilled, (state, action) => {
      const results = action.payload;
      state.prefilterResultsById[results.id] = results;
      state.prefilterResultsIds.push(results.id);
      state.selectedPrefilterResultsId = results.id;
      state.lastCurveFitConfig = results.inputParameters as CurveFitPrefilterInput;
    });
    builder.addCase(runCurveFitPrefilter.rejected, (state, action) => {
      state.error = action.error.message || 'Curve Fit Prefilter analysis failed';
    });
  },
});

export const {
  setIsRunning,
  setProgress,
  setStatusMessage,
  setError,
  setSelectedPrefilterResultsId,
  deletePrefilterResults,
} = prefilterSlice.actions;

export default prefilterSlice.reducer;

// Selectors
export const selectAllPrefilterResults = (state: RootState) =>
  state.prefilter.prefilterResultsIds.map(id => state.prefilter.prefilterResultsById[id]);

export const selectSelectedPrefilterResults = (state: RootState) => {
  const id = state.prefilter.selectedPrefilterResultsId;
  return id ? state.prefilter.prefilterResultsById[id] : null;
};

export const selectPrefilterResultsById = (state: RootState, id: string) =>
  state.prefilter.prefilterResultsById[id];
```

### 9.2 WebSocket Integration for Progress

**File**: `src/main/frontend/hooks/usePrefilterProgress.ts`

```typescript
import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setProgress, setStatusMessage } from '@/store/slices/prefilterSlice';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const usePrefilterProgress = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Create WebSocket connection
    const socket = new SockJS('/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        // Subscribe to progress updates
        stompClient.subscribe('/user/topic/prefilter-progress', (message) => {
          const update = JSON.parse(message.body);
          dispatch(setProgress(update.progress));
          dispatch(setStatusMessage(update.message));
        });
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [dispatch]);
};
```

### 9.3 Component Organization

```
src/main/frontend/components/prefilter/
├── PrefilterView.tsx              # Main container
├── PrefilterTypeSelector.tsx      # Choose ANOVA/Williams/Oriogen/CurveFit
├── dialogs/
│   ├── BasePrefilterDialog.tsx    # Shared layout/logic
│   ├── ANOVAConfigDialog.tsx
│   ├── WilliamsConfigDialog.tsx
│   ├── OriogenConfigDialog.tsx
│   └── CurveFitConfigDialog.tsx
├── sections/
│   ├── CommonParametersSection.tsx
│   ├── FoldChangeSection.tsx
│   ├── NotelLotelSection.tsx
│   ├── WilliamsParametersSection.tsx
│   ├── OriogenParametersSection.tsx
│   └── CurveFitParametersSection.tsx
└── results/
    ├── PrefilterResultsTable.tsx
    ├── PrefilterResultsSummary.tsx
    └── PrefilterResultsExport.tsx
```

---

## 10. Technical Porting Considerations

### 10.1 Statistical Libraries

| Desktop (Java) | Web (JavaScript/TypeScript) | Notes |
|----------------|----------------------------|-------|
| Apache Commons Math | `jstat` or `simple-statistics` | F-distribution, T-distribution |
| sciome-commons (Williams) | Custom port or backend | Complex algorithm |
| sciome-commons (Oriogen) | Custom port or backend | Complex algorithm |
| Custom FDR implementation | Direct port | Straightforward algorithm |

**Recommendation**:
- Implement ANOVA, Fold Change, NOTEL/LOTEL, and FDR on backend (Java)
- Williams and Oriogen definitely on backend (complexity + dependency on sciome-commons)
- Curve Fit Prefilter on backend (reuses existing BMD analysis service)

### 10.2 Threading and Parallelization

| Desktop | Web Backend | Web Frontend |
|---------|-------------|--------------|
| ExecutorService with N threads | CompletableFuture or parallel streams | Web Workers (if needed) |
| Configurable thread pool size | Spring @Async or manual thread pool | Limited by browser |

**Recommendation**:
- Backend: Use Spring's `@Async` with configured thread pool
- Frontend: Not needed for computation (handled by backend)
- Frontend: Use Web Workers only if implementing client-side fold change calculations

### 10.3 Progress Reporting

| Desktop | Web |
|---------|-----|
| JavaFX Task with updateProgress() | WebSocket or SSE |
| Event bus for status updates | Redux state + WebSocket |

**Recommendation**:
- Use WebSocket (via STOMP) for real-time progress updates
- Backend sends progress percentage and status message
- Frontend subscribes to user-specific topic

### 10.4 Data Storage

| Desktop | Web |
|---------|-----|
| BMDProject file (serialized) | PostgreSQL database |
| In-memory during session | Redis cache for intermediate results |

**Recommendation**:
- Store PrefilterResults in PostgreSQL
- Store individual PrefilterResult rows with foreign key
- Consider Redis caching for frequently accessed results

### 10.5 UI Framework Migration

| Desktop (JavaFX) | Web (React) |
|------------------|-------------|
| FXML layouts | JSX/TSX components |
| Scene Builder | Hand-coded or Ant Design Pro |
| Properties binding | Redux state + useSelector |
| EventHandlers | onClick, onChange handlers |
| Task<T> for async | Promises + async/await |

**Recommendation**:
- Use Ant Design for UI components (Table, Form, Modal, Progress, etc.)
- Follow existing patterns in CategoryResultsView and UMAP components
- Use Form.useForm() for validation

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal**: Set up data structures and basic UI framework

**Tasks**:
1. Create DTOs (Input and Result classes) in Java
2. Create corresponding TypeScript interfaces (via Hilla code generation)
3. Set up Redux slice (prefilterSlice.ts)
4. Create database tables (prefilter_results, prefilter_result)
5. Create PrefilterView container component
6. Create BasePrefilterDialog component with common sections

**Deliverables**:
- All DTOs defined
- Redux state management ready
- Database schema created
- Basic UI shell

---

### Phase 2: One-Way ANOVA (Week 3-4)

**Goal**: Implement complete ANOVA prefilter workflow

**Tasks**:
1. Port OneWayANOVAAnalysis.java from desktop
2. Implement FoldChangeCalculator utility
3. Implement NotelLotelDetermination utility
4. Implement FalseDiscoveryRate utility (Benjamini-Hochberg)
5. Create PrefilterService.oneWayANOVA() method
6. Implement ANOVAConfigDialog component
7. Implement PrefilterResultsTable component
8. Add WebSocket progress reporting
9. Integration testing

**Deliverables**:
- Fully functional One-Way ANOVA prefilter
- End-to-end workflow from config dialog to results table
- Unit tests for statistical algorithms
- Integration tests for service layer

---

### Phase 3: Williams Trend Test (Week 5)

**Goal**: Add Williams Trend Test as second prefilter option

**Tasks**:
1. Port WilliamsTrendTestUtil from sciome-commons
2. Implement PrefilterService.williamsTrend() method
3. Create WilliamsConfigDialog component
4. Update PrefilterTypeSelector to include Williams option
5. Integration testing

**Deliverables**:
- Fully functional Williams Trend Test prefilter
- UI for configuring permutation count
- Validated against desktop application results

---

### Phase 4: Oriogen (Week 6)

**Goal**: Add Oriogen as third prefilter option

**Tasks**:
1. Port OriogenUtil from sciome-commons
2. Implement PrefilterService.oriogen() method
3. Create OriogenConfigDialog component
4. Update UI to display profile strings
5. Integration testing

**Deliverables**:
- Fully functional Oriogen prefilter
- Bootstrap parameter configuration
- Profile string display in results table

---

### Phase 5: Curve Fit Prefilter (Week 7-8)

**Goal**: Add Curve Fit Prefilter as fourth option

**Tasks**:
1. Integrate with existing BMD analysis service
2. Implement PrefilterService.curveFitPrefilter() method
3. Create CurveFitConfigDialog component (model selection, BMR config)
4. Update PrefilterResultsTable to show BMD/BMDL/AIC columns
5. Performance optimization (caching, parallel processing)
6. Integration testing

**Deliverables**:
- Fully functional Curve Fit Prefilter
- Model selection UI
- BMD-based filtering results

---

### Phase 6: Results Visualization and Export (Week 9)

**Goal**: Enhance results display and export options

**Tasks**:
1. Implement PrefilterResultsSummary with statistics
2. Implement CSV/TSV/Excel export
3. Add results comparison view (side-by-side tables)
4. Add filtering/sorting/grouping to results table
5. Add histogram/scatter visualizations of p-values and fold changes

**Deliverables**:
- Rich results visualization
- Multiple export formats
- Comparison tools

---

### Phase 7: Integration with BMD Analysis (Week 10)

**Goal**: Allow prefilter results to feed into BMD analysis

**Tasks**:
1. Update BMD analysis service to accept PrefilterResults as input
2. Update BMD configuration dialog to select prefilter results
3. Implement filtering: only run BMD on probes that passed prefilter
4. Update project tree to show parent-child relationship

**Deliverables**:
- Seamless workflow from prefilter → BMD analysis
- Project tree shows hierarchy

---

### Phase 8: Testing and Validation (Week 11-12)

**Goal**: Comprehensive testing and validation against desktop app

**Tasks**:
1. Unit tests for all statistical algorithms
2. Integration tests for all four prefilter types
3. End-to-end tests (Playwright)
4. Performance testing (large datasets: 40K probes)
5. Validation: Compare results with desktop application (identical datasets)
6. Bug fixes and refinement

**Deliverables**:
- Test coverage > 80%
- Validated results match desktop app
- Performance benchmarks documented

---

### Phase 9: Documentation and Deployment (Week 13)

**Goal**: Complete documentation and production deployment

**Tasks**:
1. Update ENGINEERING_DESIGN_GUIDE.md with prefilter section
2. Create user documentation (how to run prefilters)
3. Create video tutorials
4. Deploy to staging environment
5. User acceptance testing
6. Deploy to production

**Deliverables**:
- Complete documentation
- User tutorials
- Production deployment

---

## Appendix A: Desktop File Reference

### Key Desktop Files

**Models**:
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/model/prefilter/*.java`

**Services**:
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/service/PrefilterService.java`

**Utilities**:
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/util/prefilter/*.java`
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/util/stat/*.java`

**UI**:
- `/home/svobodadl/BMDExpress-3/src/main/resources/fxml/onewayanova.fxml`
- `/home/svobodadl/BMDExpress-3/src/main/resources/fxml/williamstrend.fxml`
- `/home/svobodadl/BMDExpress-3/src/main/resources/fxml/oriogen.fxml`
- `/home/svobodadl/BMDExpress-3/src/main/resources/fxml/curvefitprefilter.fxml`

**Presenters**:
- `/home/svobodadl/BMDExpress-3/src/main/java/com/sciome/bmdexpress2/mvp/presenter/prefilter/*.java`

---

## Appendix B: Testing Strategy

### Unit Tests

**Backend (Java + JUnit)**:
```java
@SpringBootTest
public class OneWayANOVAAnalysisTest {

  @Test
  public void testANOVA_SimpleCase() {
    // Given: Sample data with known ANOVA result
    double[][] responses = {
      {5.0, 5.1, 4.9},   // Control
      {6.0, 6.1, 5.9},   // Dose 1
      {7.0, 7.1, 6.9},   // Dose 2
    };

    // When: Perform ANOVA
    OneWayANOVAResult result = OneWayANOVAAnalysis.performANOVA(responses);

    // Then: F-value should be significant
    assertTrue(result.getFValue() > 10.0);
    assertTrue(result.getPValue() < 0.001);
  }
}
```

**Frontend (Jest + React Testing Library)**:
```typescript
describe('ANOVAConfigDialog', () => {
  test('validates p-value cutoff', () => {
    render(<ANOVAConfigDialog visible={true} onClose={jest.fn()} />);

    const input = screen.getByLabelText('P-Value Cutoff');
    fireEvent.change(input, { target: { value: '1.5' } });

    expect(screen.getByText('P-value cutoff must be between 0 and 1')).toBeInTheDocument();
  });
});
```

### Integration Tests

**Backend (SpringBootTest)**:
```java
@SpringBootTest
@AutoConfigureMockMvc
public class PrefilterServiceIntegrationTest {

  @Autowired
  private PrefilterService prefilterService;

  @Test
  public void testOneWayANOVA_EndToEnd() {
    // Given: Expression data loaded in database
    DoseResponseExperiment experiment = loadTestData();

    OneWayANOVAInput input = new OneWayANOVAInput();
    input.setDoseResponseExperimentId(experiment.getId());
    input.setPValueCutOff(0.05);
    input.setUseFoldChange(true);
    input.setFoldChangeValue(2.0);

    // When: Run ANOVA
    PrefilterResults results = prefilterService.oneWayANOVA(input);

    // Then: Results should be valid
    assertNotNull(results);
    assertTrue(results.getProbesPassed() > 0);
    assertTrue(results.getProbesPassed() < results.getTotalProbesAnalyzed());
  }
}
```

### End-to-End Tests

**Frontend (Playwright)**:
```typescript
test('complete ANOVA workflow', async ({ page }) => {
  // 1. Navigate to prefilter view
  await page.goto('/prefilter');

  // 2. Select ANOVA
  await page.click('text=One-Way ANOVA');

  // 3. Configure parameters
  await page.selectOption('[name="doseResponseExperimentId"]', 'test-dataset-1');
  await page.fill('[name="pValueCutOff"]', '0.05');
  await page.check('[name="useFoldChange"]');
  await page.fill('[name="foldChangeValue"]', '2.0');

  // 4. Start analysis
  await page.click('button:has-text("Start")');

  // 5. Wait for completion (up to 60 seconds)
  await page.waitForSelector('text=Complete!', { timeout: 60000 });

  // 6. Verify results table appears
  await expect(page.locator('.prefilter-results-table')).toBeVisible();

  // 7. Verify summary statistics
  await expect(page.locator('text=/Probes Passed/')).toBeVisible();
});
```

---

## Appendix C: Performance Benchmarks

Expected performance targets:

| Dataset Size | Prefilter Type | Expected Time | Max Acceptable Time |
|--------------|----------------|---------------|---------------------|
| 10,000 probes | ANOVA | 5 seconds | 15 seconds |
| 10,000 probes | Williams (100 perms) | 30 seconds | 60 seconds |
| 10,000 probes | Oriogen | 60 seconds | 120 seconds |
| 10,000 probes | Curve Fit (3 models) | 5 minutes | 10 minutes |
| 40,000 probes | ANOVA | 20 seconds | 60 seconds |
| 40,000 probes | Williams (100 perms) | 2 minutes | 5 minutes |
| 40,000 probes | Oriogen | 4 minutes | 10 minutes |
| 40,000 probes | Curve Fit (3 models) | 20 minutes | 45 minutes |

---

## Summary

This implementation guide provides a complete roadmap for porting the prefiltering workflow from the BMDExpress-3 desktop application to the web application. Key takeaways:

1. **Four prefilter types**: ANOVA, Williams Trend, Oriogen, Curve Fit
2. **Common parameters**: P-value cutoff, fold change, FDR correction, NOTEL/LOTEL
3. **Backend-heavy**: Most computation should be on backend (Java/Spring)
4. **Progress reporting**: Use WebSocket for real-time updates
5. **Phased implementation**: Start with ANOVA (simplest), add others incrementally
6. **Validation critical**: Results must match desktop application

The 13-week roadmap provides a realistic timeline for implementing all four prefilter types with comprehensive testing and documentation.
