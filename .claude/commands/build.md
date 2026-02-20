Build the production WAR without deploying.

Run: `mvn clean package -Pproduction -DskipTests`

This builds:
- Frontend (Vite production bundle via Vaadin Maven plugin)
- Backend (Spring Boot repackaged WAR)
- Output: `target/bmdexpress-web-0.0.1-SNAPSHOT.war`

If the build fails, show the relevant error output and suggest fixes.

After a successful build, report the WAR file size.
