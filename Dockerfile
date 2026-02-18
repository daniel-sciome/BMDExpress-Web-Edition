# Simplified Dockerfile for Cloud Run deployment
# Uses pre-built JAR (built locally with: mvn clean package -Pproduction -DskipTests)

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy the pre-built WAR file (Spring Boot repackaged, executable as a JAR)
COPY target/bmdexpress-web-*.war app.jar

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Run the application
# Cloud Run injects PORT environment variable, application.properties uses ${PORT:8080}
# Set heap size to use most of available memory (Cloud Run gives 2Gi)
ENTRYPOINT ["java", "-Xmx1536m", "-jar", "app.jar"]
