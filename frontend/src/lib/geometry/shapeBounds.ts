import type { PointDto, ShapeData } from '../protocol/messages'

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface RectLike {
  x: number
  y: number
  width: number
  height: number
}

/** Grobe Näherung ohne echtes Canvas-Text-Measuring: durchschnittliche Zeichenbreite ≈ 0.6 * fontSize. */
const TEXT_CHAR_WIDTH_FACTOR = 0.6
const TEXT_LINE_HEIGHT_FACTOR = 1.2

export function shapeBounds(data: ShapeData): Bounds {
  switch (data.type) {
    case 'freehand': {
      const xs = data.points.map((p) => p.x)
      const ys = data.points.map((p) => p.y)
      return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
    }
    case 'line':
      return {
        minX: Math.min(data.x1, data.x2),
        minY: Math.min(data.y1, data.y2),
        maxX: Math.max(data.x1, data.x2),
        maxY: Math.max(data.y1, data.y2),
      }
    case 'rect':
      return { minX: data.x, minY: data.y, maxX: data.x + data.width, maxY: data.y + data.height }
    case 'circle':
      return {
        minX: data.x - data.radius,
        minY: data.y - data.radius,
        maxX: data.x + data.radius,
        maxY: data.y + data.radius,
      }
    case 'ellipse':
      return {
        minX: data.x - data.radiusX,
        minY: data.y - data.radiusY,
        maxX: data.x + data.radiusX,
        maxY: data.y + data.radiusY,
      }
    case 'text': {
      const width = Math.max(data.content.length, 1) * data.fontSize * TEXT_CHAR_WIDTH_FACTOR
      const height = data.fontSize * TEXT_LINE_HEIGHT_FACTOR
      return { minX: data.x, minY: data.y, maxX: data.x + width, maxY: data.y + height }
    }
    case 'arrow':
      return {
        minX: Math.min(data.x1, data.x2),
        minY: Math.min(data.y1, data.y2),
        maxX: Math.max(data.x1, data.x2),
        maxY: Math.max(data.y1, data.y2),
      }
    case 'sticky-note':
      return { minX: data.x, minY: data.y, maxX: data.x + data.width, maxY: data.y + data.height }
  }
}

export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
}

/** Vereinigt mehrere Bounding-Boxen zu einer Gesamt-Box; `null` bei leerer Liste. */
export function unionBounds(list: Bounds[]): Bounds | null {
  if (list.length === 0) return null
  return list.reduce((acc, b) => ({
    minX: Math.min(acc.minX, b.minX),
    minY: Math.min(acc.minY, b.minY),
    maxX: Math.max(acc.maxX, b.maxX),
    maxY: Math.max(acc.maxY, b.maxY),
  }))
}

export function boundsFromRect(rect: RectLike): Bounds {
  return { minX: rect.x, minY: rect.y, maxX: rect.x + rect.width, maxY: rect.y + rect.height }
}

/** Bounding-Box eines Objekts mit zusätzlichem Rand, für die Selektions-Hervorhebung. */
export function paddedBoundsForSelection(data: ShapeData, padding = 6): Bounds {
  const b = shapeBounds(data)
  return { minX: b.minX - padding, minY: b.minY - padding, maxX: b.maxX + padding, maxY: b.maxY + padding }
}

export function containsPoint(bounds: Bounds, point: PointDto): boolean {
  return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY
}

export function distance(a: PointDto, b: PointDto): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function pointToSegmentDistance(p: PointDto, a: PointDto, b: PointDto): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return distance(p, a)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared))
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy })
}

function distanceToPolyline(p: PointDto, points: PointDto[]): number {
  if (points.length === 0) return Infinity
  if (points.length === 1) return distance(p, points[0])
  let min = Infinity
  for (let i = 0; i < points.length - 1; i++) {
    const d = pointToSegmentDistance(p, points[i], points[i + 1])
    if (d < min) min = d
  }
  return min
}

/** Toleranz fürs Treffen dünner Formen, abgeleitet von der eigenen Strichstärke — analog zum Radierer-Toleranzradius (eraserMode.ts). */
function strokeHitTolerance(strokeWidth: number): number {
  return Math.max(4, strokeWidth * 2)
}

/**
 * Minimaler Abstand von `point` zum tatsächlichen Linienverlauf von `data`, oder `null`
 * wenn der Typ keine sinnvolle "Strich"-Geometrie hat (dann gilt die normale Bounding-Box-Prüfung).
 * Nur für die flächenlosen Typen freehand/line/arrow definiert.
 */
export function distanceToStrokeShape(data: ShapeData, point: PointDto): number | null {
  switch (data.type) {
    case 'line':
    case 'arrow':
      return pointToSegmentDistance(point, { x: data.x1, y: data.y1 }, { x: data.x2, y: data.y2 })
    case 'freehand':
      return distanceToPolyline(point, data.points)
    default:
      return null
  }
}

/**
 * Präzises Treffer-Testing für einen Punkt gegen ein Objekt: bei freehand/line/arrow wird der
 * tatsächliche Linienverlauf (mit kleiner, strichstärkenabhängiger Toleranz) geprüft statt nur
 * der (bei diagonalen Linien stark übergroßen) Bounding-Box; alle anderen Typen bleiben bei der
 * bisherigen, bewusst großzügigen Bounding-Box-Prüfung (auch bei ungefüllten Formen).
 */
export function hitsShapeAt(data: ShapeData, point: PointDto): boolean {
  const strokeDistance = distanceToStrokeShape(data, point)
  if (strokeDistance !== null) {
    const strokeWidth = data.type === 'freehand' || data.type === 'line' || data.type === 'arrow' ? data.strokeWidth : 0
    return strokeDistance <= strokeHitTolerance(strokeWidth)
  }
  return containsPoint(shapeBounds(data), point)
}

/** Verschiebt ShapeData um (dx, dy) in Weltkoordinaten; liefert eine neue Instanz desselben Typs. */
export function translateShapeData(data: ShapeData, dx: number, dy: number): ShapeData {
  switch (data.type) {
    case 'freehand':
      return { ...data, points: data.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
    case 'line':
    case 'arrow':
      return { ...data, x1: data.x1 + dx, y1: data.y1 + dy, x2: data.x2 + dx, y2: data.y2 + dy }
    case 'rect':
    case 'circle':
    case 'ellipse':
    case 'text':
    case 'sticky-note':
      return { ...data, x: data.x + dx, y: data.y + dy }
  }
}
