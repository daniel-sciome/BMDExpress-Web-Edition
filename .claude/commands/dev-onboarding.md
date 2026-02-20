Generate or update the developer onboarding documentation.

This produces a high-level overview aimed at a new developer joining the project. The output is a single markdown file that answers: "I just cloned this repo — what do I need to know?"

## What to cover

1. **What this project is** — one paragraph. BMDExpress Web Edition, what problem it solves, who uses it.

2. **Architecture at a glance** — the major moving parts and how they connect:
   - Spring Boot backend (controllers, services, DTOs, Hilla bridge)
   - React/TypeScript frontend (views, components, Redux store, Plotly charts)
   - How data flows: .bm2 files → Java services → Hilla → React → Plotly
   - Key external dependencies (DuckDB-WASM, vis-network, Ant Design, Apache POI)

3. **Getting started** — clone, prerequisites (Java 21, Maven, Node), `mvn spring-boot:run`, open localhost:8080.

4. **Project structure** — a directory tree with one-line descriptions of each top-level directory and the major subdirectories under `src/main/`.

5. **Key workflows** — how to:
   - Add a new page/view
   - Add a new API endpoint
   - Add a new chart
   - Add a new Redux slice
   - Build for production
   - Deploy to Cloud Run

   Keep each to 2-3 sentences pointing at the right files/patterns. Don't repeat what the scaffolding skills already do — just say "use `/new-endpoint`" etc.

6. **Where to find things** — a quick reference table mapping concepts to file locations (e.g., "chart export" → `components/charts/utils/chartExport.ts`).

## How to generate

1. Read the current codebase structure (controllers, services, views, components, store)
2. Read existing docs: `README.md`, `DOCUMENTATION_INDEX.md`, `FRONTEND_DESIGN_SUMMARY.md`, `CODEBASE_STRUCTURE.md`
3. Synthesize into a single coherent onboarding doc
4. Write to `ONBOARDING.md` in the project root
5. Keep it under 3,000 words — this is a map, not an encyclopedia

If `ONBOARDING.md` already exists, update it to reflect the current state of the codebase.
