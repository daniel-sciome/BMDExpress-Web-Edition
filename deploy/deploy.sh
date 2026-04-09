#!/usr/bin/env bash
# ============================================================================
# BMDExpress Web Edition — Deployment Script
# ============================================================================
# Purpose:
#   Automates the full deployment of BMDExpress Web Edition as a systemd
#   service. Handles: creating a system user, building the production JAR,
#   copying files to /opt/bmdexpress-web, installing the systemd unit, and
#   starting the service.
#
# Usage:
#   sudo ./deploy.sh              # Full deploy (build + install + start)
#   sudo ./deploy.sh --skip-build # Install + start only (use existing JAR)
#
# Prerequisites:
#   - Java 21 (java and javac on PATH)
#   - Maven (mvn on PATH) — unless using --skip-build
#   - Node.js and npm — for the Vaadin/React frontend build
#   - Must run as root (sudo) for user creation and systemd operations
#
# What this script does:
#   1. Creates a 'bmdexpress' system user (no login shell, no home dir)
#   2. Syncs .bm2 library data from /opt into the source tree for bundling
#   3. Builds the production WAR/JAR with Maven (unless --skip-build)
#   4. Creates /opt/bmdexpress-web and copies the JAR + data files
#   5. Installs the systemd unit file and environment config
#   6. Enables and starts the service
# ============================================================================

set -euo pipefail  # Exit on error, undefined vars, or pipe failures

# --- Configuration ---
# These can be overridden via environment variables before running the script.

# Where the application will be installed on the system
INSTALL_DIR="${INSTALL_DIR:-/opt/bmdexpress-web}"

# The system user/group that will own and run the service
SERVICE_USER="${SERVICE_USER:-bmdexpress}"

# Name of the systemd service (must match the .service filename)
SERVICE_NAME="bmdexpress-web"

# Directory containing this script (used to find sibling files)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Project root is one level up from deploy/
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Whether to skip the Maven build (set via --skip-build flag)
SKIP_BUILD=false

# --- Parse Arguments ---
# Currently supports one flag: --skip-build to reuse an existing JAR
for arg in "$@"; do
    case "$arg" in
        --skip-build)
            SKIP_BUILD=true
            ;;
        --help|-h)
            echo "Usage: sudo $0 [--skip-build]"
            echo "  --skip-build  Skip Maven build, use existing JAR in target/"
            exit 0
            ;;
        *)
            echo "Unknown argument: $arg"
            echo "Usage: sudo $0 [--skip-build]"
            exit 1
            ;;
    esac
done

# --- Preflight Checks ---

# Must run as root because we create system users and write to /opt and /etc
if [[ $EUID -ne 0 ]]; then
    echo "ERROR: This script must be run as root (sudo)."
    exit 1
fi

# Verify Java 21 is available — the app requires it
if ! command -v java &>/dev/null; then
    echo "ERROR: Java not found. Install Java 21 (e.g., eclipse-temurin-21-jdk)."
    exit 1
fi

# Check that Java is version 21 specifically
JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
if [[ "$JAVA_VERSION" -lt 21 ]]; then
    echo "ERROR: Java 21+ required (found version $JAVA_VERSION)."
    exit 1
fi

echo "=== BMDExpress Web Edition Deployment ==="
echo "Install directory: $INSTALL_DIR"
echo "Service user:      $SERVICE_USER"
echo "Project directory:  $PROJECT_DIR"
echo ""

# --- Step 1: Create System User ---
# A dedicated unprivileged user isolates the service from the rest of the
# system. --system creates a low-UID user, --no-create-home avoids a home
# directory (the app lives in /opt), -s /usr/sbin/nologin prevents login.
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "[1/6] Creating system user '$SERVICE_USER'..."
    # --create-home is required because the bmdexpress3 library writes
    # preferences and config files to ~/bmdexpress3/ at startup
    useradd --system --create-home --shell /usr/sbin/nologin "$SERVICE_USER"
else
    echo "[1/6] System user '$SERVICE_USER' already exists — skipping."
fi

# --- Step 2: Sync library data into source tree ---
# The .bm2 files live on disk at /opt/bmdexpress-web/data/bmd/ (the source of
# truth). Before building, we copy them into the Maven resources directory so
# they get bundled into the JAR on the classpath. This means the app doesn't
# need a --bmdexpress.library.dataPath override at runtime — the default
# classpath:data/bmd location works out of the box.
BMD_DATA_DIR="$INSTALL_DIR/data/bmd"
RESOURCE_BMD_DIR="$PROJECT_DIR/src/main/resources/data/bmd"

if [[ -d "$BMD_DATA_DIR" ]]; then
    echo "[2/6] Syncing .bm2 library data into source tree..."
    mkdir -p "$RESOURCE_BMD_DIR"
    cp "$BMD_DATA_DIR"/*.bm2 "$RESOURCE_BMD_DIR/"
    echo "      Copied $(ls "$BMD_DATA_DIR"/*.bm2 | wc -l) .bm2 files."
else
    echo "[2/6] No library data at $BMD_DATA_DIR — skipping sync."
fi

# --- Step 3: Build Production JAR ---
# The Maven build compiles Java, runs the Vaadin production frontend build
# (webpack/vite bundling, minification), and packages everything into a
# single executable WAR file.
if [[ "$SKIP_BUILD" == "false" ]]; then
    echo "[3/6] Building production JAR (this may take several minutes)..."
    cd "$PROJECT_DIR"
    # -Pproduction activates the Vaadin production profile (optimized frontend)
    # -DskipTests skips unit tests for faster deployment builds
    ./mvnw -Pproduction package -DskipTests
    echo "      Build complete."
else
    echo "[3/6] Skipping build (--skip-build flag set)."
fi

# --- Step 4: Install Application Files ---
echo "[4/6] Installing application files to $INSTALL_DIR..."

# Create the install directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Find the built WAR file — Spring Boot repackages it as an executable JAR.
# The glob matches version-stamped filenames like bmdexpress-web-1.0.0.war
WAR_FILE=$(find "$PROJECT_DIR/target" -maxdepth 1 -name "bmdexpress-web-*.war" | head -1)
if [[ -z "$WAR_FILE" ]]; then
    echo "ERROR: No WAR file found in $PROJECT_DIR/target/"
    echo "       Run the build first, or remove --skip-build."
    exit 1
fi

# Copy the WAR as app.jar (simpler name, matches the systemd ExecStart command)
cp "$WAR_FILE" "$INSTALL_DIR/app.jar"

# Copy questionnaire data — the app reads these from the filesystem at runtime
# (configured as data/questionnaires in application.yml)
if [[ -d "$PROJECT_DIR/data/questionnaires" ]]; then
    mkdir -p "$INSTALL_DIR/data/questionnaires"
    cp -r "$PROJECT_DIR/data/questionnaires/"* "$INSTALL_DIR/data/questionnaires/"
    echo "      Copied questionnaire data."
fi

# Set ownership so only the service user can access the files
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

# --- Step 5: Install systemd Files ---
echo "[5/6] Installing systemd service..."

# Copy the unit file to systemd's system directory
cp "$SCRIPT_DIR/bmdexpress-web.service" /etc/systemd/system/

# Only copy the environment config if it doesn't already exist — this
# preserves any customizations the admin has made to memory/port settings
if [[ ! -f "$INSTALL_DIR/bmdexpress-web.conf" ]]; then
    cp "$SCRIPT_DIR/bmdexpress-web.conf" "$INSTALL_DIR/"
    chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/bmdexpress-web.conf"
    echo "      Installed default environment config."
else
    echo "      Environment config already exists — preserving existing settings."
fi

# Tell systemd to re-read unit files (picks up our new/updated .service file)
systemctl daemon-reload

# --- Step 6: Enable and Start ---
echo "[6/6] Enabling and starting service..."

# enable: start on boot; --now: also start immediately
systemctl enable --now "$SERVICE_NAME"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Service status:  sudo systemctl status $SERVICE_NAME"
echo "View logs:       journalctl -u $SERVICE_NAME -f"
echo "Restart:         sudo systemctl restart $SERVICE_NAME"
echo "Stop:            sudo systemctl stop $SERVICE_NAME"
echo "Edit config:     sudo nano $INSTALL_DIR/bmdexpress-web.conf"
echo ""
LOCAL_IP=$(ip -4 addr show scope global | grep -oP 'inet \K[\d.]+' | head -1)
echo "The application should be available at: http://${LOCAL_IP:-localhost}:8080"
