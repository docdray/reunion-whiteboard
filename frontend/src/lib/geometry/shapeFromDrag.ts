import type {
  ArrowShapeData,
  CircleShapeData,
  EllipseShapeData,
  FreehandShapeData,
  LineShapeData,
  PointDto,
  RectShapeData,
  ShapeData,
  ShapeType,
  StickyNoteShapeData,
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
  doubleHeaded: boolean
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

export function arrowFromDrag(geometry: DragGeometry, settings: DrawSettings): ArrowShapeData {
  return {
    type: 'arrow',
    color: settings.color,
    strokeWidth: settings.strokeWidth,
    filled: settings.filled,
    x1: geometry.start.x,
    y1: geometry.start.y,
    x2: geometry.end.x,
    y2: geometry.end.y,
    doubleHeaded: settings.doubleHeaded,
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

export interface RectArea {
  x: number
  y: number
  width: number
  height: number
}

const STICKY_NOTE_DEFAULT_WIDTH = 160
const STICKY_NOTE_DEFAULT_HEIGHT = 120
/** Unterhalb dieser Ziehdistanz (Weltkoordinaten) gilt die Geste als Klick statt als Ziehen. */
const STICKY_NOTE_CLICK_THRESHOLD = 4

/** Rechteck-Fläche aus dem Drag wie bei `rect`; bei einem reinen Klick (kaum Bewegung) eine feste Standardgröße, verankert am Klickpunkt als obere linke Ecke. */
export function stickyNoteAreaFromDrag(geometry: DragGeometry): RectArea {
  if (distance(geometry.start, geometry.end) < STICKY_NOTE_CLICK_THRESHOLD) {
    return { x: geometry.start.x, y: geometry.start.y, width: STICKY_NOTE_DEFAULT_WIDTH, height: STICKY_NOTE_DEFAULT_HEIGHT }
  }
  const x = Math.min(geometry.start.x, geometry.end.x)
  const y = Math.min(geometry.start.y, geometry.end.y)
  return { x, y, width: Math.abs(geometry.end.x - geometry.start.x), height: Math.abs(geometry.end.y - geometry.start.y) }
}

/** Baut die finalen ShapeData erst NACH der Textabfrage (window.prompt) auf, analog zu textFromClick. */
export function stickyNoteFromArea(area: RectArea, content: string, settings: DrawSettings): StickyNoteShapeData {
  return {
    type: 'sticky-note',
    color: settings.color,
    x: area.x,
    y: area.y,
    width: area.width,
    height: area.height,
    content,
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    bold: settings.bold,
    italic: settings.italic,
    underline: settings.underline,
    strikethrough: settings.strikethrough,
  }
}

/** Dispatch für alle Drag-basierten Werkzeuge (alles außer 'text', das keinen Drag braucht). 'sticky-note' liefert hier nur eine Live-Vorschau mit leerem Inhalt — der echte Inhalt kommt erst bei pointerUp per Prompt (siehe drawMode.ts). */
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
    case 'arrow':
      return arrowFromDrag(geometry, settings)
    case 'sticky-note':
      return stickyNoteFromArea(stickyNoteAreaFromDrag(geometry), '', settings)
  }
}
