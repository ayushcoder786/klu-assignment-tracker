# ==============================================================================
# KLU Assignment Tracker — Backend Production Dockerfile
# Multi-stage build for minimal production image footprint
# ==============================================================================

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:25-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and POM first for layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

# Copy source code and build artifact
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:25-jre-alpine AS runner

WORKDIR /app

# Create a non-privileged application user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy JAR from build stage
COPY --from=builder /app/target/assignment-tracker-*.jar app.jar

# Expose default HTTP port
EXPOSE 8081

# Recommended JVM flags for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
