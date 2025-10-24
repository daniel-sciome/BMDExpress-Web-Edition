# UMAP Integration Selectors - Usage Guide

## Overview

The `umapIntegration.ts` module provides Redux selectors that join category analysis data with UMAP reference coordinates. These selectors enable charts and visualizations to display categories in 2D semantic space.

## Available Selectors

### 1. `selectCategoryDataWithUmap`

Returns all filtered categories enriched with UMAP coordinates.

**Returns:** `CategoryWithUmap[]`

```typescript
interface CategoryWithUmap extends CategoryAnalysisResultDto {
  umap_x?: number;          // UMAP dimension 1
  umap_y?: number;          // UMAP dimension 2
  cluster_id?: number | string;  // HDBSCAN cluster ID
  hasUmapData: boolean;     // true if UMAP coords available
}
```

**Usage Example:**

```typescript
import { useAppSelector } from 'Frontend/store/hooks';
import { selectCategoryDataWithUmap } from 'Frontend/store/slices/umapIntegration';

function MyScatterPlot() {
  const categoriesWithUmap = useAppSelector(selectCategoryDataWithUmap);

  // Plot only categories that have UMAP coordinates
  const plotData = categoriesWithUmap
    .filter(cat => cat.hasUmapData)
    .map(cat => ({
      x: cat.umap_x,
      y: cat.umap_y,
      label: cat.categoryDescription,
      cluster: cat.cluster_id
    }));

  return <ScatterPlot data={plotData} />;
}
```

---

### 2. `selectCategoriesWithUmapOnly`

Returns only categories that have UMAP data (filters out categories without coordinates).

**Returns:** `CategoryWithUmap[]` (all have `hasUmapData: true`)

**Usage Example:**

```typescript
import { selectCategoriesWithUmapOnly } from 'Frontend/store/slices/umapIntegration';

function UmapOnlyView() {
  const umapCategories = useAppSelector(selectCategoriesWithUmapOnly);

  // All categories here are guaranteed to have umap_x, umap_y, cluster_id
  return (
    <div>
      <p>Showing {umapCategories.length} categories with UMAP coordinates</p>
      {/* ... render visualization ... */}
    </div>
  );
}
```

---

### 3. `selectUmapCoverageStats`

Returns statistics about UMAP coverage in the current filtered dataset.

**Returns:**
```typescript
{
  total: number;           // Total categories
  withUmap: number;        // Categories with UMAP data
  withoutUmap: number;     // Categories without UMAP data
  coveragePercent: number; // Percentage with UMAP (0-100)
}
```

**Usage Example:**

```typescript
import { selectUmapCoverageStats } from 'Frontend/store/slices/umapIntegration';

function UmapCoverageIndicator() {
  const stats = useAppSelector(selectUmapCoverageStats);

  return (
    <Tag color={stats.coveragePercent > 80 ? 'green' : 'orange'}>
      UMAP Coverage: {stats.coveragePercent}% ({stats.withUmap}/{stats.total})
    </Tag>
  );
}
```

---

### 4. `selectCategoriesByCluster`

Groups categories by their UMAP cluster ID.

**Returns:** `Map<number | string, CategoryWithUmap[]>`

**Usage Example:**

```typescript
import { selectCategoriesByCluster } from 'Frontend/store/slices/umapIntegration';

function ClusterAnalysis() {
  const clusterMap = useAppSelector(selectCategoriesByCluster);

  return (
    <div>
      <h3>Categories by Cluster</h3>
      {Array.from(clusterMap.entries()).map(([clusterId, categories]) => (
        <div key={clusterId}>
          <h4>Cluster {clusterId} ({categories.length} categories)</h4>
          <ul>
            {categories.map(cat => (
              <li key={cat.categoryId}>{cat.categoryDescription}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

---

## Performance Notes

- **Memoized:** All selectors use `createSelector` from Redux Toolkit and only recompute when input data changes
- **Efficient Lookup:** Join uses `umapDataService` with O(1) lookup by GO ID (Map-based)
- **No Redundant Computation:** Results are cached until `selectFilteredData` changes

## Data Source

- UMAP reference data comes from `data/referenceUmapData.ts` (~19,896 GO BP terms)
- Data includes: UMAP_1, UMAP_2, go_id, go_term, cluster_id
- Accessed efficiently via `umapDataService` singleton

## When to Use

**Use `selectCategoryDataWithUmap` when:**
- You want to plot current analysis categories in UMAP space
- You need to check which categories have UMAP coordinates
- You're building a visualization that shows category relationships

**Don't use for:**
- Showing all UMAP reference data (use `umapDataService.getAllData()` directly)
- Charts that don't need UMAP coordinates (use `selectFilteredData` instead)

## Example: Enhanced Scatter Plot with Clusters

```typescript
import { useAppSelector } from 'Frontend/store/hooks';
import { selectCategoriesWithUmapOnly } from 'Frontend/store/slices/umapIntegration';
import Plot from 'react-plotly.js';

function EnhancedUmapScatter() {
  const categories = useAppSelector(selectCategoriesWithUmapOnly);

  // Group by cluster for separate traces
  const clusterGroups = categories.reduce((acc, cat) => {
    const id = cat.cluster_id!;
    if (!acc[id]) acc[id] = [];
    acc[id].push(cat);
    return acc;
  }, {} as Record<number | string, CategoryWithUmap[]>);

  // Create Plotly traces
  const traces = Object.entries(clusterGroups).map(([clusterId, cats]) => ({
    x: cats.map(c => c.umap_x),
    y: cats.map(c => c.umap_y),
    text: cats.map(c => `${c.categoryId}: ${c.categoryDescription}`),
    name: `Cluster ${clusterId}`,
    mode: 'markers',
    type: 'scatter',
  }));

  return <Plot data={traces} layout={{ title: 'Categories in UMAP Space' }} />;
}
```

---

## Related Files

- `types/categoryTypes.ts` - TypeScript interfaces
- `data/umapDataService.ts` - Efficient UMAP data access
- `data/referenceUmapData.ts` - Raw UMAP reference data
- `store/slices/categoryResultsSlice.ts` - Base filtered data selector
