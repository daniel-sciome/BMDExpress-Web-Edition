# Simplified Dockerfile for Cloud Run deployment
# Uses pre-built JAR (built locally with: mvn clean package -Pproduction -DskipTests)

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy the pre-built JAR file (using wildcard to match any version)
COPY target/bmdexpress-web-*.jar app.jar

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Run the application
# Cloud Run injects PORT environment variable, application.properties uses ${PORT:8080}
ENTRYPOINT ["java", "-jar", "app.jar"]
