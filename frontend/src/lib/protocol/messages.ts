// Kurze Namen für die Typen des Backend-JSON-Protokolls (REST + WebSocket). Die Typen selbst
// kommen aus `./generated/api.ts` (nicht in Git), das aus dem OpenAPI-Schema des Backends erzeugt
// wird: automatisch beim Maven-Build sowie vor `npm run dev`/`test`/`check`
// (Skript `generate:api:backend`).
// Felder werden daher in den Kotlin-Klassen geändert, nicht hier. Neue Schemas, die das
// Frontend braucht, bekommen hier von Hand einen Alias.

import type { components } from './generated/api'

type Schemas = components['schemas']

export type PointDto = Schemas['PointDto']

export type FreehandShapeData = Schemas['FreehandShapeData']
export type LineShapeData = Schemas['LineShapeData']
export type RectShapeData = Schemas['RectShapeData']
export type CircleShapeData = Schemas['CircleShapeData']
export type EllipseShapeData = Schemas['EllipseShapeData']
export type TextShapeData = Schemas['TextShapeData']
export type ArrowShapeData = Schemas['ArrowShapeData']
export type StickyNoteShapeData = Schemas['StickyNoteShapeData']
export type ShapeData = Schemas['ShapeData']
export type ShapeType = Schemas['ShapeType']

export type CanvasObjectDto = Schemas['CanvasObjectDto']
export type CanvasSummaryDto = Schemas['CanvasSummaryDto']
export type CreateCanvasRequest = Schemas['CreateCanvasRequest']
export type PresenceInfo = Schemas['PresenceInfo']
export type ObjectUpdateEntry = Schemas['ObjectUpdateEntry']

// --- Client -> Server, Kanal /ws/canvas/{canvasId} ---
export type ClientMessage = Schemas['ClientMessage']

// --- Server -> Client, Kanal /ws/canvas/{canvasId} ---
export type ServerMessage = Schemas['ServerMessage']

// --- Lobby (Startbildschirm) Server -> Client, Kanal /ws/canvases ---
export type LobbyServerMessage = Schemas['LobbyServerMessage']
