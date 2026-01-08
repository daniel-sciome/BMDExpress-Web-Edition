# Session 8: UMAP GO Term Semantic Space Integration

**Date**: 2025-10-20
**Objective**: Integrate external UMAP clustering data to enable semantic-space-driven category filtering

---

## Overview

Implemented a **UMAP-driven selection system** that augments category analysis results with external GO term semantic embeddings. The UMAP scatter plot serves as the primary interaction point - users can select GO terms in the semantic space, and all other visualizations reactively filter to show only matching categories.

---

## Implementation Summary

### 1. Data Migration & Service Layer

**Files Created**:
- `src/main/frontend/data/referenceUmapData.ts` (moved from `src/main/resources/`)
- `src/main/frontend/data/umapDataService.ts`

**Data Structure**:
```typescript
interface ReferenceUmapItem {
    UMAP_1: number;        // X coordinate
    UMAP_2: number;        // Y coordinate
    go_id: string;         // e.g., "GO:0000018" - JOIN KEY
    go_term: string;       // Human-readable term
    cluster_id: number | string;  // HDBSCAN cluster, -1 = outliers
}
```

**Key Features**:
- ~3,300 GO terms with UMAP coordinates
- O(1) lookup by GO ID via `Map<string, ReferenceUmapItem>`
- Cluster grouping for efficient queries
- Singleton service pattern with stats logging

---

### 2. Redux State Enhancement

**File Modified**: `src/main/frontend/store/slices/categoryResultsSlice.ts`

**New State**:
```typescript
interface CategoryResultsState {
  // ... existing state ...
  selectedUmapGoIds: Set<string>;  // NEW: UMAP scatter selection
}
```

**New Actions**:
- `setSelectedUmapGoIds(goIds: string[])` - Set UMAP selection
- `toggleUmapGoIdSelection(goId: string)` - Toggle single GO ID
- `clearUmapSelection()` - Clear UMAP selection

**Updated Selector** - `selectChartData`:
```typescript
// Priority hierarchy:
// 1. UMAP selection (if any)
// 2. Table selection (if any)
// 3. All data (no filtering)

if (umapGoIds.size > 0) {
  return allData.filter(row => umapGoIds.has(row.categoryId || ''));
}
```

This ensures **UMAP selection takes priority** over table row selection, allowing the semantic space to act as a master filter.

---

### 3. UMAP Scatter Plot Component

**File Created**: `src/main/frontend/components/charts/UmapScatterPlot.tsx`

**Features**:

#### Visual Design
- **Reference points** (not in analysis): Small, transparent circles (~3,300 GO terms)
- **Analysis points** (in current results): Large, opaque circles with white borders
- **Color-coded by cluster**: ~40 clusters + outliers (gray)
- **Interactive selection**: Plotly box/lasso select tools
- **Synchronized highlighting**: Selected points highlighted, others dimmed

#### User Interactions
- **Box/Lasso select**: Select multiple GO terms by region
- **Click**: Single GO term selection
- **Deselect**: Click outside selection to clear
- **Clear button**: Explicitly clear selection

#### UI Elements
- **Info tooltip**: Explains UMAP and how to use the tool
- **Status tags**:
  - Blue: "N in analysis" (categories in current results)
  - Gray: "N reference" (all GO terms)
  - Orange: "N selected" (active selection)
- **Instructions**: Clear usage guide below chart

#### Technical Details
- Plotly.js for interactive scatter plot
- Separate traces for each cluster (legend control)
- Dual-layer rendering (reference + analysis points)
- Only analysis points are selectable (have `customdata`)
- Responsive layout with fixed legend

---

### 4. Integration into CategoryResultsView

**File Modified**: `src/main/frontend/components/CategoryResultsView.tsx`

**Changes**:
- Added `UMAP_SEMANTIC` chart type to selector
- Imported `UmapScatterPlot` component
- Renders when user selects "UMAP Semantic Space"

**Chart Type Position**: 2nd in the list (right after "Default Charts") to emphasize importance.

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  UMAP Scatter Plot (3,300 GO terms)                        │
│  • User selects cluster/region with lasso/box              │
│  • Dispatches setSelectedUmapGoIds([...goIds])             │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Redux State: categoryResults.selectedUmapGoIds             │
│  • Set<string> of selected GO IDs                           │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Selector: selectChartData                                  │
│  • Filters allData by umapGoIds (if any)                    │
│  • Memoized for performance                                 │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  All Chart Components                                       │
│  • BMDvsPValueScatter, BMDBoxPlot, RangePlot, etc.         │
│  • Subscribe to selectChartData selector                    │
│  • Automatically re-render with filtered data               │
│  • Dim/hide non-selected categories                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. **UMAP Selection Priority**
- UMAP selection takes precedence over table selection
- Rationale: UMAP is a semantic exploration tool - when users explore in UMAP space, that should be their active filter
- Users can clear UMAP selection to return to table-based selection

### 2. **Two-Layer Visualization**
- Show all ~3,300 reference GO terms (context)
- Highlight categories in current analysis (focus)
- Rationale: Provides semantic context while emphasizing relevant data

### 3. **Cluster-Based Color Coding**
- Each HDBSCAN cluster gets a unique color
- Outliers (cluster -1) are gray
- Rationale: Helps users identify functional themes and related biological processes

### 4. **Selection-Only on Analysis Points**
- Only analysis categories are selectable
- Reference points provide context but can't be selected
- Rationale: Prevents confusion - can't select GO terms that don't exist in your results

### 5. **Memoized Selectors**
- `selectChartData` uses `createSelector` for memoization
- Rationale: Prevents unnecessary re-renders when selection hasn't changed

---

## Usage Example

### User Workflow:
1. User loads category results (e.g., 150 GO terms from analysis)
2. Navigates to "UMAP Semantic Space" visualization
3. Sees their 150 categories highlighted among 3,300 reference GO terms
4. Uses lasso tool to select a cluster of interest (e.g., immune response genes)
5. **All other charts automatically update** to show only selected categories:
   - BMD vs P-Value Scatter shows only selected points
   - Box Plot shows only selected distributions
   - Range Plot shows only selected categories
   - Table filters to selected rows
6. User explores different semantic regions
7. Clears selection to see all data again

---

## Technical Specifications

### Performance
- **Lookup complexity**: O(1) for GO ID → UMAP data
- **Selection complexity**: O(n) filter operation (memoized)
- **Data size**: ~420KB static file (~3,300 GO terms)
- **Rendering**: Plotly handles 3,300+ points efficiently

### Browser Compatibility
- Requires modern browser with ES6 support
- Plotly.js dependency (already in project)
- React 18+ (already in project)

### Memory Footprint
- Static data loaded once on module import
- Lookup maps created once (singleton pattern)
- No memory leaks (proper React cleanup)

---

## Files Changed

### Created:
1. `src/main/frontend/data/umapDataService.ts` (91 lines)
2. `src/main/frontend/components/charts/UmapScatterPlot.tsx` (289 lines)

### Modified:
3. `src/main/frontend/store/slices/categoryResultsSlice.ts` (+27 lines)
4. `src/main/frontend/components/CategoryResultsView.tsx` (+3 lines, +1 import)

### Moved:
5. `src/main/resources/referenceUmapData.ts` → `src/main/frontend/data/referenceUmapData.ts`

**Total**: 419 new lines of code (excluding 420KB data file)

---

## Testing Checklist

### Manual Testing:
- [ ] UMAP scatter plot renders with all reference points
- [ ] Analysis categories are highlighted correctly
- [ ] Box select tool selects multiple GO terms
- [ ] Lasso select tool works for irregular regions
- [ ] Clear button clears selection
- [ ] All charts update when UMAP selection changes
- [ ] Charts show all data when UMAP selection is cleared
- [ ] Legend toggles clusters on/off
- [ ] Hover tooltips show GO ID and term
- [ ] Responsive layout works on different screen sizes

### Integration Testing:
- [ ] UMAP selection takes priority over table selection
- [ ] Table selection works when UMAP selection is cleared
- [ ] Loading new results clears UMAP selection
- [ ] No console errors or warnings
- [ ] Memory usage remains stable

---

## Future Enhancements

### Phase 2 Ideas:
1. **Cluster Labels**: Add semantic labels to clusters (e.g., "Immune Response", "Cell Cycle")
2. **Cluster Statistics**: Show gene counts per cluster
3. **Multi-Selection Mode**: Hold Shift to add to selection vs. replace
4. **Export Selection**: Export selected GO IDs as CSV
5. **Deep Linking**: URL parameter for pre-selected clusters
6. **Cluster Enrichment**: Statistical enrichment of selected clusters
7. **3D UMAP**: Option for 3D visualization (UMAP_3 coordinate)
8. **Custom Embeddings**: Allow users to upload their own UMAP data
9. **Density Heatmap**: Show density of analysis categories in UMAP space
10. **Animated Transitions**: Smooth zoom to selected cluster

### Additional Data Sources:
- Pathway embeddings (KEGG, Reactome)
- Disease ontology embeddings
- Cell type ontology embeddings
- Cross-species GO term mappings

---

## References

- **UMAP Algorithm**: McInnes, L., Healy, J., & Melville, J. (2018). UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction
- **HDBSCAN Clustering**: McInnes, L., & Healy, J. (2017). Accelerated Hierarchical Density Based Clustering
- **GO Terms**: Gene Ontology Consortium (http://geneontology.org/)
- **Plotly.js**: https://plotly.com/javascript/

---

## Summary

Successfully implemented **semantic-space-driven category filtering** using UMAP embeddings. The system allows users to explore GO terms in a 2D semantic space and interactively select regions of interest, with all visualizations reactively updating to show only matching categories. This provides a powerful new way to explore category analysis results based on biological function similarity rather than statistical metrics alone.

**Build Status**: ✅ Maven compile successful
**Ready for Testing**: Yes
**Breaking Changes**: None
**Backward Compatible**: Yes
