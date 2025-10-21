# BMDExpress Web - Codebase Architecture Overview

## Project Overview
BMDExpress Web is a Vaadin 24.9 + React 18 + TypeScript full-stack application using Hilla framework for browser-callable backend services. The application provides benchmark dose (BMD) analysis and functional classification for toxicogenomics data, specifically for category analysis results visualization and exploration.

### Technology Stack
- **Frontend**: React 18, TypeScript, Redux Toolkit, Ant Design (antd), Plotly.js, D3.js
- **Backend**: Spring Boot, Vaadin Hilla, Java 17+
- **UI Components**: Vaadin React Components, Ant Design Charts
- **Routing**: React Router 7.6
- **Build Tool**: Vite
- **Package Manager**: npm with Vaadin overrides

---

## 1. Overall Architecture

### High-Level Data Flow
```
Project File (.bm2)
    ↓
ProjectService (Backend)
    ↓
Redux Store (Frontend)
    ↓
React Components → Visualizations
```

### Deployment Structure
- **Single Page Application (SPA)** with file-based routing
- **Two operational modes**: Upload View (default) or Library View (configured)
- **Responsive layout** with sidebar navigation and main content area

---

## 2. Frontend Architecture

### Directory Structure
```
src/main/frontend/
├── views/
│   ├── @layout.tsx          # Main layout wrapper with AppLayout
│   ├── @index.tsx           # Home view (upload or library mode)
│   └── LibraryView.tsx       # Library view with tabs
├── components/
│   ├── ProjectTreeSidebar.tsx        # Project/category tree navigation
│   ├── CategoryResultsView.tsx       # Main results visualization container
│   ├── CategoryResultsGrid.tsx       # Data grid with selection
│   ├── PathwayCurveViewer.tsx        # Curve overlay visualization
│   └── charts/
│       ├── BMDvsPValueScatter.tsx    # Scatter plot (default)
│       ├── BMDBoxPlot.tsx            # Box plot (default)
│       ├── RangePlot.tsx             # Range plot
│       ├── BubbleChart.tsx           # Bubble chart
│       ├── BestModelsPieChart.tsx    # Pie chart of best models
│       ├── BarCharts.tsx             # BMD/BMDL bar charts
│       ├── AccumulationCharts.tsx    # Accumulation charts
│       ├── VennDiagram.tsx           # Venn diagram (2-5 datasets)
│       └── DoseResponseCurveChart.tsx
├── store/
│   ├── store.ts                      # Redux store configuration
│   ├── hooks.ts                      # Redux hooks (useAppDispatch, useAppSelector)
│   └── slices/
│       ├── navigationSlice.ts        # Project/result selection state
│       └── categoryResultsSlice.ts   # Category data, filters, selection
├── generated/
│   ├── endpoints.ts                  # Hilla service exports
│   ├── routes.tsx                    # Auto-generated routes
│   ├── CategoryResultsService.ts     # Generated endpoint client
│   ├── ProjectService.ts             # Generated endpoint client
│   ├── ConfigService.ts              # Generated endpoint client
│   └── com/sciome/dto/               # Generated DTO TypeScript models
└── themes/default/                   # Vaadin themes
```

### State Management (Redux)

**Navigation Slice** (`navigationSlice.ts`)
- Tracks: `selectedProject`, `selectedCategoryResult`
- Shared across app for tab/tree synchronization
- Cleared when project changes

**Category Results Slice** (`categoryResultsSlice.ts`)
- **Data State**:
  - `data`: Array of `CategoryAnalysisResultDto`
  - `loading`, `error`: Async loading states
  - `projectId`, `resultName`: Current context
  
- **Selection State** (Set<string>):
  - `selectedCategoryIds`: Set of category IDs selected by user
  - Used for cross-component highlighting in charts
  - Synchronized between table grid and visualizations
  
- **Filter State**:
  - `bmdMin`, `bmdMax`, `pValueMax`, `minGenesInCategory`, etc.
  - Real-time filtering applied to data
  
- **Display State**:
  - `highlightedRow`, `sortColumn`, `sortDirection`
  - `currentPage`, `pageSize` (for pagination)

**Selector Pattern** (Memoized):
- `selectFilteredData`: Applies filters to raw data
- `selectSortedData`: Applies sorting to filtered data
- `selectPaginatedData`: Applies pagination to sorted data
- `selectChartData`: Returns selected categories if any, otherwise all data
  - **Critical**: Charts react to this selector for dynamic highlighting

### Component Hierarchy

```
@layout.tsx (Provider + AppLayout)
├── Header
├── ProjectTreeSidebar
│   └── Tree (lazy loads category results)
└── Outlet
    ├── @index.tsx (HomeView)
    │   ├── Upload component
    │   ├── Projects list
    │   └── CategoryResultsView (conditionally)
    │
    └── LibraryView (if configured)
        └── Tabs (one per category result)
            └── CategoryResultsView (per tab)
                ├── CategoryResultsGrid (with row selection)
                └── Chart Selector
                    ├── BMDvsPValueScatter (default)
                    ├── BMDBoxPlot (default)
                    ├── RangePlot
                    ├── BubbleChart
                    ├── BestModelsPieChart
                    ├── BarCharts
                    ├── AccumulationCharts
                    └── VennDiagram
```

### Category Data Structure

**CategoryAnalysisResultDto** (Core data entity):
```typescript
{
  categoryId: string;              // Unique identifier
  categoryDescription: string;     // Pathway/GO term name
  
  // Gene counts
  geneAllCount: number;
  geneCountSignificantANOVA: number;
  genesThatPassedAllFilters: number;
  percentage: number;
  
  // Fisher's Exact Test
  fishersA-D: number;              // Contingency table values
  fishersExactLeftPValue: number;
  fishersExactRightPValue: number;
  fishersExactTwoTailPValue: number;
  
  // BMD statistics (Mean, Median, Minimum, SD)
  bmdMean/Median/Minimum/SD: number;
  bmdlMean/Median/Minimum/SD: number;
  bmduMean/Median/Minimum/SD: number;
  
  // Filter tracking
  genesWithBMDLessEqualHighDose: number;
  genesWithBMDpValueGreaterEqualValue: number;
  genesWithFoldChangeAboveValue: number;
}
```

**AnalysisAnnotationDto** (Metadata from filename):
```typescript
{
  fullName: string;           // Original filename
  displayName: string;        // Parsed display name
  parseSuccess: boolean;
  chemical: string;
  sex: string;
  organ: string;
  species: string;
  platform: string;
  analysisType: string;
}
```

### Routing & File-Based Routing

File structure automatically generates routes:
- `/` → `@index.tsx` (HomeView)
- `/` → `@layout.tsx` (wraps all pages)
- Hilla generates `routes.tsx` from file structure
- React Router 7.6 integrates with Vaadin Hilla file router

---

## 3. Backend Architecture (Java/Spring)

### Service Layer

**CategoryResultsService** (Core browser-callable service):
- `getCategoryResults(projectId, resultName)`: Returns list of CategoryAnalysisResultDto
- `getCategoryResultNames(projectId)`: List of all result names
- `getCategoryResultAnnotation(projectId, resultName)`: Parsed metadata
- `getAllCategoryResultAnnotations(projectId)`: Metadata for all results
- `getPathways(projectId, resultName)`: Unique pathway descriptions
- `getGenesInPathway(projectId, resultName, pathwayDesc)`: Gene symbols in pathway
- `getCurveData(...)`: Dose-response curve points for visualization
- `getModelCounts(projectId, resultName)`: Model frequency map (for pie chart)
- `getVennDiagramData(projectId, categoryResultNames[])`: Category overlaps

**ProjectService**:
- `getAllProjectIds()`: List of loaded project IDs
- `loadProject(file)`: Upload and process .bm2 file
- `deleteProject(projectId)`: Remove project
- `getProject(projectId)`: Access BMDProject object

**ConfigService**:
- `getOpeningView()`: "upload" or "library" mode

**CategoryAnalysisAsyncService** (Async operations):
- For long-running category analysis operations

### DTO Architecture

All DTOs are serializable by Hilla/Vaadin for transparent RPC:

- **CategoryAnalysisResultDto**: Main result data
- **AnalysisAnnotationDto**: Parsed metadata
- **PathwayInfoDto**: Pathway information
- **CurveDataDto**: Dose-response curve visualization data
- **DosePointDto**: Individual measured/interpolated points
- **BMDMarkersDto**: BMD, BMDL, BMDU markers for curves
- **VennDiagramDataDto**: Overlap data for Venn diagrams

### Data Conversion Pattern

```
BMDProject (Desktop model)
    ↓ (CategoryResultsService)
CategoryAnalysisResults (Desktop model)
    ↓ (fromDesktopObject)
CategoryAnalysisResultDto (Hilla-serializable)
    ↓ (Hilla RPC)
Browser (TypeScript/React)
```

---

## 4. Visualization System

### Chart Types & Implementation

| Chart Type | Component | Library | Key Features |
|-----------|-----------|---------|--------------|
| BMD vs P-Value Scatter | BMDvsPValueScatter | Plotly.js | Selection highlighting, click handling |
| Box Plot | BMDBoxPlot | Plotly.js | - |
| Range Plot | RangePlot | Plotly.js | - |
| Bubble Chart | BubbleChart | Plotly.js | Size = percentage |
| Best Models Pie | BestModelsPieChart | Plotly.js | Model frequency distribution |
| Bar Charts | BarCharts | Ant Design Charts | BMD/BMDL distributions |
| Accumulation Charts | AccumulationCharts | Ant Design Charts | - |
| Venn Diagram | VennDiagram | @ant-design/charts | 2-5 datasets, overlap analysis |
| Dose-Response Curves | DoseResponseCurveChart | Plotly.js | Multiple curves per pathway |

### Selection & Filtering Pattern

All charts use `selectChartData` selector from Redux:
```typescript
// From BMDvsPValueScatter.tsx (example pattern)
const data = useSelector(selectChartData);
const selectedCategoryIds = useSelector(state => state.categoryResults.selectedCategoryIds);

// Charts split data into selected/unselected traces
// Selected: highlighted in blue
// Unselected: dimmed gray (opacity 0.3)

// Click handling dispatches Redux action
dispatch(toggleCategorySelection(categoryId));      // Ctrl+Click
dispatch(setSelectedCategoryIds([categoryId]));     // Single click
```

### Chart Selector in CategoryResultsView

Dropdown switches between visualization types with options:
1. Default Charts (scatter + box plot side-by-side)
2. Curve Overlay
3. Range Plot
4. Bubble Chart
5. BMD and BMDL Bar Charts
6. Accumulation Charts
7. Best Models Pie Chart
8. Venn Diagram (compares multiple results)
9. (Coming soon): Mean/Median Histograms, Violin plots

---

## 5. Category Data Flow

### Load Sequence

**Initial Load**:
```
1. User selects project in sidebar
2. ProjectTreeSidebar.onLoadData() → CategoryResultsService.getAllCategoryResultAnnotations()
3. Annotations displayed as tree leaves
4. User clicks category result → Redux dispatches setSelectedCategoryResult()
5. CategoryResultsView component detects change via useEffect
6. Dispatches loadCategoryResults() thunk
7. CategoryResultsService.getCategoryResults() called
8. Redux updates state.categoryResults.data[]
9. All subscribed components re-render
```

**Component Reactivity**:
```
Redux State Update
    ↓
CategoryResultsGrid re-renders with new data
    ↓
Chart components subscribe to selectChartData
    ↓
Charts re-render with new traces
```

### Selection Flow

**User Interaction**:
```
User clicks category in grid/chart
    ↓
toggleCategorySelection(categoryId) or setSelectedCategoryIds([...])
    ↓
Redux updates state.categoryResults.selectedCategoryIds (Set<string>)
    ↓
selectChartData selector recalculates
    ↓
All charts re-render with updated selection highlighting
```

### Venn Diagram (Category Overlap)

Backend Logic (CategoryResultsService.getVennDiagramData):
- Accepts 2-5 category result names
- Extracts category descriptions (pathways) from each result
- Uses binary encoding to calculate overlaps:
  - A=1, B=2, C=4, D=8, E=16
  - Combined value identifies which sets each category belongs to
- Returns: `{ overlaps: {"A": count, "B": count, "A,B": count, ...}, overlapItems: {...} }`

Frontend (VennDiagram.tsx):
- Multi-select dropdown to choose results
- Generates @ant-design/charts Venn component
- Displays table with overlap counts
- Expandable rows showing category names in each overlap

---

## 6. File Organization Summary

### Frontend Files (React/TypeScript)
- **14 React components**: Views, grids, charts
- **2 Redux slices**: Navigation, category results state
- **Generated endpoints**: CategoryResultsService, ProjectService, etc.
- **Generated DTOs**: DTO TypeScript models from Java classes
- **~3,000+ lines** of frontend logic

### Backend Files (Java/Spring)
- **5 Service classes**: CategoryResults, Project, Config, Analysis, BmdResults
- **11 DTO classes**: Data transfer objects for all entities
- **~3,000 lines** of backend logic
- **@BrowserCallable**: All services exposed as RPC endpoints

### API Contract (Hilla)
- Transparent RPC between browser and backend
- Auto-generated TypeScript clients from Java services
- Type-safe both directions
- No JSON serialization boilerplate

---

## 7. Key Design Patterns

### 1. Redux Selection Pattern
```typescript
// Memoized selectors prevent unnecessary re-renders
const selectFilteredData = createSelector(
  [selectData, selectFilters],
  (data, filters) => data.filter(...)
);

// Dependency chain: Raw Data → Filtered → Sorted → Paginated → Chart
```

### 2. Hilla RPC Pattern
```typescript
// Backend
@BrowserCallable
public List<CategoryAnalysisResultDto> getCategoryResults(...) { }

// Frontend (auto-generated)
const results = await CategoryResultsService.getCategoryResults(...);
```

### 3. Component Selection Highlighting
```typescript
// Shared selection state in Redux
// Table grid and charts both read same selectedCategoryIds Set
// Clicking category → dispatch action → all components update
```

### 4. Lazy Loading
```typescript
// Project tree loads category results on expand
// Reduces initial load time
// Uses Ant Design Tree's loadData callback
```

### 5. DTOs as Contract
```typescript
// Desktop app models never exposed directly
// All data converted to DTOs for serialization
// Type safety maintained through generated TS types
```

---

## 8. Existing Category-Related Functionality

### Available Features
1. **Project Management**: Upload .bm2 files, list projects, delete projects
2. **Category Results Browser**: Tree view of projects and results
3. **Data Grid**: Sortable, selectable table with 10+ columns
4. **Multiple Visualizations**: 8 chart types with more coming
5. **Selection Highlighting**: Cross-component highlighting when selecting categories
6. **Filtering**: Filter by BMD, p-value, gene count ranges
7. **Category Comparison**: Venn diagram for overlap analysis
8. **Pathway Curves**: Dose-response curve overlays
9. **Model Statistics**: Pie chart of best fitting models
10. **Dual View Modes**: Upload mode (default) or Library mode (tabs)

### Category Data Fields Available
- Gene counts and statistics
- Fisher's exact test p-values
- BMD/BMDL/BMDU statistics (mean, median, min, SD)
- Percentage of genes in category
- Gene filtering metrics

---

## 9. Architecture Strengths

1. **Type Safety**: End-to-end TypeScript (frontend) and Java (backend)
2. **Reactive State**: Redux makes selection/filtering consistent across all charts
3. **Scalability**: Lazy loading and memoization prevent performance degradation
4. **Separation of Concerns**: UI layer, state management, service layer clearly separated
5. **Extensibility**: New chart types can be added easily following existing patterns
6. **Auto-generation**: DTOs and endpoints auto-generated from Java, reducing boilerplate
7. **Responsive Design**: Vaadin components and Ant Design provide mobile support

---

## 10. Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| CategoryResultsView.tsx | Main container, chart selector | 227 |
| CategoryResultsGrid.tsx | Data grid with selection | 189 |
| categoryResultsSlice.ts | Redux state management | 244 |
| BMDvsPValueScatter.tsx | Default scatter chart | 167 |
| VennDiagram.tsx | Category overlap analysis | 252 |
| CategoryResultsService.java | Backend service | 542 |
| CategoryAnalysisResultDto.java | Main data DTO | 332 |
| ProjectTreeSidebar.tsx | Navigation tree | 168 |
| LibraryView.tsx | Tab-based results view | 155 |

---

## 11. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                        │
│  (Select project/result, click category, switch chart type) │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│         React Components (CategoryResultsView)               │
│  (Renders UI, dispatches Redux actions on user input)       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│          Redux Store (categoryResultsSlice)                 │
│  (Updates state: data[], filters, selectedCategoryIds)      │
└─────────────────┬───────────────────────────────────────────┘
                  │
          ┌───────┼───────┬──────────┐
          ↓       ↓       ↓          ↓
    ┌─────────┐┌─────────┐┌──────────┐┌──────────┐
    │ Grid    ││ Chart 1 ││ Chart 2  ││ Selector │
    │(Table)  ││(Scatter)││(BoxPlot) ││          │
    └─────────┘└─────────┘└──────────┘└──────────┘
         │            │           │
         │    Data subscription (selectChartData)
         │            │           │
         └────────┬───┴───────────┘
                  │
    ┌─────────────────────────────────────────────────────────┐
    │      Backend Service (CategoryResultsService.java)      │
    │  (Database queries, data transformation to DTOs)        │
    └─────────────────────────────────────────────────────────┘
```

