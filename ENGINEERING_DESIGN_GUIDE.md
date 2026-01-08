# BMDExpress-3 Web: Engineering Design & Implementation Guide

**Version**: 1.0 (November 2025)
**Audience**: New engineer agents/developers taking over the project
**Purpose**: Complete technical reference for architecture, patterns, and implementation details

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Patterns](#3-architecture-patterns)
4. [File Structure](#4-file-structure)
5. [State Management](#5-state-management)
6. [Core Abstractions](#6-core-abstractions)
7. [Component Hierarchy](#7-component-hierarchy)
8. [Data Flow](#8-data-flow)
9. [Key Implementation Files](#9-key-implementation-files)
10. [Development Patterns](#10-development-patterns)
11. [Current Status](#11-current-status)
12. [Future Work](#12-future-work)

---

## 1. System Overview

### What is BMDExpress-3 Web?

A web-based platform for toxicogenomic analysis using Benchmark Dose (BMD) modeling. Scientists upload gene expression data from dose-response experiments, and the system:

1. **Displays enriched biological pathways** (GO terms, KEGG pathways, etc.)
2. **Visualizes dose-response curves** with mathematical models (Hill, Power, Exponential, Polynomial)
3. **Enables interactive exploration** through coordinated views (tables, scatter plots, charts)
4. **Provides multi-dataset comparison** (Venn diagrams, synchronized selections)

### Core Workflow

```
User uploads BMD2 file
  ↓
Backend parses DoseResponseExperiment
  ↓
Frontend displays:
  - Project tree (sidebar)
  - Category results table
  - UMAP scatter plot (19K+ GO terms with coordinates)
  - Statistical charts (Box plots, Accumulation, Range, Scatter)
  - Dose-response curves
  ↓
User interacts:
  - Selects categories in table → charts highlight
  - Clicks UMAP points → table filters
  - Clicks legend cluster → subset selection
  - Applies filters → all views update
```

---

## 2. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Redux Toolkit | 2.9.1 | State management |
| Ant Design | 5.27.5 | UI components (Table, Tree, Modal, etc.) |
| Plotly.js | 3.1.2 | Charting library |
| Vaadin/Hilla | 24.9.2 | Java-TypeScript bridge, routing |
| Vite | 6.3.6 | Build tool |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Spring Boot | (via Maven) | REST API framework |
| Hilla | 24.9.2 | Type-safe RPC between Java and TypeScript |
| Java | 17+ | Backend language |

### Key Libraries

- **ExcelJS**: Excel file generation with image embedding
- **html2canvas**: Chart capture for export
- **date-fns**: Date formatting
- **react-redux**: React bindings for Redux

---

## 3. Architecture Patterns

### Pattern 1: Reactive Selection Infrastructure

**The Core Innovation** - All interactive features are built on this abstraction.

#### Problem Solved
Multiple views (table, charts, UMAP) needed to share selection state bidirectionally. Traditional approaches would create complex coupled logic.

#### Solution: Generic "Reactive-To" Pattern

```typescript
// Components declare what dimension they react to
const categoryState = useReactiveState('categoryId');
const clusterState = useReactiveState('clusterId');

// Unified API for all selection operations
categoryState.isSelected(id);                    // Check selection
categoryState.handleSelect(id, isMulti, source); // Select/deselect
categoryState.handleMultiSelect(ids, source);    // Bulk select
```

**Key Files**:
- `src/main/frontend/types/reactiveTypes.ts` - Type definitions
- `src/main/frontend/hooks/useReactiveState.ts` - Hook implementation
- `src/main/frontend/store/slices/categoryResultsSlice.ts` - Redux state

**Why It Works**:
1. **Single Source of Truth**: All selections in Redux (`reactiveSelection` state)
2. **Source Tracking**: Know which component triggered selection (for debugging/priority)
3. **Extensible**: Add new types (e.g., 'geneId', 'pathwayId') without changing existing code
4. **Bidirectional**: Any component can read and write selections

### Pattern 2: inFocus Architecture (Filter-Based Visibility)

**Problem**: When filters are applied, filtered-out categories disappear completely, losing context about the full dataset.

**Solution**: Categories are marked with `inFocus: boolean` instead of being removed. Display mode controls how out-of-focus categories appear.

```typescript
// Types (categoryTypes.ts)
interface CategoryWithFocus extends CategoryAnalysisResultDto {
  inFocus: boolean;  // Whether this category passes filter criteria
}

// Selector returns ALL data with inFocus status
export const selectDataWithFocus = createSelector(
  [selectData, selectFilters, selectAnalysisType, selectEnabledFilterGroups],
  (data, filters, analysisType, filterGroups) => {
    return data.map(row => ({
      ...row,
      inFocus: rowPassesFilters(row, filters, analysisType, filterGroups),
    }));
  }
);

// Display modes control out-of-focus visibility
type DisplayMode = 'highlight' | 'dim' | 'isolate';
// highlight = Show All (full opacity)
// dim = Dim Others (reduced opacity)
// isolate = Hide Others (hidden)
```

**Styling Utilities** (`displayModeStyles.ts`):

```typescript
// For table rows
const className = getRowClassNameByFocus(record.inFocus, displayMode);
// Returns: 'in-focus-row' | 'out-of-focus-row' | 'out-of-focus-row dimmed-row' | 'out-of-focus-row hidden-row'

// For chart markers
const style = getMarkerStyleByFocus(inFocus, displayMode, baseColor);
// Returns: { color, opacity, size, lineWidth, lineColor }
```

**Key Files**:
- `src/main/frontend/types/categoryTypes.ts` - CategoryWithFocus type
- `src/main/frontend/store/slices/categoryResultsSlice.ts` - selectDataWithFocus, rowPassesFilters
- `src/main/frontend/components/charts/utils/displayModeStyles.ts` - Styling utilities
- `src/main/frontend/store/slices/visibilitySlice.ts` - displayMode state

### Pattern 3: Two-Layer Visualization

**Problem**: Users lose context when only selected items are shown.

**Solution**: Always render all data as gray background, overlay selected items in color.

```typescript
// Layer 1: Background (all data)
const backgroundTrace = {
  x: allData.map(d => d.x),
  y: allData.map(d => d.y),
  mode: 'markers',
  marker: {
    color: 'rgba(128, 128, 128, 0.3)',  // Gray, semi-transparent
    size: 4
  },
  showlegend: false,
  hoverinfo: 'skip'
};

// Layer 2: Foreground (selected data)
const foregroundTrace = {
  x: selectedData.map(d => d.x),
  y: selectedData.map(d => d.y),
  mode: 'markers',
  marker: {
    color: selectedData.map(d => getClusterColor(d.cluster)),  // Cluster colors
    size: 8,
    opacity: 1.0,
    line: { color: 'white', width: 1 }  // White border for visibility
  },
  showlegend: true
};
```

**Used In**: BMDvsPValueScatter, AccumulationCharts, UmapScatterPlot

### Pattern 4: Progressive Disclosure (3-Way Toggle)

**Problem**: Too many visual elements overwhelm users.

**Solution**: Click legend item to progressively hide non-selected data.

```typescript
// State: 0=normal, 1=outlined, 2=hidden
const [clusterVisibility, setClusterVisibility] = useState<Map<number, number>>(new Map());

function handleLegendClick(clusterId: number, isMultiSelect: boolean) {
  const currentState = clusterVisibility.get(clusterId) || 0;

  if (isMultiSelect) {
    // Multi-select: toggle selection only
    toggleClusterSelection(clusterId);
  } else {
    // Single-select: cycle through states
    const nextState = (currentState + 1) % 3;
    setClusterVisibility(new Map([[clusterId, nextState]]));
  }
}

// Apply styling based on state
function getMarkerStyle(clusterId: number) {
  const state = clusterVisibility.get(clusterId) || 0;
  switch (state) {
    case 0: return { opacity: 1.0, line: { width: 0 } };        // Normal
    case 1: return { opacity: 1.0, line: { width: 2 } };        // Outlined
    case 2: return { opacity: 0.0 };                             // Hidden
  }
}
```

**Used In**: UmapScatterPlot cluster legend

### Pattern 5: Memoized Selectors

**Problem**: Expensive computations (filtering, sorting, joining) run on every render.

**Solution**: Redux Toolkit's `createSelector` for memoization.

```typescript
export const selectFilteredData = createSelector(
  [
    selectAllData,           // Input 1
    selectFilters,           // Input 2
    selectMasterFilters      // Input 3
  ],
  (data, filters, masterFilters) => {
    // Only recomputes when inputs change
    let filtered = data;

    // Apply master filters
    filtered = applyMasterFilters(filtered, masterFilters);

    // Apply column filters
    filtered = applyColumnFilters(filtered, filters);

    return filtered;
  }
);
```

**Key Selectors**:
- `selectDataWithFocus` - All data with `inFocus` boolean (filter criteria applied but data not removed)
- `selectSortedDataWithFocus` - Sorted data with inFocus
- `selectFilteredData` - Only in-focus data (for backward compatibility)
- `selectSortedData` - Filtered + sorted
- `selectCategoryDataWithUmap` - Joined with UMAP coordinates
- `selectCategoriesInClusters` - Filter by cluster membership

### Pattern 6: Component Remounting with Keys

**Problem**: React reuses component instances when route parameters change, causing stale data.

**Solution**: Use unique `key` props to force remounting.

```typescript
// Bad: Component instance reused when resultName changes
<CategoryResultsGrid />

// Good: New instance created for each result
<CategoryResultsGrid
  key={`${projectId}-${resultName}`}
/>
```

**Applied To**: All major view components (CategoryResultsView, CategoryAnalysisMultisetView, all chart components)

### Pattern 7: Selection Bridge (Cross-Dimension)

**Problem**: Need to select categories based on cluster membership (or vice versa).

**Solution**: Utility functions that traverse the dimension mapping.

```typescript
// Get all categories in selected clusters
export function selectCategoriesInClusters(
  clusterIds: Set<number>,
  categoriesWithUmap: CategoryWithUmap[]
): string[] {
  return categoriesWithUmap
    .filter(cat => cat.cluster !== null && clusterIds.has(cat.cluster))
    .map(cat => cat.categoryId || '')
    .filter(id => id !== '');
}

// Get all clusters containing selected categories
export function selectClustersOfCategories(
  categoryIds: Set<string>,
  categoriesWithUmap: CategoryWithUmap[]
): Set<number> {
  const clusters = new Set<number>();
  categoriesWithUmap
    .filter(cat => categoryIds.has(cat.categoryId || ''))
    .forEach(cat => {
      if (cat.cluster !== null) clusters.add(cat.cluster);
    });
  return clusters;
}
```

**File**: `src/main/frontend/utils/selectionBridge.ts`

---

## 4. File Structure

```
bmdexpress-web/
├── src/main/
│   ├── java/                           # Backend (Spring Boot)
│   │   └── com/sciome/
│   │       ├── controller/             # REST endpoints
│   │       ├── service/                # Business logic
│   │       ├── model/                  # Domain models
│   │       └── dto/                    # Data transfer objects
│   │
│   ├── frontend/                       # Frontend (React + TypeScript)
│   │   ├── views/                      # Top-level route views
│   │   │   ├── @index.tsx              # Main layout with sidebar
│   │   │   ├── CategoryResultsView.tsx         # Single result view
│   │   │   └── CategoryAnalysisMultisetView.tsx # Multi-set view
│   │   │
│   │   ├── components/                 # Reusable components
│   │   │   ├── CategoryResultsGrid.tsx         # Main data table
│   │   │   ├── MasterFilterComponent.tsx       # Global filters
│   │   │   ├── NavigationSidebar.tsx           # Tree navigation
│   │   │   ├── charts/                         # Chart components
│   │   │   │   ├── UmapScatterPlot.tsx
│   │   │   │   ├── BMDvsPValueScatter.tsx
│   │   │   │   ├── BMDBoxPlot.tsx
│   │   │   │   ├── AccumulationCharts.tsx
│   │   │   │   ├── RangePlot.tsx
│   │   │   │   ├── utils/              # Chart utilities
│   │   │   │   │   └── displayModeStyles.ts    # inFocus-based styling
│   │   │   │   └── hooks/              # Chart-specific hooks
│   │   │   │       ├── useReactiveState.ts     # Core reactive hook
│   │   │   │       ├── useClusterLegendInteraction.ts
│   │   │   │       └── useReactiveStyling.ts
│   │   │   │
│   │   │   ├── categoryTable/          # Table column definitions
│   │   │   │   ├── columns/
│   │   │   │   │   ├── fixedColumns.ts
│   │   │   │   │   ├── primaryFilterColumns.ts
│   │   │   │   │   ├── preFilterColumns.ts
│   │   │   │   │   ├── bmdStatisticsColumns.ts
│   │   │   │   │   ├── fishersColumns.ts
│   │   │   │   │   ├── filterAndPercentileColumns.ts
│   │   │   │   │   ├── directionalColumns.ts
│   │   │   │   │   ├── foldChangeColumns.ts
│   │   │   │   │   ├── advancedColumns.ts
│   │   │   │   │   └── rankColumns.ts
│   │   │   │   │
│   │   │   │   └── utils/              # Table utilities
│   │   │   │       ├── types.ts                # ColumnVisibility interface
│   │   │   │       ├── columnVisibility.ts     # Show/hide logic
│   │   │   │       ├── columnRelevance.ts      # Analysis-type filtering
│   │   │   │       ├── formatters.ts           # Number formatting
│   │   │   │       ├── numberPadding.ts        # Decimal alignment
│   │   │   │       └── headerFormatting.tsx    # Bold/underline headers
│   │   │   │
│   │   │   └── VennDiagram.tsx         # Multi-set comparison
│   │   │
│   │   ├── store/                      # Redux state management
│   │   │   ├── store.ts                        # Store configuration
│   │   │   └── slices/
│   │   │       ├── categoryResultsSlice.ts     # Main state slice
│   │   │       ├── umapIntegration.ts          # UMAP data joining
│   │   │       └── navigationSlice.ts          # Sidebar state
│   │   │
│   │   ├── services/                   # Data services
│   │   │   ├── UmapDataService.ts              # UMAP reference data (19K GO terms)
│   │   │   └── CategoryAnalysisService.ts      # Backend API calls
│   │   │
│   │   ├── types/                      # TypeScript type definitions
│   │   │   ├── reactiveTypes.ts                # Reactive selection types
│   │   │   ├── categoryTypes.ts                # CategoryWithFocus, CategoryWithUmap
│   │   │   ├── visibilityTypes.ts              # DisplayMode, VisibilityState
│   │   │   └── filterTypes.ts                  # Filter system types
│   │   │
│   │   ├── utils/                      # Utility functions
│   │   │   ├── selectionBridge.ts              # Cross-dimension selection
│   │   │   ├── clusterColors.ts                # Cluster color palette
│   │   │   └── filterRelevance.ts              # Analysis-specific filters
│   │   │
│   │   └── generated/                  # Hilla-generated types
│   │       └── com/sciome/dto/                 # Java DTO TypeScript types
│   │
│   └── resources/
│       └── data/
│           └── go_bp_umap_with_clusters.json   # UMAP reference (19,896 terms)
│
├── target/                             # Build output
├── node_modules/                       # Dependencies
└── [Documentation files]               # *.md files (see DOCUMENTATION_INDEX.md)
```

---

## 5. State Management

### Redux Store Structure

```typescript
// Root state shape
{
  categoryResults: {
    // Data
    data: CategoryAnalysisResultDto[],          // Raw data from backend
    filteredData: CategoryAnalysisResultDto[],  // After filtering
    sortConfig: { key: string, direction: 'asc' | 'desc' },

    // Filters
    masterFilters: {
      bmd5thPercentile: { min: number | null, max: number | null },
      percentage: { min: number | null, max: number | null },
      genesPassedFilters: { min: number | null }
    },
    columnFilters: Record<string, FilterValue>,
    hideCategoriesWithoutBMD: boolean,

    // Selection (REACTIVE - The Core State)
    reactiveSelection: {
      category: {
        selectedIds: Set<string>,
        source: 'table' | 'umap' | 'chart' | null
      },
      cluster: {
        selectedIds: Set<number>,
        source: 'umap' | 'legend' | null
      }
    },

    // NOTE: Selection state is now in visibilitySlice.highlightedIds
    // The reactiveSelection above is the primary selection mechanism

    // Sorting (default: clusterId with special handling for -1, -2)
    sortColumn: 'clusterId' | string,
    sortDirection: 'asc' | 'desc',

    // Metadata
    analysisType: string | null,        // e.g., "GO_BP", "KEGG"
    analysisParameters: { ... },
    viewMode: 'simple' | 'power',

    // Loading states
    loading: boolean,
    error: string | null
  },

  umapIntegration: {
    categoryDataWithUmap: CategoryWithUmap[],  // Joined data
    umapDataLoaded: boolean
  },

  navigation: {
    selectedProject: string | null,
    selectedAnalysisType: string | null,       // Multi-set view
    selectedCategoryResult: string | null      // Single-result view
  },

  visibility: {
    displayMode: 'highlight' | 'dim' | 'isolate',  // How to show out-of-focus items
    highlightedIds: Set<string>,                    // Currently highlighted category IDs
    // highlight = Show All (full opacity)
    // dim = Dim Others (reduced opacity, default)
    // isolate = Hide Others (hidden)
  }
}
```

### Key Actions

```typescript
// Data management
setData(data: CategoryAnalysisResultDto[])
setAnalysisType(type: string)
setSortConfig(config: SortConfig)

// Filtering
setMasterFilters(filters: MasterFilters)
setColumnFilter(column: string, value: FilterValue)
setHideCategoriesWithoutBMD(hide: boolean)

// Reactive selection (PRIMARY)
setReactiveSelection(type: ReactiveType, selectedIds: Set, source: string)
clearReactiveSelection(type: ReactiveType)

// Visibility state (in visibilitySlice - single source of truth)
setHighlightedIds(ids: string[])
toggleHighlight(id: string)
clearHighlights()
setDisplayMode(mode: 'highlight' | 'dim' | 'isolate')

// Navigation
setSelectedProject(projectId: string)
setSelectedAnalysisType(analysisType: string)
setSelectedCategoryResult(resultName: string)
```

### Selector Examples

```typescript
// Basic selectors
const data = useAppSelector(selectAllData);
const analysisType = useAppSelector((state) => state.categoryResults.analysisType);

// Memoized selectors
const filteredData = useAppSelector(selectFilteredData);
const sortedData = useAppSelector(selectSortedData);

// UMAP integration
const dataWithUmap = useAppSelector(selectCategoryDataWithUmap);
const categoriesWithUmapOnly = useAppSelector(selectCategoriesWithUmapOnly);

// Selection (using visibilitySlice)
import { selectHighlightedIds } from '../store/slices/visibilitySlice';
const highlightedIds = useAppSelector(selectHighlightedIds);
const isSelected = highlightedIds.has(categoryId);
```

---

## 6. Core Abstractions

### 6.1 ReactiveType System

**Definition** (`reactiveTypes.ts`):

```typescript
// Types of selectable entities
export type ReactiveType =
  | 'categoryId'    // GO terms, pathways
  | 'clusterId';    // UMAP clusters
  // Future: 'geneId', 'pathwayId', etc.

// Selection state for each type
export interface ReactiveSelectionState {
  selectedIds: Set<string | number>;
  source: string | null;  // Which component triggered selection
}

// Full reactive state
export interface ReactiveSelectionMap {
  category: ReactiveSelectionState;
  cluster: ReactiveSelectionState;
}
```

### 6.2 useReactiveState Hook

**Purpose**: Universal interface for selection operations.

**API**:

```typescript
const state = useReactiveState(type: ReactiveType);

// Returns:
{
  selectedIds: Set<string | number>,
  source: string | null,

  // Check if item is selected
  isSelected: (id: string | number) => boolean,

  // Select/deselect single item
  handleSelect: (
    id: string | number,
    isMultiSelect: boolean,
    source: string
  ) => void,

  // Bulk selection
  handleMultiSelect: (
    ids: (string | number)[],
    source: string
  ) => void,

  // Clear all selections
  handleClear: () => void
}
```

**Implementation** (`useReactiveState.ts`):

```typescript
export function useReactiveState(type: ReactiveType) {
  const dispatch = useAppDispatch();
  const reactiveKey = type === 'categoryId' ? 'category' : 'cluster';

  const selectionState = useAppSelector(
    (state) => state.categoryResults.reactiveSelection[reactiveKey]
  );

  const isSelected = useCallback(
    (id: string | number) => selectionState.selectedIds.has(id),
    [selectionState.selectedIds]
  );

  const handleSelect = useCallback(
    (id: string | number, isMultiSelect: boolean, source: string) => {
      const newSelectedIds = new Set(selectionState.selectedIds);

      if (isMultiSelect) {
        // Toggle
        if (newSelectedIds.has(id)) {
          newSelectedIds.delete(id);
        } else {
          newSelectedIds.add(id);
        }
      } else {
        // Replace
        newSelectedIds.clear();
        newSelectedIds.add(id);
      }

      dispatch(setReactiveSelection({
        type: reactiveKey,
        selectedIds: newSelectedIds,
        source
      }));
    },
    [selectionState.selectedIds, dispatch, reactiveKey]
  );

  // ... handleMultiSelect, handleClear implementations

  return {
    selectedIds: selectionState.selectedIds,
    source: selectionState.source,
    isSelected,
    handleSelect,
    handleMultiSelect,
    handleClear
  };
}
```

### 6.3 UMAP Data Service

**Purpose**: O(1) lookup for UMAP coordinates and cluster membership.

**Data Structure**:

```typescript
// Reference data: ~19,896 GO Biological Process terms
// File: src/main/resources/data/go_bp_umap_with_clusters.json
[
  {
    "goId": "GO:0008150",
    "umapX": 5.234,
    "umapY": -2.456,
    "cluster": 12
  },
  // ... 19,895 more
]
```

**Service API** (`UmapDataService.ts`):

```typescript
class UmapDataService {
  private dataMap: Map<string, UmapEntry>;

  constructor(data: UmapEntry[]) {
    this.dataMap = new Map(data.map(entry => [entry.goId, entry]));
  }

  // O(1) lookup by GO ID
  getByGoId(goId: string): UmapEntry | undefined {
    return this.dataMap.get(goId);
  }

  // Get all unique cluster IDs
  getAllClusterIds(): number[] {
    const clusters = new Set<number>();
    this.dataMap.forEach(entry => {
      if (entry.cluster !== null) clusters.add(entry.cluster);
    });
    return Array.from(clusters).sort((a, b) => a - b);
  }

  // Check if GO ID has UMAP data
  has(goId: string): boolean {
    return this.dataMap.has(goId);
  }
}

// Singleton instance
export const umapDataService = new UmapDataService(umapData);
```

### 6.4 Column Relevance System

**Purpose**: Different analysis types have different meaningful columns.

**Example**:
- **GENE analysis**: Each row is a single gene → gene count columns are meaningless
- **GO_BP analysis**: Each row is a pathway with multiple genes → gene counts are meaningful

**API** (`columnRelevance.ts`):

```typescript
// Check if column group is relevant
function isColumnRelevant(
  columnKey: keyof ColumnVisibility,
  analysisType: string | null
): boolean

// Get all relevant column keys
function getRelevantColumns(
  analysisType: string | null
): (keyof ColumnVisibility)[]

// Filter visibility settings
function filterRelevantColumns(
  visibility: ColumnVisibility,
  analysisType: string | null
): ColumnVisibility
```

**Usage in Components**:

```typescript
// In CategoryResultsGrid
const relevantColumns = getRelevantColumns(analysisType);

// Only show relevant column groups in UI
{relevantColumns.includes('geneCounts') && (
  <div>Gene Counts controls...</div>
)}
```

### 6.5 Filter Relevance System

**Purpose**: Same concept as columns - some filters only make sense for certain analysis types.

**API** (`filterRelevance.ts`):

```typescript
// Check if filter is relevant
function isFilterRelevant(
  fieldName: FilterableFieldName,
  analysisType: string | null
): boolean

// Get relevant filter field names
function getRelevantFilters(
  analysisType: string | null
): FilterableFieldName[]

// Get filters grouped by category
function getRelevantFiltersByCategory(
  analysisType: string | null
): Record<string, FilterableFieldName[]>
```

---

## 7. Component Hierarchy

### Top-Level Layout

```
@index.tsx (Root Layout)
├── NavigationSidebar
│   └── Ant Design Tree (projects → analysis types → results)
│
└── Outlet (React Router)
    ├── CategoryResultsView (Single result)
    │   ├── MasterFilterComponent
    │   ├── Tabs
    │   │   ├── Table Tab
    │   │   │   └── CategoryResultsGrid
    │   │   ├── Charts Tab
    │   │   │   ├── UmapScatterPlot
    │   │   │   ├── BMDvsPValueScatter
    │   │   │   ├── BMDBoxPlot
    │   │   │   ├── AccumulationCharts
    │   │   │   └── RangePlot
    │   │   └── Curve Overlay Tab
    │   │       └── PathwayCurveViewer
    │
    └── CategoryAnalysisMultisetView (Multi-set comparison)
        ├── VennDiagram
        └── Result List (tags)
```

### Data Flow in CategoryResultsView

```
1. Component mounts
   ↓
2. useEffect loads data via CategoryAnalysisService
   ↓
3. Dispatch setData(results)
   ↓
4. Redux state updated
   ↓
5. Selectors compute derived data:
   - selectFilteredData (applies masterFilters + columnFilters)
   - selectSortedData (applies sort)
   - selectCategoryDataWithUmap (joins with UMAP coordinates)
   ↓
6. Child components subscribe to selectors
   ↓
7. Components render with memoized data
   ↓
8. User interaction (e.g., row click)
   ↓
9. Dispatch setReactiveSelection('category', ids, 'table')
   ↓
10. All components with useReactiveState('categoryId') re-render
```

### Chart Component Pattern

**Standard Structure**:

```typescript
export default function MyChart() {
  // 1. Get reactive state
  const categoryState = useReactiveState('categoryId');
  const clusterState = useReactiveState('clusterId');

  // 2. Get data from Redux
  const categoriesWithUmap = useAppSelector(selectCategoryDataWithUmap);
  const analysisType = useAppSelector((state) => state.categoryResults.analysisType);

  // 3. Get cluster colors (consistent across all charts)
  const clusterColors = useClusterColors();

  // 4. Filter data based on selection
  const selectedCategories = useMemo(() => {
    return categoriesWithUmap.filter(cat =>
      categoryState.isSelected(cat.categoryId || '')
    );
  }, [categoriesWithUmap, categoryState.selectedIds]);

  // 5. Prepare Plotly traces
  const traces = useMemo(() => {
    // Background trace (all data)
    const bgTrace = { /* ... */ };

    // Foreground trace (selected data)
    const fgTrace = { /* ... */ };

    return [bgTrace, fgTrace];
  }, [categoriesWithUmap, selectedCategories, clusterColors]);

  // 6. Handle click events
  const handleClick = useCallback((event: PlotMouseEvent) => {
    const categoryId = event.points[0].customdata;
    const isMultiSelect = event.event.ctrlKey || event.event.metaKey;
    categoryState.handleSelect(categoryId, isMultiSelect, 'chart-name');
  }, [categoryState]);

  // 7. Render
  return (
    <Plot
      data={traces}
      layout={layout}
      onClick={handleClick}
      config={{ responsive: true }}
    />
  );
}
```

---

## 8. Data Flow

### 8.1 Data Loading Flow

```
User clicks category result in sidebar
  ↓
NavigationSidebar calls setSelectedCategoryResult(resultName)
  ↓
React Router navigates to /category-results
  ↓
CategoryResultsView mounts/remounts (key={projectId-resultName})
  ↓
useEffect triggers:
  const data = await CategoryAnalysisService.getCategoryAnalysisResults(
    projectId,
    resultName
  );
  ↓
Dispatch setData(data.results)
Dispatch setAnalysisType(data.analysisType)
Dispatch setAnalysisParameters(data.parameters)
  ↓
Redux state updated, components re-render
```

### 8.2 Filtering Flow

```
User adjusts MasterFilterComponent slider
  ↓
Dispatch setMasterFilters({ bmd5thPercentile: { min: 0.5, max: 2.0 } })
  ↓
Redux state.categoryResults.masterFilters updated
  ↓
selectFilteredData selector recomputes:
  1. Start with raw data
  2. Apply master filters (BMD 5th, percentage, genes passed)
  3. Apply column filters (if any)
  4. Return filtered data
  ↓
All components subscribed to selectFilteredData re-render:
  - CategoryResultsGrid shows fewer rows
  - Charts show fewer points
  - Curve overlay loads fewer curves
```

### 8.3 Selection Flow (Bidirectional)

**Scenario 1: User clicks table row**

```
CategoryResultsGrid onRow={{ onClick: handleRowClick }}
  ↓
handleRowClick extracts categoryId, checks isMultiSelect
  ↓
categoryState.handleSelect(categoryId, isMultiSelect, 'table')
  ↓
Dispatch setReactiveSelection('category', newSelectedIds, 'table')
  ↓
Redux state.categoryResults.reactiveSelection.category updated
  ↓
All components with useReactiveState('categoryId') re-render:
  - UmapScatterPlot highlights selected points
  - BMDBoxPlot colors selected markers
  - AccumulationCharts emphasizes selected curves
  - PathwayCurveViewer loads curves for selected categories
```

**Scenario 2: User clicks UMAP point**

```
UmapScatterPlot onClick={handleClick}
  ↓
handleClick extracts categoryId from point customdata
  ↓
categoryState.handleSelect(categoryId, isMultiSelect, 'umap')
  ↓
Dispatch setReactiveSelection('category', newSelectedIds, 'umap')
  ↓
Redux state updated
  ↓
All components re-render:
  - CategoryResultsGrid scrolls to and highlights selected row
  - Other charts update highlighting
```

### 8.4 UMAP Integration Flow

```
Component needs category + UMAP data
  ↓
const dataWithUmap = useAppSelector(selectCategoryDataWithUmap);
  ↓
Selector implementation (umapIntegration.ts):
  export const selectCategoryDataWithUmap = createSelector(
    [selectAllData],  // From categoryResultsSlice
    (categories) => {
      return categories.map(cat => {
        const umapEntry = umapDataService.getByGoId(cat.categoryId || '');
        return {
          ...cat,
          umapX: umapEntry?.umapX,
          umapY: umapEntry?.umapY,
          cluster: umapEntry?.cluster
        };
      });
    }
  );
  ↓
Returns CategoryWithUmap[] (original data + UMAP coordinates + cluster)
  ↓
Component uses joined data for visualization
```

---

## 9. Key Implementation Files

### 9.1 categoryResultsSlice.ts

**Purpose**: Central Redux slice for all category analysis state.

**Key Responsibilities**:
- Store raw and filtered data
- Manage master filters, column filters, sort config
- **Maintain reactive selection state** (most important)
- Handle bulk operations (select all, invert, clear)

**Critical Code**:

```typescript
// Reactive selection reducer
setReactiveSelection: (state, action: PayloadAction<{
  type: 'category' | 'cluster',
  selectedIds: Set<string | number>,
  source: string
}>) => {
  state.reactiveSelection[action.payload.type] = {
    selectedIds: action.payload.selectedIds,
    source: action.payload.source
  };
}

// Filtered data selector
export const selectFilteredData = createSelector(
  [selectAllData, selectMasterFilters, selectColumnFilters, selectHideBMD],
  (data, masterFilters, columnFilters, hideBMD) => {
    let filtered = data;

    // Apply master filters
    if (masterFilters.bmd5thPercentile.min !== null) {
      filtered = filtered.filter(cat =>
        cat.bmdFifthPercentileTotalGenes >= masterFilters.bmd5thPercentile.min
      );
    }
    // ... more filters

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, value]) => {
      filtered = applyColumnFilter(filtered, column, value);
    });

    // Hide categories without BMD
    if (hideBMD) {
      filtered = filtered.filter(cat => cat.bmdMean !== null);
    }

    return filtered;
  }
);
```

### 9.2 useReactiveState.ts

**Purpose**: Universal hook for reactive selection.

**See Section 6.2** for full implementation.

**Usage Examples**:

```typescript
// In table component
const categoryState = useReactiveState('categoryId');

<Table
  onRow={(record) => ({
    onClick: (e) => {
      const isMulti = e.ctrlKey || e.metaKey;
      categoryState.handleSelect(record.categoryId, isMulti, 'table');
    },
    className: categoryState.isSelected(record.categoryId) ? 'selected-row' : ''
  })}
/>

// In chart component
const categoryState = useReactiveState('categoryId');

const handlePlotClick = (event) => {
  const id = event.points[0].customdata;
  const isMulti = event.event.ctrlKey || event.event.metaKey;
  categoryState.handleSelect(id, isMulti, 'chart');
};
```

### 9.3 CategoryResultsGrid.tsx

**Purpose**: Main data table with 20+ columns.

**Key Features**:
- Dynamic column visibility (40+ possible columns)
- Column width optimization (most numeric columns 55-70px)
- Primary Filter Columns (analysis-type dependent)
- Pre-Filter Columns (ANOVA, future: Williams, Curve Fit)
- Bulk selection controls in header
- Horizontal scrolling with fixed left columns
- localStorage persistence

**Column Definition Pattern**:

```typescript
// columns/ subdirectory contains modular column definitions
import {
  getFixedColumns,
  getPrimaryFilterColumns,
  getPreFilterColumns,
  getBMDExtendedColumns,
  // ... 15+ more
} from './categoryTable/columns';

const columns: ColumnsType<CategoryAnalysisResultWithRank> = useMemo(() => {
  const cols: ColumnsType<CategoryAnalysisResultWithRank> = [];

  // Always show fixed columns (Cluster, Category ID, Description)
  // Cluster column displays: number (0-N), "unclassified" (-1), "not in reference" (-2)
  cols.push(...getFixedColumns(viewMode, analysisInfo));

  // Conditionally add column groups based on visibility
  if (columnVisibility.primaryFilters.all ||
      Object.values(columnVisibility.primaryFilters.columns).some(v => v)) {
    cols.push(...getPrimaryFilterColumns(
      analysisType,
      columnVisibility.primaryFilters.all
        ? undefined
        : columnVisibility.primaryFilters.columns,
      paddingMap
    ));
  }

  // ... repeat for 15+ column groups

  return cols;
}, [columnVisibility, viewMode, paddingMap, analysisType]);
```

**Primary Filter Columns** (Analysis-Type Dependent):

```typescript
// For multi-gene categories (GO, pathways, defined sets)
// → Shows: Genes (Passed), All Genes, Percentage

// For single-gene analysis (GENE type)
// → Shows: BMD Mean, BMD Median

// Implementation: primaryFilterColumns.ts
export function getPrimaryFilterColumns(
  analysisType: string | null,
  visibleColumns?: Record<string, boolean>,
  paddingMap?: PaddingMap
): ColumnsType<CategoryAnalysisResultDto>
```

**Pre-Filter Columns** (Statistical Tests):

```typescript
// Currently: ANOVA (Significant Count)
// Future: Williams Trend Test, Curve Fit, etc.

// Implementation: preFilterColumns.ts
export function getPreFilterColumns(
  visibleColumns?: Record<string, boolean>,
  paddingMap?: PaddingMap
): ColumnsType<CategoryAnalysisResultDto>
```

### 9.4 UmapScatterPlot.tsx

**Purpose**: Scatter plot of 19,896 GO terms with HDBSCAN clustering.

**Key Features**:
- Interactive cluster legend with 3-way toggle
- Reference space backdrop toggle (full/dimmed/hidden)
- Click-to-select points
- Multi-select with Cmd/Ctrl
- Bidirectional sync with table

**Implementation Highlights**:

```typescript
// useClusterLegendInteraction hook
const {
  clusterVisibility,
  backdropOpacity,
  handleLegendClick,
  handleBackdropClick,
  getClusterStyle
} = useClusterLegendInteraction(clusterState);

// Legend click handler (3-way toggle)
function handleLegendClick(clusterId: number, isMultiSelect: boolean) {
  if (isMultiSelect) {
    // Multi-select: add/remove from selection
    clusterState.handleSelect(clusterId, true, 'legend');
  } else {
    // Single-select: cycle through visibility states
    const currentState = clusterVisibility.get(clusterId) || 0;
    const nextState = (currentState + 1) % 3;

    if (nextState === 0) {
      // Deselecting → clear cluster selection
      clusterState.handleClear();
    } else {
      // Selecting or hiding → select cluster
      clusterState.handleSelect(clusterId, false, 'legend');
    }

    setClusterVisibility(new Map([[clusterId, nextState]]));
  }
}

// Apply styles based on state
const style = getClusterStyle(clusterId);
// Returns: { opacity: 0|1, lineWidth: 0|2 } based on state
```

### 9.5 PathwayCurveViewer.tsx

**Purpose**: Dose-response curve visualization (reactive).

**Before Session 13 Part 8**: Manual 9-step process.

**After Session 13 Part 8**: Automatic reactive loading.

**Implementation**:

```typescript
import { selectHighlightedIds } from '../store/slices/visibilitySlice';
const highlightedIds = useAppSelector(selectHighlightedIds);

// Automatically load curves when selection changes
useEffect(() => {
  const loadCurves = async () => {
    if (highlightedIds.size === 0) {
      setLoadedData([]);
      return;
    }

    setLoading(true);

    // Load all genes for all selected categories
    const allGeneData = [];
    for (const categoryId of highlightedIds) {
      const genes = await CategoryAnalysisService.getGenesForCategory(
        projectId,
        resultName,
        categoryId
      );
      allGeneData.push(...genes);
    }

    setLoadedData(allGeneData);
    setLoading(false);
  };

  loadCurves();
}, [highlightedIds, projectId, resultName]);

// Render curves automatically
return (
  <div>
    <Tag>Selected: {highlightedIds.size} categories</Tag>
    <Tag>Curves: {loadedData.length}</Tag>

    {loadedData.map(gene => (
      <DoseResponseCurve
        key={gene.probeId}
        data={gene}
        models={['Hill', 'Power', 'Exponential', 'Polynomial']}
      />
    ))}
  </div>
);
```

### 9.6 VennDiagram.tsx

**Purpose**: Multi-dataset comparison (2-5 sets).

**Excel Export Implementation**:

```typescript
async function exportToExcel() {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Summary with embedded PNG
  const summarySheet = workbook.addWorksheet('Summary');

  // Capture diagram as PNG
  const diagramDiv = document.getElementById('venn-diagram');
  const canvas = await html2canvas(diagramDiv, { scale: 2 });
  const pngDataUrl = canvas.toDataURL('image/png');

  // Add image to workbook
  const imageId = workbook.addImage({
    base64: pngDataUrl,
    extension: 'png'
  });

  // Embed in sheet at correct size
  summarySheet.addImage(imageId, {
    tl: { col: 0, row: 5 },
    ext: { width: canvas.width / 2, height: canvas.height / 2 }
  });

  // Sheet 2: Instructions for creating native Excel Venn diagrams
  // Sheet 3: Overlap counts table
  // Sheets 4+: One sheet per overlap with category lists

  // Save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, 'venn-diagram.xlsx');
}
```

---

## 10. Development Patterns

### 10.1 Adding a New Chart Component

**Steps**:

1. **Create component file**: `src/main/frontend/components/charts/MyNewChart.tsx`

2. **Implement standard structure**:

```typescript
import React, { useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { useAppSelector } from '../../store/hooks';
import { selectCategoryDataWithUmap } from '../../store/slices/umapIntegration';
import { useReactiveState } from './hooks/useReactiveState';
import { useClusterColors } from './hooks/useClusterColors';

export default function MyNewChart() {
  // 1. Get reactive state
  const categoryState = useReactiveState('categoryId');

  // 2. Get data
  const categoriesWithUmap = useAppSelector(selectCategoryDataWithUmap);

  // 3. Get cluster colors
  const clusterColors = useClusterColors();

  // 4. Prepare traces
  const traces = useMemo(() => {
    // Background trace (all data, gray)
    const bgTrace = {
      x: categoriesWithUmap.map(cat => cat.someXValue),
      y: categoriesWithUmap.map(cat => cat.someYValue),
      mode: 'markers',
      marker: {
        color: 'rgba(128, 128, 128, 0.3)',
        size: 4
      },
      showlegend: false,
      hoverinfo: 'skip'
    };

    // Foreground trace (selected data, colored by cluster)
    const selectedCategories = categoriesWithUmap.filter(cat =>
      categoryState.isSelected(cat.categoryId || '')
    );

    const fgTrace = {
      x: selectedCategories.map(cat => cat.someXValue),
      y: selectedCategories.map(cat => cat.someYValue),
      mode: 'markers',
      marker: {
        color: selectedCategories.map(cat =>
          clusterColors.get(cat.cluster || -1) || '#666'
        ),
        size: 8,
        opacity: 1.0,
        line: { color: 'white', width: 1 }
      },
      customdata: selectedCategories.map(cat => cat.categoryId),
      showlegend: true
    };

    return [bgTrace, fgTrace];
  }, [categoriesWithUmap, categoryState.selectedIds, clusterColors]);

  // 5. Handle click
  const handleClick = useCallback((event: Plotly.PlotMouseEvent) => {
    const categoryId = event.points[0].customdata as string;
    const isMulti = event.event.ctrlKey || event.event.metaKey;
    categoryState.handleSelect(categoryId, isMulti, 'mynewchart');
  }, [categoryState]);

  // 6. Render
  return (
    <Plot
      data={traces}
      layout={{
        title: 'My New Chart',
        xaxis: { title: 'X Axis' },
        yaxis: { title: 'Y Axis' },
        hovermode: 'closest'
      }}
      onClick={handleClick}
      config={{ responsive: true }}
      style={{ width: '100%', height: '600px' }}
    />
  );
}
```

3. **Add to CategoryResultsView**:

```typescript
// In CategoryResultsView.tsx
import MyNewChart from '../components/charts/MyNewChart';

// Add tab item
<Tabs.TabPane tab="My New Chart" key="mynewchart">
  <MyNewChart key={`${projectId}-${resultName}-mynewchart`} />
</Tabs.TabPane>
```

4. **Test interactions**:
   - Click chart point → table row highlights
   - Click table row → chart point highlights
   - Multi-select with Cmd/Ctrl
   - Clear selection → chart returns to normal

### 10.2 Adding a New Column Group

**Steps**:

1. **Create column definition file**: `src/main/frontend/components/categoryTable/columns/myNewColumns.ts`

```typescript
import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';
import { formatHeader } from '../utils/headerFormatting';

export function getMyNewColumns(
  visibleColumns?: Record<string, boolean>,
  paddingMap?: PaddingMap
): ColumnsType<CategoryAnalysisResultDto> {
  const allColumns: Record<string, any> = {
    column1: {
      title: formatHeader('Column 1'),
      dataIndex: 'myField1',
      key: 'myField1',
      width: 60,
      align: 'center' as const,
      render: (value: number) => formatNumber(value, 2),
      sorter: (a, b) => (a.myField1 || 0) - (b.myField1 || 0),
    },
    column2: {
      title: formatHeader('Column 2'),
      dataIndex: 'myField2',
      key: 'myField2',
      width: 60,
      align: 'center' as const,
      render: (value: number) => formatNumber(value, 2),
      sorter: (a, b) => (a.myField2 || 0) - (b.myField2 || 0),
    },
  };

  // If no visibility specified, show all
  if (!visibleColumns) {
    return [{
      title: formatHeader('My New Group'),
      align: 'center' as const,
      children: Object.values(allColumns),
    }];
  }

  // Filter based on visibility
  const visibleChildren = Object.entries(allColumns)
    .filter(([key]) => visibleColumns[key])
    .map(([, column]) => column);

  if (visibleChildren.length === 0) return [];

  return [{
    title: formatHeader('My New Group'),
    align: 'center' as const,
    children: visibleChildren,
  }];
}
```

2. **Export from index**: `src/main/frontend/components/categoryTable/columns/index.ts`

```typescript
export { getMyNewColumns } from './myNewColumns';
```

3. **Add to ColumnVisibility interface**: `src/main/frontend/components/categoryTable/utils/types.ts`

```typescript
export interface ColumnVisibility {
  // ... existing groups

  myNewGroup: ColumnGroup<
    | 'column1'
    | 'column2'
  >;
}

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  // ... existing defaults

  myNewGroup: {
    all: false,
    columns: {
      column1: false,
      column2: false,
    },
  },
};
```

4. **Add to column visibility helpers**: `src/main/frontend/components/categoryTable/utils/columnVisibility.ts`

```typescript
const COLUMN_GROUP_FIELDS: (keyof ColumnVisibility)[] = [
  // ... existing groups
  'myNewGroup',
];
```

5. **Add to column relevance** (if needed): `src/main/frontend/components/categoryTable/utils/columnRelevance.ts`

```typescript
// Add to appropriate category
const UNIVERSAL_COLUMNS: (keyof ColumnVisibility)[] = [
  // ... existing
  'myNewGroup',  // If relevant for all analysis types
];
```

6. **Integrate in CategoryResultsGrid**: `src/main/frontend/components/CategoryResultsGrid.tsx`

```typescript
// Import
import { getMyNewColumns } from './categoryTable/columns';

// Add to columns construction
if (columnVisibility.myNewGroup.all ||
    Object.values(columnVisibility.myNewGroup.columns).some(v => v)) {
  cols.push(...getMyNewColumns(
    columnVisibility.myNewGroup.all
      ? undefined
      : columnVisibility.myNewGroup.columns,
    paddingMap
  ));
}

// Add visibility controls in render
<div>My New Group</div>
<Checkbox
  checked={columnVisibility.myNewGroup.columns.column1}
  onChange={(e) => {
    setColumnVisibility({
      ...columnVisibility,
      myNewGroup: {
        ...columnVisibility.myNewGroup,
        columns: {
          ...columnVisibility.myNewGroup.columns,
          column1: e.target.checked
        }
      }
    });
  }}
>
  Column 1
</Checkbox>
```

### 10.3 Adding a New Selection Dimension

**Example**: Add gene-level selection (currently only category and cluster).

**Steps**:

1. **Add to ReactiveType**: `src/main/frontend/types/reactiveTypes.ts`

```typescript
export type ReactiveType =
  | 'categoryId'
  | 'clusterId'
  | 'geneId';  // NEW

export interface ReactiveSelectionMap {
  category: ReactiveSelectionState;
  cluster: ReactiveSelectionState;
  gene: ReactiveSelectionState;  // NEW
}
```

2. **Add state to Redux**: `src/main/frontend/store/slices/categoryResultsSlice.ts`

```typescript
interface CategoryResultsState {
  // ... existing state

  reactiveSelection: {
    category: { selectedIds: Set<string>, source: string | null },
    cluster: { selectedIds: Set<number>, source: string | null },
    gene: { selectedIds: Set<string>, source: string | null }  // NEW
  }
}

const initialState: CategoryResultsState = {
  // ...
  reactiveSelection: {
    category: { selectedIds: new Set(), source: null },
    cluster: { selectedIds: new Set(), source: null },
    gene: { selectedIds: new Set(), source: null }  // NEW
  }
};
```

3. **Update useReactiveState mapping**: `src/main/frontend/hooks/useReactiveState.ts`

```typescript
export function useReactiveState(type: ReactiveType) {
  const reactiveKey =
    type === 'categoryId' ? 'category' :
    type === 'clusterId' ? 'cluster' :
    'gene';  // NEW

  // ... rest of implementation unchanged
}
```

4. **Create selection bridge utilities** (if needed): `src/main/frontend/utils/selectionBridge.ts`

```typescript
// Example: Get genes in selected categories
export function selectGenesInCategories(
  categoryIds: Set<string>,
  categoryGeneMap: Map<string, string[]>
): string[] {
  const geneIds: string[] = [];
  categoryIds.forEach(catId => {
    const genes = categoryGeneMap.get(catId);
    if (genes) geneIds.push(...genes);
  });
  return geneIds;
}
```

5. **Use in components**:

```typescript
const geneState = useReactiveState('geneId');

// Select gene
geneState.handleSelect('GENE123', false, 'gene-table');

// Check selection
if (geneState.isSelected('GENE123')) {
  // Highlight gene
}
```

### 10.4 Debugging Patterns

**Enable Diagnostic Logging**:

```typescript
// In useReactiveState.ts, already present:
console.log(`[useReactiveState:${type}] Selected:`,
  Array.from(selectionState.selectedIds)
);
console.log(`[useReactiveState:${type}] Source:`, selectionState.source);

// In components:
console.log('[MyComponent] Rendering with data:', data.length);
console.log('[MyComponent] Selected categories:',
  Array.from(categoryState.selectedIds)
);
```

**Common Issues**:

1. **Component not updating on selection change**:
   - Check: Is component using `useReactiveState` or subscribing to reactive selectors?
   - Check: Is component wrapped in `React.memo()` incorrectly?

2. **Selection not synchronized across views**:
   - Check: Are all components using same `ReactiveType`? (e.g., all use 'categoryId')
   - Check: Is Redux DevTools showing state changes?

3. **Component not remounting on route change**:
   - Check: Does component have unique `key` prop? (e.g., `key={projectId-resultName}`)

4. **Performance issues with large datasets**:
   - Check: Are selectors properly memoized?
   - Check: Are expensive computations in useMemo?
   - Check: Is component re-rendering unnecessarily? (use React DevTools Profiler)

---

## 11. Current Status

### What's Working (Production-Ready)

✅ **Data Management**
- Project upload and parsing
- Category analysis results loading
- UMAP reference data integration (19,896 GO BP terms)
- Master filtering with localStorage persistence

✅ **Interactive Table**
- 20+ column groups (40+ total columns possible)
- Dynamic column visibility
- Analysis-type-aware columns (Primary Filters, Pre-Filters)
- Bulk selection operations
- Sorting, filtering, searching
- Horizontal scrolling with fixed columns

✅ **Reactive Visualizations**
- UmapScatterPlot: Interactive legend, 3-way toggle, backdrop control
- BMDvsPValueScatter: Two-layer rendering, cluster coloring
- BMDBoxPlot: Cluster markers with jitter, dynamic rescaling
- AccumulationCharts: Background + foreground layers, cluster coloring
- RangePlot: Top 20 pathways with cluster-colored error bars
- PathwayCurveViewer: Automatic reactive loading

✅ **Multi-Set Analysis**
- Three-level navigation (Project → Type → Result)
- CategoryAnalysisMultisetView
- VennDiagram with Excel export (embedded PNG)

✅ **State Management**
- Generic reactive selection infrastructure
- Bidirectional synchronization
- Source tracking
- Memoized selectors

✅ **Code Quality**
- Full TypeScript coverage
- Type-safe Hilla integration
- Modular architecture
- Reusable hooks and utilities
- Comprehensive documentation

### Known Limitations

⚠️ **Performance**
- Large datasets (1000+ categories) may need virtualization
- Excel export with many images can be slow

⚠️ **Features Not Yet Implemented**
- Synchronized Tables design (planned, not implemented)
- GCurveP and ModelAveraging curve types
- PDF export with vector graphics
- Complex boolean filter expressions
- Keyboard shortcuts (Ctrl+A, Esc)

⚠️ **Technical Debt**
- Verbose diagnostic logging (should be production-disabled)
- Some duplicate component instantiation
- Legacy selection state has been removed; all selection now uses visibilitySlice.highlightedIds

### Backend Integration Points

**Required Backend Endpoints** (via Hilla):

```typescript
// CategoryAnalysisService.ts
getCategoryAnalysisResults(projectId: string, resultName: string): Promise<{
  results: CategoryAnalysisResultDto[],
  analysisType: string,
  parameters: CategoryAnalysisParametersDto
}>

getGenesForCategory(
  projectId: string,
  resultName: string,
  categoryId: string
): Promise<GeneDto[]>

getDoseResponseData(
  projectId: string,
  probeId: string
): Promise<DoseResponseDataDto>

// VennDiagramService.ts
calculateOverlaps(
  projectId: string,
  resultNames: string[]
): Promise<VennOverlapDto>
```

---

## 12. Future Work

### High Priority

1. **Performance Optimization**
   - Implement virtual scrolling for table (1000+ rows)
   - Lazy load charts (only render visible tabs)
   - Web Workers for heavy computations (filtering, sorting)

2. **Export Enhancements**
   - PDF export with vector graphics
   - SVG export for charts
   - Batch export (all charts in ZIP)

3. **Keyboard Shortcuts**
   - Ctrl+A: Select all (filtered)
   - Ctrl+Shift+A: Select all (unfiltered)
   - Esc: Clear selection
   - Arrow keys: Navigate table
   - Space: Toggle row selection

4. **Advanced Filtering**
   - Boolean expressions (AND, OR, NOT)
   - Filter presets (save/load)
   - Global search across all columns

### Medium Priority

1. **Gene-Level Drill-Down**
   - Add 'geneId' reactive type
   - Gene detail view
   - Gene-level curve overlay

2. **Additional Chart Types**
   - Heatmap (categories × genes)
   - Network diagram (pathway interactions)
   - Volcano plot (fold change vs p-value)

3. **Collaboration Features**
   - Share selections via URL
   - Export/import filter configurations
   - Session persistence (restore state on refresh)

4. **Statistical Analysis**
   - Enrichment analysis
   - Correlation analysis
   - Trend detection

### Low Priority

1. **UI Enhancements**
   - Dark mode
   - Customizable color palettes
   - Responsive design (mobile/tablet)
   - Accessibility improvements (ARIA labels, keyboard nav)

2. **Documentation**
   - Interactive tutorials
   - Video guides
   - API documentation generator

3. **Testing**
   - Unit tests (Jest, React Testing Library)
   - Integration tests (Playwright)
   - Performance benchmarks

---

## Quick Reference: Common Tasks

### Task: Load and Display Data

```typescript
// 1. Call backend service
const data = await CategoryAnalysisService.getCategoryAnalysisResults(
  projectId,
  resultName
);

// 2. Dispatch to Redux
dispatch(setData(data.results));
dispatch(setAnalysisType(data.analysisType));

// 3. Use in component
const sortedData = useAppSelector(selectSortedData);
```

### Task: Handle Selection

```typescript
// Get reactive state
const categoryState = useReactiveState('categoryId');

// Click handler
const handleClick = (categoryId: string, isMulti: boolean) => {
  categoryState.handleSelect(categoryId, isMulti, 'my-component');
};

// Check if selected
const isSelected = categoryState.isSelected(categoryId);

// Clear selection
categoryState.handleClear();
```

### Task: Add Filter

```typescript
// Dispatch filter change
dispatch(setMasterFilters({
  bmd5thPercentile: { min: 0.5, max: 2.0 },
  percentage: { min: 10, max: null },
  genesPassedFilters: { min: 5 }
}));

// Use filtered data
const filteredData = useAppSelector(selectFilteredData);
```

### Task: Create Plotly Trace

```typescript
const trace = {
  x: data.map(d => d.xValue),
  y: data.map(d => d.yValue),
  mode: 'markers',
  marker: {
    color: data.map(d => getClusterColor(d.cluster)),
    size: 8,
    line: { color: 'white', width: 1 }
  },
  customdata: data.map(d => d.categoryId),
  text: data.map(d => d.categoryDescription),
  hovertemplate: '<b>%{text}</b><br>X: %{x}<br>Y: %{y}<extra></extra>',
  type: 'scatter'
};
```

---

## Conclusion

BMDExpress-3 Web is a mature, production-ready platform with sophisticated interactive features. The **reactive selection infrastructure** is the architectural foundation that enables all bidirectional interactions.

**Key Principles to Maintain**:

1. **Use reactive state for all selections** - Don't create ad-hoc selection state
2. **Two-layer visualization** - Always show context (gray background)
3. **Memoize expensive computations** - Use createSelector and useMemo
4. **Unique component keys** - Force remounting when data source changes
5. **Analysis-type awareness** - Respect column/filter relevance rules
6. **Type safety** - Maintain full TypeScript coverage
7. **Modular architecture** - Keep concerns separated (columns, utils, services)

**When Adding Features**:

- Ask: Can this use existing reactive infrastructure?
- Ask: Does this need a new selection dimension?
- Ask: Should this be memoized?
- Ask: Is this analysis-type specific?
- Document new patterns
- Update this guide

**Resources**:

- Session notes: Detailed history of feature evolution
- Code comments: Inline explanations of complex logic
- Type definitions: Self-documenting interfaces
- This guide: Comprehensive reference

Good luck! 🚀
