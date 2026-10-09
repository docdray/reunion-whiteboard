# Dateiübersicht

Welche Datei ist wofür zuständig. Testdateien (`*.test.ts`, `*Test.kt`) liegen jeweils neben bzw. analog zu der getesteten Datei und sind nur dort extra aufgeführt, wo sie mehr als eine einzelne Datei abdecken.

## Repository-Wurzel

| Datei | Aufgabe |
|---|---|
| `README.md` | Projektbeschreibung, Entwicklungs-, Build- und Docker-Anleitung |
| `.gitignore`, `.dockerignore` | Ausschlüsse für Git bzw. den Docker-Build-Kontext |
| `deploy/Dockerfile` | Mehrstufiger Build: baut Frontend + Backend im Container (Maven-Image) und erzeugt ein schlankes JRE-Laufzeit-Image |
| `deploy/docker-compose.yml` | Startet die App auf Port 8080, SQLite-Datenbank im Volume `reunion-data` |

## Backend (`backend/`, Quarkus + Kotlin)

### Build & Konfiguration

| Datei | Aufgabe |
|---|---|
| `pom.xml` | Maven-Build, Abhängigkeiten (Quarkus REST, WebSockets Next, Hibernate Panache, SQLite, SmallRye OpenAPI). Erzeugt nach dem Kompilieren `target/openapi/openapi.json`, generiert daraus die Frontend-Protokolltypen, baut über `frontend-maven-plugin` das Frontend mit und kopiert `frontend/dist` nach `META-INF/resources`, sodass alles aus einem JAR ausgeliefert wird |
| `mvnw`, `mvnw.cmd`, `.mvn/wrapper/` | Maven Wrapper |
| `src/main/resources/application.properties` | SQLite-Datenquelle (WAL-Modus, Pool = 1 Connection), Schema-Strategie; separate Test-DB im Profil `%test`; registriert den OpenAPI-Filter |
| `src/main/docker/Dockerfile.*` | Quarkus-Standard-Dockerfiles (JVM/Native) – nicht vom Deployment genutzt, das läuft über `deploy/Dockerfile` |
| `data/` | Ablageort der SQLite-Datei `reunion.db` zur Laufzeit |

### Quellcode (`src/main/kotlin/org/reunion/canvas/`)

| Datei | Aufgabe |
|---|---|
| `rest/CanvasResource.kt` | REST-API `/api/canvases`: Canvases auflisten, anlegen, löschen (409 bei aktiven Nutzern, 404 wenn nicht vorhanden) |
| `service/CanvasService.kt` | Geschäftslogik für Canvases: anlegen, auflisten, löschen (inkl. Löschen aller Objekte, Schutz gegen Löschen bei aktiven Nutzern), informiert die Lobby |
| `service/CanvasObjectService.kt` | Zeichenobjekte eines Canvas: laden, anlegen (mit fortlaufender `sequence`), aktualisieren, löschen – jeweils auf den eigenen Canvas beschränkt |
| `entity/CanvasEntity.kt` | JPA-Entity Tabelle `canvases` |
| `entity/CanvasObjectEntity.kt` | JPA-Entity Tabelle `objects`; Form-Daten als JSON-Text gespeichert |
| `repository/CanvasRepository.kt` | Panache-Repository für Canvases |
| `repository/CanvasObjectRepository.kt` | Panache-Repository für Objekte: sortiert laden, nächste Sequenznummer, Löschen nach IDs / nach Canvas |
| `dto/CanvasSummaryDto.kt` | Canvas-Listeneintrag (Name, Erstellzeit, Anzahl aktiver Nutzer) |
| `dto/CanvasObjectDto.kt` | Zeichenobjekt, wie es an Clients geht |
| `dto/CreateCanvasRequest.kt` | Request-Body zum Anlegen eines Canvas |
| `shape/ShapeData.kt` | Polymorphe Form-Daten (Freihand, Linie, Rechteck, Kreis, Ellipse, Text, Pfeil, Notizzettel) mit `type`-Diskriminator |
| `presence/PresenceRegistry.kt` | Flüchtige Info, wer mit welchem Canvas verbunden ist (inkl. Cursorposition); Sperre pro Canvas gegen Race Conditions beim Löschen |
| `presence/PresenceInfo.kt` | Daten eines verbundenen Nutzers (Name, Farbe, Cursor) |
| `presence/PresenceColors.kt` | Round-Robin-Farbpalette für Nutzer |
| `ws/CanvasWebSocketEndpoint.kt` | WebSocket `/ws/canvas/{canvasId}`: Beitritt/Verlassen, Cursor, Zeichenvorschau, Objekte anlegen/ändern/löschen; Broadcasts nur an Verbindungen desselben Canvas |
| `ws/LobbyWebSocketEndpoint.kt` | WebSocket `/ws/canvases`: reiner Server-Push für den Startbildschirm, sendet beim Verbinden die Canvas-Liste |
| `ws/LobbyBroadcaster.kt` | Verschickt Lobby-Updates (Canvas hinzugefügt/geändert/entfernt) an alle Lobby-Verbindungen |
| `ws/protocol/ClientMessage.kt` | Nachrichten Client → Server im Canvas-WebSocket |
| `ws/protocol/ServerMessage.kt` | Nachrichten Server → Client im Canvas-WebSocket |
| `ws/protocol/LobbyServerMessage.kt` | Nachrichten Server → Client im Lobby-WebSocket |
| `openapi/ReunionOpenApiDefinition.kt` | OpenAPI-Definition; nimmt die WebSocket-Nachrichten ins Schema auf, die sonst kein REST-Endpunkt referenziert |
| `openapi/PolymorphicSchemaFilter.kt` | Überträgt die Jackson-Polymorphie (`type`-Diskriminator) ins OpenAPI-Schema und erzeugt das Enum `ShapeType` |

### Tests (`src/test/kotlin/org/reunion/canvas/`)

| Datei | Aufgabe |
|---|---|
| `CanvasResourceTest.kt` | REST-API-Tests |
| `CanvasServiceTest.kt`, `CanvasObjectServiceTest.kt` | Service-Tests |
| `ws/CanvasWebSocketEndpointTest.kt`, `ws/LobbyWebSocketEndpointTest.kt` | WebSocket-Tests |
| `ws/TestCanvasClient.kt`, `ws/TestLobbyClient.kt` | WebSocket-Test-Clients als Hilfsklassen |

## Frontend (`frontend/`, Svelte 5 + Vite + TypeScript + Konva)

### Build & Konfiguration

| Datei | Aufgabe |
|---|---|
| `package.json` | Abhängigkeiten und npm-Skripte (u. a. `generate:api`, `generate:api:backend` als Vorstufe von `dev`/`test`/`check`) |
| `vite.config.ts` | Vite-Build, Dev-Proxy (`/api`, `/ws` → Port 8080), Vitest-Konfiguration (jsdom) |
| `playwright.config.ts` | E2E-Tests gegen das gebaute JAR auf Port 8080 |
| `svelte.config.js`, `tsconfig*.json` | Svelte- und TypeScript-Konfiguration |
| `index.html` | HTML-Einstieg, Titel, Favicon |
| `src/main.ts` | Mountet die App; stellt `window.__reunionTest` als Lese-Hook für E2E-Tests bereit |
| `src/app.css` | Globale Styles |
| `src/test-setup.ts` | Setup für Vitest |

### Komponenten (`src/App.svelte`, `src/components/`)

| Datei | Aufgabe |
|---|---|
| `App.svelte` | Einfaches Routing zwischen Startbildschirm und Canvas-Ansicht |
| `StartScreen.svelte` | Startbildschirm: Namenseingabe + Canvas-Liste |
| `NameEntry.svelte` | Eingabe des Anzeigenamens |
| `CanvasList.svelte` | Canvas-Liste mit Anlegen-Formular, live über Lobby-WebSocket |
| `CanvasListItem.svelte` | Eine Zeile der Liste (Öffnen, Löschen nur ohne aktive Nutzer) |
| `CanvasView.svelte` | Canvas-Seite: WebSocket-Verbindung, Verarbeitung der Server-Nachrichten, Maus-/Tastatur-Events, Pan/Zoom, Randglühen für Objekte außerhalb der Ansicht, Verbindungsstatus, Verdrahtung der Interaktionsmodi |
| `Toolbar.svelte` | Werkzeugleiste; wendet Stiländerungen bei aktiver Selektion auf markierte Objekte an |
| `ModeSwitch.svelte` | Umschalter Navigation / Zeichnen / Markieren |
| `ToolPicker.svelte` | Auswahl des Zeichenwerkzeugs (inkl. Radierer) |
| `ColorPicker.svelte` | Farbauswahl |
| `StrokeWidthSelector.svelte` | Linienstärke bzw. Radiergröße |
| `FilledToggle.svelte` | Gefüllt ja/nein |
| `DoubleHeadedToggle.svelte` | Doppelpfeil ja/nein |
| `FontDialog.svelte` | Schriftart, -größe, fett/kursiv/unterstrichen/durchgestrichen |

### Logik (`src/lib/`)

**API / Netzwerk (`api/`)**

| Datei | Aufgabe |
|---|---|
| `canvasApi.ts` | REST-Aufrufe für Canvases, eigene Fehlerklassen für 409/404 |
| `reconnectingSocket.ts` | Generischer WebSocket mit automatischem Reconnect (exponentieller Backoff) und Verbindungsstatus |
| `ws.ts` | Canvas-WebSocket (typisierte Client-/Server-Nachrichten) |
| `lobbyWs.ts` | Lobby-WebSocket |

**Protokoll (`protocol/`)**

| Datei | Aufgabe |
|---|---|
| `generated/api.ts` | **Generiert** (openapi-typescript) aus dem OpenAPI-Schema des Backends, nicht in Git; entsteht beim Maven-Build bzw. vor `npm run dev`/`test`/`check` |
| `messages.ts` | Kurze Namen für die generierten Protokolltypen (Form-Daten, DTOs, Nachrichten); einziger Import-Punkt für den restlichen Code |

**Zustand (`stores/`, Svelte-5-Runes)**

| Datei | Aufgabe |
|---|---|
| `canvasListStore.svelte.ts` | Canvas-Liste des Startbildschirms, aktualisiert über Lobby-WebSocket |
| `canvasStore.svelte.ts` | Zeichenobjekte des offenen Canvas (nach `sequence` sortiert) |
| `presenceStore.svelte.ts` | Andere Nutzer und deren Cursor |
| `previewStore.svelte.ts` | Live-Zeichenvorschauen (eigene + fremde, fremde laufen automatisch ab) |
| `selectionStore.svelte.ts` | Selektion, Verschiebe-Delta, Auswahlrechteck, Resize-Vorschau, Griff-Hover |
| `toolStore.svelte.ts` | Modus, Werkzeug und Stil-Einstellungen (Farbe, Stärke, Schrift …) |
| `userStore.svelte.ts` | Anzeigename, in `localStorage` gespeichert |
| `viewportStore.svelte.ts` | Pan und Zoom |

**Interaktion (`interaction/`, Konva-unabhängige Zustandsmaschinen)**

| Datei | Aufgabe |
|---|---|
| `drawMode.ts` | Zeichnen per Ziehen/Klicken, Vorschau und Commit |
| `selectMode.ts` | Markieren per Klick/Auswahlrechteck, Verschieben |
| `resizeMode.ts` | Anfasspunkte (Griffe) und Größenänderung |
| `eraserMode.ts` | Radierer: löscht getroffene Objekte während des Ziehens |
| `editTextMode.ts` | Text/Notizzettel bearbeiten |
| `selectionStyleEdit.ts` | Welche Stil-Eigenschaften ein Objekt hat und Funktionen, um sie zu ändern |
| `selectionToToolStore.ts` | Übernimmt die Stile des markierten Objekts in den Tool-Store |

**Geometrie (`geometry/`, reine Funktionen)**

| Datei | Aufgabe |
|---|---|
| `shapeFromDrag.ts` | Erzeugt Form-Daten aus einer Ziehbewegung bzw. einem Klick |
| `shapeBounds.ts` | Bounding-Boxen und Hit-Test |
| `arrowHead.ts` | Geometrie offener Pfeilspitzen |
| `gridLines.ts` | Hintergrundgitter passend zum Zoom |
| `zoomToCursor.ts` | Zoom um die Mausposition, Zoomgrenzen |
| `centerView.ts` | Viewport so berechnen, dass alle Objekte sichtbar und zentriert sind |
| `offscreenEdges.ts` | An welchen Rändern der Ansicht Objekte außerhalb des sichtbaren Bereichs liegen (für das blaue Randglühen) |

**Rendering (`konva/`)**

| Datei | Aufgabe |
|---|---|
| `stageAction.svelte.ts` | Svelte-Action, die die Konva-Stage verwaltet: zeichnet Gitter, Objekte, Vorschauen, fremde Cursor, Selektion und Griffe aus den Stores |

### E2E-Tests (`e2e/`, Playwright)

| Datei | Aufgabe |
|---|---|
| `helpers.ts` | Gemeinsame Hilfsfunktionen (Name setzen, Canvas anlegen/öffnen …) |
| `collab-draw.spec.ts` | Gemeinsames Zeichnen mehrerer Nutzer |
| `presence-cursor.spec.ts` | Anzeige fremder Nutzer/Cursor |
| `select-and-delete.spec.ts` | Markieren und Löschen |
