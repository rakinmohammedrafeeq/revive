#!/usr/bin/env bash
# Render build script - ULTRA memory optimized for 512MB limit

set -e

echo "======================================"
echo "🔧 Installing Python dependencies..."
echo "======================================"

# Install Python and pip (required for ML)
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv > /dev/null 2>&1

# Install ML dependencies with minimal output
pip3 install --no-cache-dir --quiet \
  scikit-learn==1.3.0 \
  pandas==2.0.3 \
  numpy==1.24.3 \
  joblib==1.3.2

echo "✅ Python dependencies installed"

echo "======================================"
echo "🏗️  Building Spring Boot (Low Memory Mode)..."
echo "======================================"

cd /opt/render/project/src/backend

# CRITICAL: Set strict memory limits for Maven
export MAVEN_OPTS="-Xmx400m -Xms200m -XX:+UseSerialGC -XX:MaxMetaspaceSize=128m -Djava.awt.headless=true"

# Clear any existing build artifacts to save space
rm -rf target/* 2>/dev/null || true

# Build with:
# - Single thread (-T 1)
# - Skip tests (-DskipTests)
# - Quiet output to save memory
# - No transfer progress to reduce logging
echo "Running Maven build with 400MB heap limit..."
./mvnw clean package -T 1 -DskipTests -q \
  -Dorg.slf4j.simpleLogger.showDateTime=false \
  -Dorg.slf4j.simpleLogger.log.org.apache.maven.cli.transfer.Slf4jMavenTransferListener=warn

# Verify the JAR was created
if [ ! -f target/revive-backend-*.jar ]; then
    echo "❌ Build failed - JAR not found"
    exit 1
fi

echo "======================================"
echo "✅ Build complete!"
echo "======================================"

# Show build size for debugging
ls -lh target/*.jar

