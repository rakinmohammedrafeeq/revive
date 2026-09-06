#!/usr/bin/env bash
# Render Docker Build Script - More memory efficient
# Uses Docker to build with controlled memory limits

set -e

echo "======================================"
echo "🐳 Docker-based Build (Memory Optimized)"
echo "======================================"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not available, falling back to standard build"
    exec ./render-build.sh
fi

echo "Building with Docker (memory-limited)..."

# Build using the production Dockerfile with memory limits
docker build \
  --memory="1g" \
  --memory-swap="1g" \
  -f Dockerfile.prod \
  -t revive-backend:latest \
  .

echo "======================================"
echo "✅ Docker build complete!"
echo "======================================"

# Extract the built JAR from the Docker image
docker create --name temp-extract revive-backend:latest
docker cp temp-extract:/app/app.jar target/app.jar
docker rm temp-extract

echo "✅ JAR extracted to target/app.jar"
