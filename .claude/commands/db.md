DuckDB operations.

The project has a DuckDB database at `src/main/resources/data/bmd/bmdx.duckdb` that powers the DuckDB Graph Explorer at `/duckdb-graph`.

Based on what the user asks, do one of:

**Query the database:**
If the user provides a SQL query or asks a question about the data, run it using the DuckDB CLI:
```
duckdb src/main/resources/data/bmd/bmdx.duckdb "SELECT ..."
```
If duckdb CLI is not installed, use: `java -cp target/dependency/duckdb_jdbc-*.jar org.duckdb.DuckDBDriver` or suggest installing it.

**List tables:**
```
duckdb src/main/resources/data/bmd/bmdx.duckdb "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' ORDER BY table_name"
```

**Describe a table:**
```
duckdb src/main/resources/data/bmd/bmdx.duckdb "DESCRIBE {table_name}"
```

**Show relationships:**
```
duckdb src/main/resources/data/bmd/bmdx.duckdb "SELECT * FROM duckdb_constraints() WHERE constraint_type = 'FOREIGN KEY'"
```

**Open the explorer:**
If the dev server is running, tell the user to visit `http://localhost:8080/duckdb-graph`. If deployed, the URL is the Cloud Run service URL + `/duckdb-graph`.

The DuckDB Graph Explorer (`src/main/resources/static/duckdb-graph.html`) uses DuckDB-WASM to load the database client-side and vis-network to render the table relationship graph. The backend controller is `src/main/java/com/sciome/controller/DuckDbUiController.java`.
