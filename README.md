# Reunion

Kollaboratives Whiteboard: mehrere Nutzer zeichnen live auf einem gemeinsamen Canvas (Freihand, Linie, Rechteck, Kreis, Ellipse, Text), sehen sich gegenseitig Mauszeiger und laufende Zeichenvorgänge.

## Struktur

- `backend/` — Quarkus/Kotlin, REST + WebSocket, SQLite-Persistenz
- `frontend/` — Svelte 5 + Vite + TypeScript, Konva.js für das Canvas-Rendering

Welche Datei wofür zuständig ist, steht in [DATEIEN.md](DATEIEN.md).

## Entwicklung

```shell script
# Backend (Port 8080)
cd backend && ./mvnw quarkus:dev

# Frontend (Port 5173, proxied zu 8080)
cd frontend && npm run dev
```

## Produktions-Build (einzelnes Artefakt)

```shell script
cd backend && ./mvnw clean package
java -jar target/quarkus-app/quarkus-run.jar
```

Der Build kompiliert das Frontend automatisch und liefert es zusammen mit Backend/API/WebSocket aus einem einzigen JAR aus.

## Deployment mit Docker

Baut Frontend und Backend vollständig im Container — auf dem Host wird nur Docker benötigt, kein Java/Kotlin/Node.

```shell script
docker compose -f deploy/docker-compose.yml up --build
```

Die App läuft danach auf Port 8080; die SQLite-Datenbank liegt im benannten Volume `reunion-data` und bleibt über Neustarts hinweg erhalten.

Für den vollen Build-Log (Maven-Downloads, Node/npm-Installation) statt der zusammengefassten Fortschrittsanzeige:

```shell script
docker compose -f deploy/docker-compose.yml build --progress=plain
```

Bei TLS-/Zertifikatsproblemen lässt sich zusätzlich der SSL-Handshake der JVM mitloggen:

```shell script
docker build --progress=plain --build-arg MAVEN_OPTS="-Djavax.net.debug=ssl:handshake" -f deploy/Dockerfile -t reunion .
```
