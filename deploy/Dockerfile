# Baut Frontend (Svelte/Vite) und Backend (Kotlin/Quarkus) vollständig im Container.
# Auf dem Host wird nur Docker benötigt - kein Java, Node oder npm.

############################
# Stage 1: Build
############################
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src
# frontend-maven-plugin (im Backend-POM) lädt Node/npm selbst herunter und baut das Frontend mit.
COPY frontend frontend

# Sichtbarkeit für Troubleshooting (Download-/Zertifikatsprobleme bei Maven- und npm-Zugriffen):
# - kein "-q": Maven loggt jeden Dependency-Download (Downloading/Downloaded from ...).
# - npm_config_loglevel=verbose: npm (von frontend-maven-plugin aufgerufen) loggt jeden
#   Registry-Request inkl. HTTP-Status und TLS-/Zertifikatsfehlern.
# - MAVEN_OPTS per Build-Arg: für tiefere TLS-Diagnose bei Bedarf setzen, z.B.
#   --build-arg MAVEN_OPTS="-Djavax.net.debug=ssl:handshake" (sehr geschwätzig, daher kein Default).
ARG MAVEN_OPTS=""
ENV MAVEN_OPTS=${MAVEN_OPTS}
ENV npm_config_loglevel=verbose

WORKDIR /workspace/backend
RUN mvn -B -e -DskipTests clean package

############################
# Stage 2: Runtime
############################
FROM eclipse-temurin:21-jre AS runtime

WORKDIR /deployments

COPY --from=build /workspace/backend/target/quarkus-app/lib/ /deployments/lib/
COPY --from=build /workspace/backend/target/quarkus-app/*.jar /deployments/
COPY --from=build /workspace/backend/target/quarkus-app/app/ /deployments/app/
COPY --from=build /workspace/backend/target/quarkus-app/quarkus/ /deployments/quarkus/

RUN mkdir -p /deployments/data

EXPOSE 8080

ENTRYPOINT ["java", "-Dquarkus.http.host=0.0.0.0", "-jar", "/deployments/quarkus-run.jar"]
