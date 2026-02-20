Run compile checks without running tests or starting the server.

Steps:
1. **Java compile check**: `mvn compile -q`
2. **TypeScript type check**: `npx tsc --noEmit`

Report any errors found. If both pass, confirm "All checks passed."

This is a quick way to verify code correctness after changes without doing a full build or running tests.
