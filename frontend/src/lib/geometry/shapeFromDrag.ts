import type {
  CircleShapeData,
  EllipseShapeData,
  FreehandShapeData,
  LineShapeData,
  PointDto,
  RectShapeData,
  ShapeData,
  ShapeType,
  TextShapeData,
} from '../protocol/messages'

export interface DrawSettings {
  color: string
  strokeWidth: number
  filled: boolean
  fontFamily: string
  fontSize: number
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
}

export interface DragGeometry {
  start: PointDto
  end: PointDto
  /** All points collected during the drag, used for freehand. Falls back to [start, end] if omitted. */
  points?: PointDto[]
}

function distance(a: PointDto, b: PointDto): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function freehandFromDrag(geometry: DragGeometry, settings: DrawSettings): FreehandShapeData {
  return {
    type: 'freehand',
    color: settings.color,
    strokeWidth: settings.strokeWidth,
    points: geometry.points && geometry.points.length > 0 ? geometry.points : [geometry.start, geometry.end],
  }
}

export function lineFromDrag(geometry: DragGeometry, settings: DrawSettings): LineShapeData {
  return {
    type: 'line',
    color: settings.color,
    strokeWidth: settings.strokeWidth,
    x1: geometry.start.x,
    y1: geometry.start.y,
    x2: geometry.end.x,
    y2: geometry.end.y,
  }
}

export function rectFromDrag(geometry: DragGeometry, settings: DrawSettings): RectShapeData {
  const x = Math.min(geometry.start.x, geometry.end.x)
  const y = Math.min(geometry.start.y, geometry.end.y)
  const width = Math.abs(geometry.end.x - geometry.start.x)
  const height = Math.abs(geometry.end.y - geometry.start.y)
  return {
    type: 'rect',
    color: settings.color,
    strokeWidth: settings.strokeWidth,
    filled: settings.filled,
    x,
    y,
    width,
    height,
  }
}

/** Mittelpunkt = Startpunkt, radius = Distanz Start->Ende (Ziehen von der Mitte nach außen). */
export function circleFromDrag(geometry: DragGeometry, settings: DrawSettings): CircleShapeData {
  return {
    type: 'circle',
    color: settings.color,
    strokeWidth: settings.strokeWidth,
    filled: settings.filled,
    x: geometry.start.x,
    y: geometry.start.y,
    radius: distance(geometry.start, geometry.end),
  }
}

export function ellipseFromDrag(geometry: DragGeometry, settings: DrawSettings): EllipseShapeData {
  return {
    type: 'ellipse',
    color: settings.color,
    strokeWidth: settings.strokeWidth,
    filled: settings.filled,
    x: geometry.start.x,
    y: geometry.start.y,
    radiusX: Math.abs(geometry.end.x - geometry.start.x),
    radiusY: Math.abs(geometry.end.y - geometry.start.y),
  }
}

export function textFromClick(point: PointDto, content: string, settings: DrawSettings): TextShapeData {
  return {
    type: 'text',
    color: settings.color,
    x: point.x,
    y: point.y,
    content,
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    bold: settings.bold,
    italic: settings.italic,
    underline: settings.underline,
    strikethrough: settings.strikethrough,
  }
}

/** Dispatch für alle Drag-basierten Werkzeuge (alles außer 'text', das keinen Drag braucht). */
export function shapeDataFromDrag(
  tool: Exclude<ShapeType, 'text'>,
  geometry: DragGeometry,
  settings: DrawSettings,
): ShapeData {
  switch (tool) {
    case 'freehand':
      return freehandFromDrag(geometry, settings)
    case 'line':
      return lineFromDrag(geometry, settings)
    case 'rect':
      return rectFromDrag(geometry, settings)
    case 'circle':
      return circleFromDrag(geometry, settings)
    case 'ellipse':
      return ellipseFromDrag(geometry, settings)
  }
}
