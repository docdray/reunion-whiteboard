# Reunion

Kollaboratives Whiteboard: mehrere Nutzer zeichnen live auf einem gemeinsamen Canvas (Freihand, Linie, Rechteck, Kreis, Ellipse, Text), sehen sich gegenseitig Mauszeiger und laufende Zeichenvorgänge.

## Struktur

- `backend/` — Quarkus/Kotlin, REST + WebSocket, SQLite-Persistenz
- `frontend/` — Svelte 5 + Vite + TypeScript, Konva.js für das Canvas-Rendering

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
