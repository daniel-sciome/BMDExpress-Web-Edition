# BMDExpress Web - Documentation Index

This document serves as a navigation guide to all documentation in the project.

## Quick Start

**New to the codebase?** Start here:
1. Read: [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) - Complete technical reference for new engineers
2. Read: [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) - Overview of architecture
3. Read: [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) - Code patterns & examples
4. Explore: `src/main/frontend/` and `src/main/java/` directories

---

## Main Documentation Files

### Architecture & Structure
- **[ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md)** (60+ KB)
  - **START HERE** - Complete technical reference for new engineers
  - System overview and core workflow
  - Technology stack with versions
  - 6 Architecture patterns documented in detail
  - Redux state management with full state shape
  - Core abstractions (ReactiveType, useReactiveState, UMAP service)
  - Component hierarchy and data flow
  - Development patterns (adding charts, columns, selection dimensions)
  - Quick reference for common tasks
  - **Status**: Current (comprehensive onboarding guide)

- **[CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md)** (20 KB)
  - Complete architecture overview
  - Frontend/backend organization
  - Redux state management patterns
  - Data flow diagrams
  - Component hierarchy
  - **Status**: Current (comprehensive)

- **[IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md)** (17 KB)
  - Redux slice templates
  - Chart component patterns
  - Backend service examples
  - DTO creation patterns
  - Error handling approaches
  - **Status**: Current (practical reference)

- **[REACTIVE_VISUALIZATION_COMPONENTS.md](./REACTIVE_VISUALIZATION_COMPONENTS.md)** (50+ KB)
  - Comprehensive guide for implementing reactive chart components
  - 5 core principles for reactive charts
  - Standard 9-section component architecture template
  - 5 visualization patterns with full code examples
  - Plotly integration details and best practices
  - Selection mechanisms and visual feedback strategies
  - Cluster coloring system (40-color palette)
  - Performance optimization techniques
  - 3 complete implementation examples
  - Testing strategies and common pitfalls
  - **Status**: Current (visualization implementation guide)

- **[PREFILTER_IMPLEMENTATION_GUIDE.md](./PREFILTER_IMPLEMENTATION_GUIDE.md)** (50+ KB)
  - Complete guide for porting prefiltering workflow from desktop app
  - Four prefilter types: ANOVA, Williams Trend, Oriogen, Curve Fit
  - Algorithm implementations with code examples
  - Data structures (DTOs, Redux state, database schema)
  - Backend service implementation (Java/Spring)
  - Frontend components (React/Redux/Ant Design)
  - WebSocket progress reporting
  - 13-week implementation roadmap
  - **Status**: Current (feature implementation guide)

### Design Summaries & Reference
- **[FRONTEND_DESIGN_SUMMARY.md](./FRONTEND_DESIGN_SUMMARY.md)** (5 KB)
  - Frontend architecture and operation overview
  - Core technologies, state management, component structure
  - Typical user flow walkthrough
  - **Status**: Current

- **[MODEL_IMPLEMENTATION_REFERENCE.md](./MODEL_IMPLEMENTATION_REFERENCE.md)** (15 KB)
  - Exact code snippets for dose-response models (Hill, Power, Exponential, Polynomial)
  - Curve generation algorithm and testing examples
  - **Status**: Current (technical reference)

- **[CATEGORY_DRILLDOWN_ARCHITECTURE.md](./CATEGORY_DRILLDOWN_ARCHITECTURE.md)** (8 KB)
  - Proposed feature: gene-level drill-down when selecting a category
  - Includes state design, endpoint specs, and phased implementation plan
  - **Status**: Planned (not yet implemented)

### Known Issues & Cross-Project References
- **[EXPERIMENT_DESCRIPTION_OBJECT_REFERENCE_ISSUE.md](../BMDExpress-3/EXPERIMENT_DESCRIPTION_OBJECT_REFERENCE_ISSUE.md)** (BMDExpress-3 repo)
  - Investigation of why `CategoryAnalysisResults.getExperimentDescription()` returns NULL
  - Object identity issue between serialized references
  - Workaround implemented in `CategoryResultsService.findExperimentDescriptionByName()`
  - **Status**: Investigation required

### Historical Documentation
- **[archive/README.md](./archive/README.md)** (8 KB)
  - Index of archived historical documentation
  - Session notes timeline (Sessions 7-13 with 9 parts)
  - Feature analysis documents
  - Implementation plans
  - Context for design decisions
  - **Status**: Historical archive (Nov 21, 2025)
  - **Contains**: 29 archived documents organized by category

### Deployment & Configuration
- **[google-cloud-instructions.md](./google-cloud-instructions.md)** (6 KB)
  - Google Cloud deployment steps
  - Environment setup
  - **Status**: Deployment guide

- **[README.md](./README.md)** (6 KB)
  - Project overview
  - Quick start
  - Build instructions
  - **Status**: Project README

---

## Finding Information by Topic

### I want to understand...

**Everything as a new engineer (START HERE)**
→ [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) - Complete technical reference

**The overall application architecture**
→ [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) Section 1-3, then [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md)

**How Redux state management works**
→ [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) Section 5, then [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) Section 1

**How to add a new reactive visualization/chart**
→ [REACTIVE_VISUALIZATION_COMPONENTS.md](./REACTIVE_VISUALIZATION_COMPONENTS.md) - Complete guide with patterns and examples

**How to add a new chart (general)**
→ [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) Section 5, then look at existing charts in `src/main/frontend/components/charts/`

**How the reactive selection infrastructure works**
→ [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) Section 3 (Pattern 2), then [REACTIVE_VISUALIZATION_COMPONENTS.md](./REACTIVE_VISUALIZATION_COMPONENTS.md)

**How category data flows through the app**
→ [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) Section 8, then [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) Section 5

**How to create a backend service**
→ [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) Section 9.2, then [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) Section 3

**How DTOs work**
→ [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) Section 4

**How cluster coloring works**
→ [REACTIVE_VISUALIZATION_COMPONENTS.md](./REACTIVE_VISUALIZATION_COMPONENTS.md) Section 8

**How to implement prefiltering (ANOVA, Williams, Oriogen, Curve Fit)**
→ [PREFILTER_IMPLEMENTATION_GUIDE.md](./PREFILTER_IMPLEMENTATION_GUIDE.md) - Complete porting guide

**The prefiltering workflow and algorithms**
→ [PREFILTER_IMPLEMENTATION_GUIDE.md](./PREFILTER_IMPLEMENTATION_GUIDE.md) Sections 2-6

**The project's development history**
→ [archive/README.md](./archive/README.md) for session notes timeline

**Why ExperimentDescription is NULL in CategoryAnalysisResults**
→ [EXPERIMENT_DESCRIPTION_OBJECT_REFERENCE_ISSUE.md](../BMDExpress-3/EXPERIMENT_DESCRIPTION_OBJECT_REFERENCE_ISSUE.md) in BMDExpress-3 repo

**How to deploy to Google Cloud**
→ [google-cloud-instructions.md](./google-cloud-instructions.md)

**What are common patterns in this codebase**
→ [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) Section 3, then [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md)

---

## Key File Locations

### Frontend (React/TypeScript)
```
src/main/frontend/
├── views/
│   ├── @layout.tsx              # Main layout
│   ├── @index.tsx               # Home view
│   └── LibraryView.tsx           # Tab-based results view
├── components/
│   ├── CategoryResultsView.tsx   # Main results container
│   ├── CategoryResultsGrid.tsx   # Data grid
│   ├── ProjectTreeSidebar.tsx    # Project tree navigation
│   ├── PathwayCurveViewer.tsx    # Pathway curves
│   └── charts/                   # Chart components (9 files)
├── store/
│   ├── store.ts                  # Redux store
│   ├── hooks.ts                  # Redux hooks
│   └── slices/
│       ├── navigationSlice.ts    # Project/result navigation
│       └── categoryResultsSlice.ts # Category data & selection
└── generated/
    ├── endpoints.ts              # Hilla service exports
    └── com/sciome/dto/           # Generated DTO TypeScript models
```

### Backend (Java/Spring)
```
src/main/java/com/sciome/
├── service/
│   ├── CategoryResultsService.java  # Core browser-callable service
│   ├── ProjectService.java
│   ├── ConfigService.java
│   ├── BmdResultsService.java
│   └── CategoryAnalysisAsyncService.java
└── dto/
    ├── CategoryAnalysisResultDto.java    # Main data DTO
    ├── AnalysisAnnotationDto.java        # Metadata
    ├── VennDiagramDataDto.java           # Venn overlaps
    ├── CurveDataDto.java                 # Curve data
    └── (8 more DTOs)
```

---

## Technology Stack Reference

### Frontend Technologies
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Redux Toolkit**: State management with `createSlice`, `createAsyncThunk`
- **Ant Design**: UI components & charts
- **Plotly.js**: Interactive charts
- **React Router 7.6**: File-based routing
- **Vaadin Hilla**: RPC framework for browser-callable services

### Backend Technologies
- **Spring Boot**: Application framework
- **Vaadin Hilla**: Browser-callable services with `@BrowserCallable`
- **Jackson**: JSON serialization
- **Java 17+**: Language

### Build & Deployment
- **Vite**: Frontend build tool
- **Maven**: Backend build
- **npm**: Package management
- **Docker**: Containerization (for production)

---

## Quick Reference - Common Tasks

### Add a new reactive visualization
1. Read [REACTIVE_VISUALIZATION_COMPONENTS.md](./REACTIVE_VISUALIZATION_COMPONENTS.md) Section 3 for canonical structure
2. Create component in `src/main/frontend/components/charts/MyChart.tsx`
3. Follow the 9-section template with useReactiveState hooks
4. Implement two-layer rendering (background + foreground)
5. Add to `CHART_TYPES` in `CategoryResultsView.tsx`
6. Add conditional render: `{selectedChartType === CHART_TYPES.MY_CHART && <MyChart />}`
7. Verify with checklist in [REACTIVE_VISUALIZATION_COMPONENTS.md](./REACTIVE_VISUALIZATION_COMPONENTS.md) Section 3.10

### Add a new backend service method
1. Add method to Java service with `@BrowserCallable`
2. Return DTO objects (not internal models)
3. Use pattern from [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) Section 9.2
4. Hilla auto-generates TypeScript client
5. Use in React component with `await SomeService.methodName()`

### Add a new filter
1. Add filter field to Redux slice state
2. Update selector with filter logic
3. Create React component for filter UI
4. Dispatch `setFilters()` on user input
5. Charts automatically subscribe to `selectChartData` which includes filters
6. See [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) Section 10.2

### Add a new column to CategoryResultsGrid
1. See [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) Section 10.3
2. Add column definition in appropriate file in `src/main/frontend/components/categoryTable/columns/`
3. Update types and visibility configuration
4. Test with different analysis types

### Understand data flow
1. Start with [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) Section 8 "Key Data Flow Patterns"
2. Look at specific component implementations
3. Trace Redux actions and selectors

---

## Documentation Status Summary

| Document | Purpose | Status | Size |
|----------|---------|--------|------|
| ENGINEERING_DESIGN_GUIDE.md | **Complete technical reference for new engineers** | Current | 60+ KB |
| REACTIVE_VISUALIZATION_COMPONENTS.md | Reactive chart implementation guide | Current | 50+ KB |
| PREFILTER_IMPLEMENTATION_GUIDE.md | Prefiltering workflow porting guide | Current | 50+ KB |
| CODEBASE_STRUCTURE.md | Architecture overview | Current | 20 KB |
| IMPLEMENTATION_PATTERNS.md | Code patterns & examples | Current | 17 KB |
| MODEL_IMPLEMENTATION_REFERENCE.md | Dose-response model formulas & code | Current | 15 KB |
| FRONTEND_DESIGN_SUMMARY.md | Frontend architecture & operation overview | Current | 5 KB |
| CATEGORY_DRILLDOWN_ARCHITECTURE.md | Proposed category drill-down feature | Planned | 8 KB |
| google-cloud-instructions.md | Deployment | Current | 6 KB |
| README.md | Project overview | Current | 6 KB |
| archive/README.md | Historical documentation index | Archived | 8 KB |
| archive/* | Session notes, feature analysis, plans | Archived | ~150 KB |

---

## Contributing Guidelines

When adding new documentation:
1. Use Markdown format (.md files)
2. Include code examples with syntax highlighting
3. Link to related documentation
4. Keep sections focused and digestible
5. Update this index file (DOCUMENTATION_INDEX.md)
6. Reference specific file paths with absolute paths
7. Consider whether documentation should go in root (active) or archive/ (historical)

When modifying code:
1. Follow patterns in [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) and [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md)
2. For reactive visualizations, follow [REACTIVE_VISUALIZATION_COMPONENTS.md](./REACTIVE_VISUALIZATION_COMPONENTS.md)
3. Keep documentation in sync with code changes
4. Reference existing patterns in code reviews

When implementing new reactive charts:
1. Use the canonical 9-section structure from [REACTIVE_VISUALIZATION_COMPONENTS.md](./REACTIVE_VISUALIZATION_COMPONENTS.md) Section 3
2. Implement two-layer rendering (background + foreground)
3. Use useReactiveState hooks for selection state
4. Follow the quick reference checklist in Section 3.10
5. Test selection mechanisms (click, box/lasso, double-click clear)

---

## Links to Key Source Files

**Frontend Components** (14 files):
- [CategoryResultsView.tsx](/src/main/frontend/components/CategoryResultsView.tsx)
- [CategoryResultsGrid.tsx](/src/main/frontend/components/CategoryResultsGrid.tsx)
- [Charts directory](/src/main/frontend/components/charts/)

**Backend Services** (5 files):
- [CategoryResultsService.java](/src/main/java/com/sciome/service/CategoryResultsService.java)
- [ProjectService.java](/src/main/java/com/sciome/service/ProjectService.java)

**Redux State** (2 files):
- [categoryResultsSlice.ts](/src/main/frontend/store/slices/categoryResultsSlice.ts)
- [navigationSlice.ts](/src/main/frontend/store/slices/navigationSlice.ts)

**DTOs** (11 files):
- [CategoryAnalysisResultDto.java](/src/main/java/com/sciome/dto/CategoryAnalysisResultDto.java)
- [Other DTOs](/src/main/java/com/sciome/dto/)

---

## Contact & Support

For questions about:
- **Getting Started**: See [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) - Complete onboarding reference
- **Architecture**: See [ENGINEERING_DESIGN_GUIDE.md](./ENGINEERING_DESIGN_GUIDE.md) or [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md)
- **Implementation**: See [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md)
- **Reactive Visualizations**: See [REACTIVE_VISUALIZATION_COMPONENTS.md](./REACTIVE_VISUALIZATION_COMPONENTS.md)
- **Development History**: See [archive/README.md](./archive/README.md) for session notes timeline

