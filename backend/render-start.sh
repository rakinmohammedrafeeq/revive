#!/bin/bash
# Render Start Script with Memory Optimization

# Calculate memory limits based on available RAM
# Render free tier: 512MB total
# Leave ~100MB for system overhead
MAX_HEAP="-Xmx350m"
INITIAL_HEAP="-Xms128m"

# JVM options optimized for low memory
JAVA_OPTS="$MAX_HEAP $INITIAL_HEAP"
JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"                    # Use G1 garbage collector (better for low memory)
JAVA_OPTS="$JAVA_OPTS -XX:MaxGCPauseMillis=100"        # Limit GC pause time
JAVA_OPTS="$JAVA_OPTS -XX:+UseStringDeduplication"     # Reduce memory from duplicate strings
JAVA_OPTS="$JAVA_OPTS -XX:+OptimizeStringConcat"       # Optimize string operations
JAVA_OPTS="$JAVA_OPTS -Djava.security.egd=file:/dev/./urandom" # Faster startup
JAVA_OPTS="$JAVA_OPTS -Dserver.tomcat.threads.max=20" # Limit threads (less memory per thread)
JAVA_OPTS="$JAVA_OPTS -Dspring.jmx.enabled=false"      # Disable JMX (saves memory)

echo "Starting application with memory settings:"
echo "Max Heap: 350MB, Initial Heap: 128MB"
echo "JAVA_OPTS: $JAVA_OPTS"

# Start the application
java $JAVA_OPTS -jar target/*.jar
