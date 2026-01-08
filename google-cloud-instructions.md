mvn clean package -Pproduction
gcloud builds submit --no-cache --tag us-east1-docker.pkg.dev/bmdexpress-web/bmdexpress-web-repo/bmdexpress-web:latest --timeout=20m
gcloud run deploy bmdexpress-web --image us-east1-docker.pkg.dev/bmdexpress-web/bmdexpress-web-repo/bmdexpress-web:latest --region us-east1 --allow-unauthenticated --port 8080 --session-affinity --memory 2Gi --cpu 2
gcloud builds submit --no-cache --tag us-east1-docker.pkg.dev/bmdexpress-web/bmdexpress-web-repo/bmdexpress-web:latest --timeout=20m
gcloud run deploy bmdexpress-web --image us-east1-docker.pkg.dev/bmdexpress-web/bmdexpress-web-repo/bmdexpress-web:latest --region us-east1 --allow-unauthenticated --port 8080 --session-affinity --memory 2Gi --cpu 2
