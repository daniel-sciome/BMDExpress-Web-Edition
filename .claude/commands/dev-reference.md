Generate or update the detailed code reference documentation.

This produces nitty-gritty technical reference aimed at a developer actively working in the codebase. Not for reading start-to-finish — for searching when you need to know exactly how something works.

## What to cover

Organize by subsystem. For each, document the specifics a developer needs when modifying that area:

### Backend

- **Controllers**: Every endpoint — method, path, parameters, response type, which service it calls. Table format.
- **Services**: Each service's responsibilities, constructor dependencies, key methods with signatures. Note which are `@BrowserCallable` (Hilla-exposed to frontend).
- **DTOs**: Field names and types for each DTO. Note which are used by Hilla (auto-generate TypeScript types).
- **Configuration**: All `application.properties` / `application.yml` keys, their defaults, and what they control. Include `@ConfigurationProperties` classes.
- **LLM integration**: Provider interface, registered skills, prompt assembly, config keys for API keys and model selection.

### Frontend

- **Redux store**: Every slice — state shape, actions, selectors. Note middleware and persistence behavior.
- **Views and routing**: Each view file, its route path, and what it renders.
- **Chart components**: Each chart — what data it takes, what Plotly trace types it uses, how it integrates with reactive selection.
- **Hooks**: Custom hooks — what they do, what they return, which slices they depend on.
- **Key utilities**: `chartExport.ts`, `filterEvaluation.ts`, `dtoParsingUtils.ts`, etc. — what each does and its public API.

### Data flow

- How a .bm2 file goes from upload to rendered chart (step by step through the layers)
- How reactive selection works (click in chart → Redux → table highlights, and vice versa)
- How the report builder assembles sections, snapshots, and clinical data into exportable documents

### Database & DuckDB

- H2 in-memory database: what it stores, schema
- DuckDB: what `bmdx.duckdb` contains, how the graph explorer loads it client-side

## How to generate

1. Scan all controllers, services, DTOs, config classes, slices, views, chart components, hooks, and utilities
2. Read existing detailed docs: `ENGINEERING_DESIGN_GUIDE.md`, `IMPLEMENTATION_PATTERNS.md`, `REACTIVE_VISUALIZATION_COMPONENTS.md`, `CATEGORY_DRILLDOWN_ARCHITECTURE.md`, `MODEL_IMPLEMENTATION_REFERENCE.md`, `PREFILTER_IMPLEMENTATION_GUIDE.md`
3. Synthesize into a single comprehensive reference organized by subsystem
4. Write to `REFERENCE.md` in the project root
5. Use tables, code signatures, and short descriptions — no prose paragraphs explaining concepts (that's the onboarding doc's job)

If `REFERENCE.md` already exists, update it to reflect the current state of the codebase.
