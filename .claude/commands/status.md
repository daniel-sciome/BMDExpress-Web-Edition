Show project status overview.

Run these checks and report results:

1. **Git status**: `git status --short` and `git log --oneline -5`
   - Show current branch, uncommitted changes, recent commits
   - Show if ahead/behind remote

2. **Dev server**: Check if anything is listening on port 8080 (`lsof -ti:8080`)
   - If running, report PID and try `curl -s -o /dev/null -w '%{http_code}' http://localhost:8080`

3. **Cloud Run deployment**: `gcloud run services describe bmdexpress-web --region us-east1 --format="value(status.url)"` and `gcloud run revisions list --service bmdexpress-web --region us-east1 --limit 3 --format="table(metadata.name,metadata.creationTimestamp,status.conditions.status)"`
   - Show service URL and last 3 revisions

Present as a clean summary.
