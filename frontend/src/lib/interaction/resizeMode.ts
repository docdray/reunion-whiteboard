import type { CanvasObjectDto, PointDto, ShapeData } from '../protocol/messages'
import { distance } from '../geometry/shapeBounds'

export interface HandlePosition {
  id: string
  x: number
  y: number
}

/** Visuelle Griff-Größe in Bildschirm-Pixeln (zoom-unabhängig, siehe stageAction.svelte.ts). */
export const HANDLE_SIZE_PX = 8
/** Zusätzlicher Toleranz-Rand fürs Treffen eines Griffs, in Bildschirm-Pixeln. */
const HANDLE_HIT_PADDING_PX = 5

/**
 * Liefert die Positionen der Anfasspunkte für einen Shape-Typ, oder ein leeres Array
 * wenn der Typ keine Griffe unterstützt (freehand, text).
 */
export function handlePositionsFor(data: ShapeData): HandlePosition[] {
  switch (data.type) {
    case 'line':
    case 'arrow':
      return [
        { id: 'start', x: data.x1, y: data.y1 },
        { id: 'end', x: data.x2, y: data.y2 },
      ]
    case 'rect':
    case 'sticky-note':
      return [
        { id: 'nw', x: data.x, y: data.y },
        { id: 'ne', x: data.x + data.width, y: data.y },
        { id: 'sw', x: data.x, y: data.y + data.height },
        { id: 'se', x: data.x + data.width, y: data.y + data.height },
      ]
    case 'circle':
      return [
        { id: 'nw', x: data.x - data.radius, y: data.y - data.radius },
        { id: 'ne', x: data.x + data.radius, y: data.y - data.radius },
        { id: 'sw', x: data.x - data.radius, y: data.y + data.radius },
        { id: 'se', x: data.x + data.radius, y: data.y + data.radius },
      ]
    case 'ellipse':
      return [
        { id: 'nw', x: data.x - data.radiusX, y: data.y - data.radiusY },
        { id: 'ne', x: data.x + data.radiusX, y: data.y - data.radiusY },
        { id: 'sw', x: data.x - data.radiusX, y: data.y + data.radiusY },
        { id: 'se', x: data.x + data.radiusX, y: data.y + data.radiusY },
      ]
    case 'freehand':
    case 'text':
      return []
  }
}

/** Findet den unter `point` liegenden Griff (Weltkoordinaten), Toleranz unabhängig vom Zoom. */
export function hitTestHandle(point: PointDto, data: ShapeData, scale: number): string | null {
  const toleranceWorld = (HANDLE_SIZE_PX / 2 + HANDLE_HIT_PADDING_PX) / scale
  const handles = handlePositionsFor(data)
  let closestId: string | null = null
  let closestDistance = Infinity
  for (const h of handles) {
    if (Math.abs(point.x - h.x) > toleranceWorld || Math.abs(point.y - h.y) > toleranceWorld) continue
    const d = distance(point, h)
    if (d < closestDistance) {
      closestDistance = d
      closestId = h.id
    }
  }
  return closestId
}

interface RectCorners {
  x: number
  y: number
  width: number
  height: number
}

/** Ecke, die beim Ziehen von `handleId` FIX bleibt (gegenüberliegende Ecke). */
function fixedCornerFor(rect: RectCorners, handleId: string): PointDto {
  switch (handleId) {
    case 'nw':
      return { x: rect.x + rect.width, y: rect.y + rect.height }
    case 'ne':
      return { x: rect.x, y: rect.y + rect.height }
    case 'sw':
      return { x: rect.x + rect.width, y: rect.y }
    case 'se':
    default:
      return { x: rect.x, y: rect.y }
  }
}

function resizeRectLike(rect: RectCorners, handleId: string, newPoint: PointDto): RectCorners {
  const fixed = fixedCornerFor(rect, handleId)
  return {
    x: Math.min(fixed.x, newPoint.x),
    y: Math.min(fixed.y, newPoint.y),
    width: Math.abs(newPoint.x - fixed.x),
    height: Math.abs(newPoint.y - fixed.y),
  }
}

/** Berechnet die aktualisierte ShapeData für das Ziehen von `handleId` nach `newPoint` (Weltkoordinaten). */
export function resizeShape(data: ShapeData, handleId: string, newPoint: PointDto): ShapeData {
  switch (data.type) {
    case 'line':
    case 'arrow':
      if (handleId === 'start') return { ...data, x1: newPoint.x, y1: newPoint.y }
      if (handleId === 'end') return { ...data, x2: newPoint.x, y2: newPoint.y }
      return data
    case 'rect':
    case 'sticky-note': {
      const { x, y, width, height } = resizeRectLike(data, handleId, newPoint)
      return { ...data, x, y, width, height }
    }
    case 'circle':
      return { ...data, radius: distance({ x: data.x, y: data.y }, newPoint) }
    case 'ellipse':
      return {
        ...data,
        radiusX: Math.abs(newPoint.x - data.x),
        radiusY: Math.abs(newPoint.y - data.y),
      }
    case 'freehand':
    case 'text':
      return data
  }
}

export interface ResizeInteractionCallbacks {
  getObjects: () => CanvasObjectDto[]
  getSelectedIds: () => ReadonlySet<string>
  getScale: () => number
  onPreview: (id: string, data: ShapeData) => void
  onPreviewClear: () => void
  onCommit: (id: string, data: ShapeData) => void
}

interface ActiveResize {
  id: string
  handleId: string
  original: ShapeData
}

/**
 * Konva-/WebSocket-unabhängige Zustandsmaschine fürs Ziehen von Anfasspunkten.
 * Nur aktiv, wenn genau EIN Objekt selektiert ist.
 */
export class ResizeInteraction {
  private active: ActiveResize | null = null

  constructor(private readonly callbacks: ResizeInteractionCallbacks) {}

  private singleSelectedObject(): CanvasObjectDto | null {
    const ids = this.callbacks.getSelectedIds()
    if (ids.size !== 1) return null
    const [id] = ids
    return this.callbacks.getObjects().find((o) => o.id === id) ?? null
  }

  get isActive(): boolean {
    return this.active !== null
  }

  /** Prüft beim Pointer-Down ob ein Griff getroffen wurde; startet ggf. den Resize-Vorgang. Liefert true bei Treffer. */
  pointerDown(point: PointDto): boolean {
    const obj = this.singleSelectedObject()
    if (!obj) return false
    const handleId = hitTestHandle(point, obj.data, this.callbacks.getScale())
    if (!handleId) return false
    this.active = { id: obj.id, handleId, original: obj.data }
    return true
  }

  /** Liefert die ID des Griffs unter `point` für das aktuell einzeln selektierte Objekt, sonst `null`. Für Hover-Anzeige, nicht Teil eines aktiven Drags. */
  hoveredHandle(point: PointDto): string | null {
    const obj = this.singleSelectedObject()
    if (!obj) return null
    return hitTestHandle(point, obj.data, this.callbacks.getScale())
  }

  pointerMove(point: PointDto): void {
    if (!this.active) return
    const updated = resizeShape(this.active.original, this.active.handleId, point)
    this.callbacks.onPreview(this.active.id, updated)
  }

  pointerUp(point: PointDto): void {
    if (!this.active) return
    // Basis für den finalen Commit ist der AKTUELLE Objekt-Stand (nicht der beim pointerDown
    // erfasste `original`-Snapshot), damit nicht-geometrische Felder (Farbe, Strichstärke, ...),
    // die währenddessen von anderen Nutzern geändert wurden, nicht überschrieben werden.
    const current = this.callbacks.getObjects().find((o) => o.id === this.active!.id)
    if (current) {
      const updated = resizeShape(current.data, this.active.handleId, point)
      this.callbacks.onCommit(this.active.id, updated)
    }
    this.callbacks.onPreviewClear()
    this.active = null
  }

  cancel(): void {
    if (this.active) this.callbacks.onPreviewClear()
    this.active = null
  }
}
