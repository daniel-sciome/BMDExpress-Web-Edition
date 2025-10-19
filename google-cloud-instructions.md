Here's how to set up Google Cloud to publish your Vaadin application.

The best, most modern, and most cost-effective way to do this on Google Cloud is with **Cloud Run**. It's a "serverless" platform, meaning you just give it a container image, and it handles all the scaling (including scaling to zero, so you pay nothing if no one is using it), security, and networking for you.

This guide will walk you through containerizing your Vaadin app and deploying it to Cloud Run.

-----

## Prerequisites

1.  **Google Cloud Account:** You need an account with billing enabled. New users get a generous free tier, which is often enough for a small app.
2.  **Google Cloud CLI:** You must [install the `gcloud` CLI](https://www.google.com/search?q=%5Bhttps://cloud.google.com/sdk/docs/install%5D\(https://cloud.google.com/sdk/docs/install\)) on your local machine. This is how you'll interact with your account from the terminal. After installing, run `gcloud init` to log in and set up your default project.

-----

## Step 1: Set Up Your GCP Project

First, you need to create a project and enable the necessary APIs.

1.  **Log in and Create a Project:**

    ```bash
    # Log in to your Google account
    gcloud auth login

    # Create a new project (replace 'your-project-id' with a unique name)
    gcloud projects create your-project-id --name="My Vaadin App"

    # Set this as your default project
    gcloud config set project your-project-id
    ```

2.  **Enable the APIs:** You need to enable three services:

      * **Cloud Run:** To run your app.
      * **Artifact Registry:** To store your app's container image.
      * **Cloud Build:** To build your container in the cloud.

    <!-- end list -->

    ```bash
    gcloud services enable run.googleapis.com \
                           artifactregistry.googleapis.com \
                           cloudbuild.googleapis.com
    ```

-----

## Step 2: Containerize Your Vaadin App

Cloud Run works by running **Docker containers**. You need to add a file named `Dockerfile` (with no extension) to the root of your `bmdexpress-web` project. This file is a recipe for building your app's image.

Your `server.port=${PORT:8080}` configuration is **perfect** for this, as Cloud Run automatically injects a `PORT` environment variable that your app will use.

Create this `Dockerfile` in your project's root directory:

```dockerfile
# === Stage 1: Build the Application ===
# Use an official Maven image to build the app.
FROM maven:3.8-openjdk-17 AS build

# Set the working directory
WORKDIR /app

# Copy the pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the rest of the source code and build the app
COPY src ./src
# -Pproduction builds the Vaadin frontend bundle
RUN mvn package -Pproduction -DskipTests

# === Stage 2: Create the Final Image ===
# Use a slim, secure Java runtime
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy the built JAR file from the 'build' stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port your app will run on
EXPOSE 8080

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

-----

## Step 3: Build and Push the Container

Now, you'll use Cloud Build to read your `Dockerfile`, build the container, and push it to your private Artifact Registry.

1.  **Create a Repository:**

    ```bash
    # Replace 'my-repo' with a name and 'us-central1' with your preferred region
    gcloud artifacts repositories create my-repo \
        --repository-format=docker \
        --location=us-central1 \
        --description="My Vaadin App Repository"
    ```

2.  **Build and Push:** Run this command from your project's root directory (where the `Dockerfile` is).

    ```bash
    # This command builds the image and tags it with the repository path
    # (replace 'us-central1' and 'my-repo' as needed)
    gcloud builds submit --tag us-central1-docker.pkg.dev/$(gcloud config get-value project)/my-repo/bmdexpress-web
    ```

    This step will take a few minutes as it downloads dependencies and builds your app.

-----

## Step 4: Deploy to Cloud Run

This is the final step. You'll tell Cloud Run to take the image you just built and deploy it.

**This command includes the most critical setting for Vaadin: `--session-affinity`**. Vaadin is stateful, so you must ensure a user "sticks" to the same server instance for their entire session.

```bash
# Replace 'us-central1' and 'my-repo' with your values
gcloud run deploy bmdexpress-web \
    --image=us-central1-docker.pkg.dev/$(gcloud config get-value project)/my-repo/bmdexpress-web \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --port=8080 \
    --session-affinity
```

**What these flags mean:**

  * `--image=...`: The image you just built.
  * `--platform=managed`: You want the fully-managed serverless platform.
  * `--region=...`: The region to run your app in.
  * `--allow-unauthenticated`: Makes your app public on the internet.
  * `--port=8080`: Tells Cloud Run your app listens on 8080.
  * `--session-affinity`: **Essential for Vaadin.** This enables "sticky sessions."

After it finishes, `gcloud` will print the **Service URL** for your live application. You can now access it from anywhere.

-----

### ⚠️ Important Next Step: Your Database

Your `application.properties` file uses `spring.jpa.hibernate.ddl-auto=update`. This implies you're using a local file or in-memory database (like H2).

**This will not work in Cloud Run.** The container's filesystem is temporary. Every time your app scales to zero or restarts, **all data will be lost.**

You must use an external, managed database. The standard solution is **Google Cloud SQL**.

1.  Create a Cloud SQL (e.g., PostgreSQL or MySQL) instance.
2.  Add a **"Cloud SQL Connection"** to your Cloud Run service (it's a setting in the console).
3.  Update your `pom.xml` and `application.properties` to use the [Cloud SQL Socket Factory](https://www.google.com/search?q=https://github.com/GoogleCloudPlatform/cloud-sql-java-socket-factory) for a secure, automatic connection.

Here's a video that explains how to connect a Spring Boot application to Cloud SQL, which is the exact next step you'll need to take.
[Connecting a Spring Boot App to Cloud SQL](https://www.youtube.com/watch?v=dAvmQ0_wOFE)
http://googleusercontent.com/youtube_content/0
