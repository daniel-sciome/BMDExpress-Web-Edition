# BMDExpress Web - Documentation Index

This document serves as a navigation guide to all documentation in the project.

## Quick Start

**New to the codebase?** Start here:
1. Read: [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) - Overview of architecture
2. Read: [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) - Code patterns & examples
3. Explore: `src/main/frontend/` and `src/main/java/` directories

---

## Main Documentation Files

### Architecture & Structure
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

### Feature Documentation

#### Category Drilldown
- **[CATEGORY_DRILLDOWN_ARCHITECTURE.md](./CATEGORY_DRILLDOWN_ARCHITECTURE.md)** (42 KB)
  - Session 7 feature implementation
  - Architecture for category filtering
  - Visual filtering workflow
  - Selection state management
  - **Status**: Detailed design document

#### Venn Diagram
- **[SESSION_7_VENN_DIAGRAM.md](./SESSION_7_VENN_DIAGRAM.md)** (5 KB)
  - Venn diagram implementation
  - Category overlap analysis
  - Session 7 notes
  - **Status**: Feature summary

#### Pathway Curve Viewer
- **[PATHWAY_CURVE_VIEWER_ANALYSIS.md](./PATHWAY_CURVE_VIEWER_ANALYSIS.md)** (27 KB)
  - Detailed technical analysis
  - Curve visualization logic
  - Data transformation pipeline
  - **Status**: Technical deep dive

- **[PATHWAY_CURVE_VIEWER_README.md](./PATHWAY_CURVE_VIEWER_README.md)** (9 KB)
  - User guide & features
  - How to use the viewer
  - **Status**: User documentation

- **[PATHWAY_CURVE_VIEWER_CODE_SNIPPETS.md](./PATHWAY_CURVE_VIEWER_CODE_SNIPPETS.md)** (15 KB)
  - Code examples & references
  - Implementation details
  - **Status**: Developer reference

- **[PATHWAY_CURVE_VIEWER_INDEX.md](./PATHWAY_CURVE_VIEWER_INDEX.md)** (11 KB)
  - Navigation guide for curve viewer docs
  - **Status**: Index

### Session Notes
- **[SESSION_NOTES.md](./SESSION_NOTES.md)** (18 KB)
  - Complete session history
  - Features implemented per session
  - Bugs fixed
  - Performance improvements
  - **Status**: Development log

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

**The overall application architecture**
→ Start with [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) Section 1-3

**How Redux state management works**
→ [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) Section 2, then [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) Section 1

**How to add a new chart**
→ [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) Section 5, then look at existing charts in `src/main/frontend/components/charts/`

**How category data flows through the app**
→ [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) Section 5

**How to create a backend service**
→ [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) Section 3

**How DTOs work**
→ [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) Section 4

**The Venn diagram implementation**
→ [SESSION_7_VENN_DIAGRAM.md](./SESSION_7_VENN_DIAGRAM.md) and [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) Section 5

**The pathway curve viewer**
→ [PATHWAY_CURVE_VIEWER_README.md](./PATHWAY_CURVE_VIEWER_README.md) (user) or [PATHWAY_CURVE_VIEWER_ANALYSIS.md](./PATHWAY_CURVE_VIEWER_ANALYSIS.md) (developer)

**Category drilldown filtering**
→ [CATEGORY_DRILLDOWN_ARCHITECTURE.md](./CATEGORY_DRILLDOWN_ARCHITECTURE.md)

**What was done in each session**
→ [SESSION_NOTES.md](./SESSION_NOTES.md)

**How to deploy to Google Cloud**
→ [google-cloud-instructions.md](./google-cloud-instructions.md)

**What are common patterns in this codebase**
→ [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md)

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

### Add a new visualization
1. Create component in `src/main/frontend/components/charts/MyChart.tsx`
2. Follow pattern in [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) Section 2
3. Add to `CHART_TYPES` in `CategoryResultsView.tsx`
4. Add conditional render: `{selectedChartType === CHART_TYPES.MY_CHART && <MyChart />}`

### Add a new backend service method
1. Add method to Java service with `@BrowserCallable`
2. Return DTO objects (not internal models)
3. Use pattern from [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) Section 3
4. Hilla auto-generates TypeScript client
5. Use in React component with `await SomeService.methodName()`

### Add a new filter
1. Add filter field to Redux slice state
2. Update selector with filter logic
3. Create React component for filter UI
4. Dispatch `setFilters()` on user input
5. Charts automatically subscribe to `selectChartData` which includes filters

### Understand data flow
1. Start with [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) Section 5 "Category Data Flow"
2. Look at specific component implementations
3. Trace Redux actions and selectors

---

## Documentation Status Summary

| Document | Purpose | Status | Size |
|----------|---------|--------|------|
| CODEBASE_STRUCTURE.md | Architecture overview | Current | 20 KB |
| IMPLEMENTATION_PATTERNS.md | Code patterns & examples | Current | 17 KB |
| SESSION_NOTES.md | Development history | Current | 18 KB |
| CATEGORY_DRILLDOWN_ARCHITECTURE.md | Feature design | Current | 42 KB |
| SESSION_7_VENN_DIAGRAM.md | Venn diagram feature | Current | 5 KB |
| PATHWAY_CURVE_VIEWER_*.md | Curve viewer docs | Current | ~62 KB |
| google-cloud-instructions.md | Deployment | Current | 6 KB |
| README.md | Project overview | Current | 6 KB |

---

## Contributing Guidelines

When adding new documentation:
1. Use Markdown format (.md files)
2. Include code examples with syntax highlighting
3. Link to related documentation
4. Keep sections focused and digestible
5. Update this index file
6. Reference specific file paths with absolute paths (e.g., `/home/svobodadl/bmdexpress-web/src/...`)

When modifying code:
1. Follow patterns in [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md)
2. Keep documentation in sync with code changes
3. Update SESSION_NOTES.md if making significant changes
4. Reference existing patterns in code reviews

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
- **Architecture**: See [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md)
- **Implementation**: See [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md)
- **Specific features**: See feature-specific documentation listed above
- **Development history**: See [SESSION_NOTES.md](./SESSION_NOTES.md)

