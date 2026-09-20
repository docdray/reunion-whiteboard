// Spiegelt exakt das Backend-JSON-Protokoll (Jackson @JsonTypeInfo/@JsonSubTypes mit "type"-Discriminator).
// Backend-Quelle: backend/src/main/kotlin/org/reunion/canvas/{shape/ShapeData.kt,dto/*.kt,ws/protocol/*.kt}

export interface PointDto {
  x: number
  y: number
}

export interface FreehandShapeData {
  type: 'freehand'
  color: string
  strokeWidth: number
  points: PointDto[]
}

export interface LineShapeData {
  type: 'line'
  color: string
  strokeWidth: number
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface RectShapeData {
  type: 'rect'
  color: string
  strokeWidth: number
  filled: boolean
  x: number
  y: number
  width: number
  height: number
}

export interface CircleShapeData {
  type: 'circle'
  color: string
  strokeWidth: number
  filled: boolean
  x: number
  y: number
  radius: number
}

export interface EllipseShapeData {
  type: 'ellipse'
  color: string
  strokeWidth: number
  filled: boolean
  x: number
  y: number
  radiusX: number
  radiusY: number
}

export interface TextShapeData {
  type: 'text'
  color: string
  x: number
  y: number
  content: string
  fontFamily: string
  fontSize: number
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
}

export interface ArrowShapeData {
  type: 'arrow'
  color: string
  strokeWidth: number
  filled: boolean
  x1: number
  y1: number
  x2: number
  y2: number
  doubleHeaded: boolean
}

export type ShapeData =
  | FreehandShapeData
  | LineShapeData
  | RectShapeData
  | CircleShapeData
  | EllipseShapeData
  | TextShapeData
  | ArrowShapeData

export type ShapeType = ShapeData['type']

export interface CanvasObjectDto {
  id: string
  type: string
  sequence: number
  data: ShapeData
}

export interface CanvasSummaryDto {
  id: string
  name: string
  createdAt: string
  activeUsers: number
}

export interface CreateCanvasRequest {
  name: string
}

export interface PresenceInfo {
  userId: string
  displayName: string
  color: string
  cursorX?: number | null
  cursorY?: number | null
}

export interface ObjectUpdateEntry {
  id: string
  data: ShapeData
}

// --- Client -> Server ---

export type ClientMessage =
  | { type: 'cursor-move'; x: number; y: number }
  | { type: 'draw-preview'; shapeType: ShapeType; data: ShapeData }
  | { type: 'object-create'; shapeType: ShapeType; data: ShapeData }
  | { type: 'object-update'; objects: ObjectUpdateEntry[] }
  | { type: 'object-delete'; ids: string[] }

// --- Server -> Client ---

export type ServerMessage =
  | {
      type: 'initial-state'
      selfUserId: string
      selfColor: string
      objects: CanvasObjectDto[]
      users: PresenceInfo[]
    }
  | { type: 'user-joined'; userId: string; displayName: string; color: string }
  | { type: 'user-left'; userId: string }
  | { type: 'presence-update'; userId: string; x: number; y: number }
  | { type: 'draw-preview-relay'; userId: string; shapeType: ShapeType; data: ShapeData }
  | { type: 'object-created'; obj: CanvasObjectDto }
  | { type: 'object-updated'; objects: CanvasObjectDto[] }
  | { type: 'object-deleted'; ids: string[] }
