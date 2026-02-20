When writing or modifying code in this project, follow these principles:

## DRY

If a pattern exists in the codebase, find it and reuse it — don't reinvent. Check existing services, utils, hooks, and DTOs before creating new ones. Shared logic belongs in a service (backend) or a hook/util (frontend), not duplicated across components.

## Separation of concerns

Controllers handle HTTP. Services handle logic. DTOs carry data. No business logic in controllers or DTOs.

Components render UI. Redux slices own state. Hooks bridge the two. No data fetching in render functions.

SQL generation is separate from SQL execution.

## Type safety

Hilla generates TypeScript types from Java DTOs — use them, don't create parallel type definitions. `PayloadAction<T>` for all Redux actions. No `any` except at system boundaries (Plotly internals, window globals). `ResponseEntity<T>` with explicit types on the backend.

## Prefer convention over documentation

Follow the existing patterns in the codebase. If you're unsure how to structure something, find the closest existing example and mirror it.

---

Apply these principles to the current task. Before writing new code, search the codebase for existing patterns that solve the same problem or a similar one.
