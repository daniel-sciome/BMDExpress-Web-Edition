Generate or update the end-user guide for BMDExpress Web Edition.

This is for scientists and toxicologists using the application — not developers. It describes what the app does, how to accomplish tasks, and where to find controls.

## What to cover

Organize by workflow, not by feature. Each section walks through a task the user wants to accomplish.

### 1. Getting started
- Opening the app (URL, what you see first)
- The library view: pre-loaded projects, what .bm2 files are
- Uploading your own data

### 2. Exploring analysis results
- Selecting a project and analysis from the sidebar
- The results table: columns, sorting, scrolling, what the numbers mean
- Column visibility controls: showing/hiding column groups
- Selecting rows: click, Ctrl+click, Select All, Invert, Clear

### 3. Using filters
- Primary filters: what they control (BMD percentile, genes passed, etc.), where the sliders are
- Column filters: how to filter by specific column values
- Display modes: highlight, dim, isolate — what each does to non-matching rows
- Filter persistence: filters are saved in your browser

### 4. Charts and visualizations
- Where charts appear (below the table, in tabs)
- Chart types available and what each shows:
  - UMAP scatter (pathway clustering)
  - BMD vs P-Value scatter
  - BMD box plots
  - Dose-response curves
  - Accumulation charts
  - Range plots
  - Bar charts
  - Violin plots
  - Cluster heatmap
  - Best models pie chart
  - Bubble chart
- Interacting with charts: click a point to select, Ctrl+click for multi-select, double-click to clear
- Bidirectional selection: clicking in a chart highlights the table row and vice versa
- Chart appearance: themes, colors, fonts (if appearance modal exists)
- Exporting charts: the Export SVG button, size presets (Standard, Presentation, Publication), using SVG in PowerPoint

### 5. Dose-response curve viewer
- How to open it (clicking a category row)
- What the curve shows: fitted model, BMD/BMDL/BMDU markers, dose points
- Navigating between curves

### 6. Multi-set comparison
- Selecting multiple datasets
- Venn diagram: what overlaps mean
- Exporting comparison results to Excel

### 7. DuckDB Graph Explorer
- What it is: interactive database schema browser
- How to access it (`/duckdb-graph`)
- Clicking a table to see its joins
- Ctrl+click for multi-table selection
- Per-edge join type control (INNER, LEFT, RIGHT, FULL OUTER)
- SQL preview and results table
- Configuring row limit

### 8. Report builder
- Creating a new report from a template
- Sections: adding, reordering, editing content
- Chart snapshots: capturing charts into report sections
- Clinical data: attaching datasets
- AI-assisted drafting: which sections support it, how to trigger it
- Exporting: PDF and DOCX options

### 9. Questionnaire
- Accessing the questionnaire (URL, access code)
- Filling it out: all fields optional, auto-saves on leaving each field
- Editing a previous response

## How to generate

1. Read the frontend views and key components to understand the actual UI layout and controls:
   - `src/main/frontend/views/` — all view files
   - `src/main/frontend/components/CategoryResultsView.tsx`
   - `src/main/frontend/components/charts/` — chart components
   - `src/main/frontend/components/report/` — report builder components
   - `src/main/frontend/components/questionnaire/` — questionnaire
   - `src/main/frontend/components/PrimaryFilter.tsx`
   - `src/main/frontend/components/ViewToolbar.tsx`
   - `src/main/resources/static/duckdb-graph.html`
2. Read existing user-facing docs if any
3. Write in plain language — no code, no technical jargon. "Click the Export SVG button in the top-right corner of the chart" not "invoke exportChartWithPreset"
4. Include the location of every control: which panel, which corner, which button label
5. Write to `USER_GUIDE.md` in the project root
6. Use screenshots placeholders like `[Screenshot: filter panel]` where a screenshot would help — these can be filled in later

If `USER_GUIDE.md` already exists, update it to reflect the current state of the application.
