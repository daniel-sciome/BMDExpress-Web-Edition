Start the development server.

Steps:
1. Check if port 8082 is already in use: `lsof -ti:8082`
2. If a process is using port 8082, ask the user if they want to kill it
3. If confirmed (or port is free), start the dev server in the background:
   `mvn spring-boot:run`
4. Wait for the server to be ready by polling `curl -s -o /dev/null -w '%{http_code}' http://localhost:8082` until it returns 200 (check every 5 seconds, timeout after 2 minutes)
5. Report when ready: "Dev server running at http://localhost:8082"

The dev server uses Vite for frontend hot-reload and Spring DevTools for backend hot-reload. Frontend changes are reflected instantly; Java changes require a recompile (the server auto-detects class changes).
