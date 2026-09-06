#!/usr/bin/env bash
# Render build script for Spring Boot + Python ML

set -e

echo "======================================"
echo "🔧 Installing Python dependencies..."
echo "======================================"

# Install Python and pip
apt-get update
apt-get install -y python3 python3-pip python3-venv

# Install ML dependencies
pip3 install --no-cache-dir \
  scikit-learn==1.3.0 \
  pandas==2.0.3 \
  numpy==1.24.3 \
  joblib==1.3.2

echo "======================================"
echo "✅ Python dependencies installed"
echo "======================================"

# Verify Python installation
python3 --version
pip3 list | grep -E "(scikit-learn|pandas|numpy|joblib)"

echo "======================================"
echo "🏗️  Building Spring Boot application..."
echo "======================================"

# Build Spring Boot app
cd /opt/render/project/src/backend
./mvnw clean package -DskipTests

echo "======================================"
echo "✅ Build complete!"
echo "======================================"
