Build and deploy to Google Cloud Run.

Steps:
1. Run `mvn clean package -Pproduction -DskipTests` (timeout 10 minutes)
2. If build fails, show the error and stop
3. Run `gcloud builds submit --no-cache --tag us-east1-docker.pkg.dev/bmdexpress-web/bmdexpress-web-repo/bmdexpress-web:latest --timeout=20m` (timeout 10 minutes)
4. If image build fails, show the error and stop
5. Run `gcloud run deploy bmdexpress-web --image us-east1-docker.pkg.dev/bmdexpress-web/bmdexpress-web-repo/bmdexpress-web:latest --region us-east1 --allow-unauthenticated --port 8080 --session-affinity --memory 2Gi --cpu 2`
6. Report the service URL when done

The Dockerfile is at the project root. It copies `target/bmdexpress-web-*.war` and `data/questionnaires/` into the image. The DuckDB file (`bmdx.duckdb`) is packaged inside the WAR via `src/main/resources/data/bmd/`.
