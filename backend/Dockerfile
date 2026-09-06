# ============================================================
# Multi-Stage Dockerfile for Revive Backend (Spring Boot 3.2.5)
# Java 17 | Maven | Development & Testing
# ============================================================

# Stage 1: Build Stage (Maven build with JDK)
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy only pom.xml to leverage Docker layer caching
COPY pom.xml .

# Download dependencies (separate layer for better caching)
RUN mvn dependency:go-offline -B -q

# Copy source code
COPY src ./src

# Build the application (skip tests for faster builds)
RUN mvn clean package -B -q -DskipTests && \
    mv target/revive-backend-*.jar target/app.jar

# ============================================================
# Stage 2: Runtime Stage (lightweight JRE image + Python for ML)
FROM eclipse-temurin:17-jre

# Install Python, pip, and curl for ML predictions and health checks
RUN apt-get update && \
    apt-get install -y curl python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Install Python ML dependencies
RUN pip3 install --no-cache-dir \
    scikit-learn==1.3.0 \
    pandas==2.0.3 \
    numpy==1.24.3 \
    joblib==1.3.2

WORKDIR /app

# Create non-root user for security
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app

# Copy built JAR from builder stage
COPY --from=builder --chown=appuser:appuser /build/target/app.jar app.jar

# Copy ML model and prediction script (critical for recovery predictions)
COPY --chown=appuser:appuser ml /app/ml

# Switch to non-root user
USER appuser

# Expose port (can be overridden at runtime)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/healthz || exit 1

# JVM optimization flags
ENV JAVA_OPTS="-XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:+UseG1GC \
    -Djava.security.egd=file:/dev/./urandom"

# Run the application with PORT environment variable support
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar --server.port=${PORT:-8080}"]

