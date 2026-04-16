Run tests.

If the user specifies a test type, run that. Otherwise ask which to run:

**Unit tests (Java):**
```
mvn test
```
Tests are in `src/test/java/`. Uses Spring Boot Test + JUnit.

**E2E tests (Cypress):**
```
npx cypress run
```
Tests are in `cypress/e2e/`. Requires the dev server to be running on port 8082.
To run interactively: `npx cypress open`

**Compile check only (no tests):**
```
mvn compile test-compile
```

Report test results — number passed, failed, and any failure details.
