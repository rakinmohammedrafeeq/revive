# ============================================================
# Multi-Stage Dockerfile for Ledgera Backend (Spring Boot 3.2.5)
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
    mv target/ledgera-backend-*.jar target/app.jar

# ============================================================
# Stage 2: Runtime Stage (lightweight JRE image)
FROM eclipse-temurin:17-jre

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create non-root user for security
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app

# Copy built JAR from builder stage
COPY --from=builder --chown=appuser:appuser /build/target/app.jar app.jar

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

