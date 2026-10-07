import type { CanvasObjectDto, ObjectUpdateEntry, PointDto } from '../protocol/messages'
import { boundsFromRect, boundsIntersect, distance, hitsShapeAt, shapeBounds, translateShapeData } from '../geometry/shapeBounds'

export interface MarqueeRect {
  x: number
  y: number
  width: number
  height: number
}

export interface SelectInteractionCallbacks {
  getObjects: () => CanvasObjectDto[]
  getSelectedIds: () => ReadonlySet<string>
  select: (ids: string[], additive: boolean) => void
  onMovePreview: (deltaX: number, deltaY: number) => void
  onMovePreviewClear: () => void
  onMoveCommit: (updates: ObjectUpdateEntry[]) => void
  onMarqueeChange: (rect: MarqueeRect | null) => void
}

/** Unterhalb dieser Distanz (Weltkoordinaten) gilt eine Geste als Klick statt als Ziehen. */
const DRAG_THRESHOLD = 2

type DragState =
  | { kind: 'none' }
  | { kind: 'marquee'; start: PointDto; additive: boolean }
  | { kind: 'move'; start: PointDto; snapshot: CanvasObjectDto[] }

/** Liefert das oberste (zuletzt erzeugte) Objekt unter `point`, oder `null`. Von Klick-Selektion und Doppelklick-Textbearbeitung geteilt. */
export function hitTest(objects: CanvasObjectDto[], point: PointDto): CanvasObjectDto | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]
    if (hitsShapeAt(obj.data, point)) return obj
  }
  return null
}

function normalizeRect(a: PointDto, b: PointDto): MarqueeRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  }
}

/**
 * Konva- und WebSocket-unabhängige Zustandsmaschine für den Markieren-Modus.
 * Nimmt Weltkoordinaten entgegen, ruft Callbacks für Selektion/Verschiebung/Marquee auf.
 */
export class SelectInteraction {
  private state: DragState = { kind: 'none' }

  constructor(private readonly callbacks: SelectInteractionCallbacks) {}

  pointerDown(point: PointDto, additive: boolean): void {
    const objects = this.callbacks.getObjects()
    const hit = hitTest(objects, point)

    if (hit) {
      const currentlySelected = this.callbacks.getSelectedIds()
      if (additive) {
        this.callbacks.select([hit.id], true)
      } else if (!currentlySelected.has(hit.id)) {
        this.callbacks.select([hit.id], false)
      }
      const selectionAfter = this.callbacks.getSelectedIds()
      const snapshot = objects.filter((o) => selectionAfter.has(o.id))
      this.state = { kind: 'move', start: point, snapshot }
      return
    }

    this.state = { kind: 'marquee', start: point, additive }
    this.callbacks.onMarqueeChange({ x: point.x, y: point.y, width: 0, height: 0 })
  }

  pointerMove(point: PointDto): void {
    if (this.state.kind === 'marquee') {
      this.callbacks.onMarqueeChange(normalizeRect(this.state.start, point))
      return
    }
    if (this.state.kind === 'move') {
      const dx = point.x - this.state.start.x
      const dy = point.y - this.state.start.y
      this.callbacks.onMovePreview(dx, dy)
      return
    }
  }

  pointerUp(point: PointDto): void {
    if (this.state.kind === 'marquee') {
      const dragged = distance(this.state.start, point) > DRAG_THRESHOLD
      if (dragged) {
        const rect = normalizeRect(this.state.start, point)
        const rectBounds = boundsFromRect(rect)
        const objects = this.callbacks.getObjects()
        const hits = objects.filter((o) => boundsIntersect(shapeBounds(o.data), rectBounds))
        this.callbacks.select(hits.map((o) => o.id), this.state.additive)
      } else {
        this.callbacks.select([], false)
      }
      this.callbacks.onMarqueeChange(null)
      this.reset()
      return
    }

    if (this.state.kind === 'move') {
      const dragged = distance(this.state.start, point) > DRAG_THRESHOLD
      if (dragged && this.state.snapshot.length > 0) {
        const dx = point.x - this.state.start.x
        const dy = point.y - this.state.start.y
        // Basis für den finalen Commit ist der AKTUELLE Objekt-Stand (nicht der beim
        // pointerDown erfasste `snapshot`), damit nicht-geometrische Felder (Farbe,
        // Strichstärke, ...), die währenddessen von anderen Nutzern geändert wurden,
        // nicht überschrieben werden. Der Snapshot bestimmt nur WELCHE Objekte bewegt wurden.
        const movingIds = new Set(this.state.snapshot.map((o) => o.id))
        const current = this.callbacks.getObjects().filter((o) => movingIds.has(o.id))
        const updates: ObjectUpdateEntry[] = current.map((o) => ({
          id: o.id,
          data: translateShapeData(o.data, dx, dy),
        }))
        if (updates.length > 0) this.callbacks.onMoveCommit(updates)
      }
      this.callbacks.onMovePreviewClear()
      this.reset()
      return
    }
  }

  cancel(): void {
    if (this.state.kind === 'marquee') this.callbacks.onMarqueeChange(null)
    if (this.state.kind === 'move') this.callbacks.onMovePreviewClear()
    this.reset()
  }

  private reset(): void {
    this.state = { kind: 'none' }
  }
}
