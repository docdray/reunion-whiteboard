import type { CanvasObjectDto, PointDto } from '../protocol/messages'
import { boundsFromRect, boundsIntersect, shapeBounds } from '../geometry/shapeBounds'

export interface EraserInteractionCallbacks {
  getObjects: () => CanvasObjectDto[]
  getRadius: () => number
  onErase: (ids: string[]) => void
}

/** Toleranzradius um den Cursor, damit auch dünne Striche zuverlässig getroffen werden. */
export function eraserRadius(strokeWidth: number): number {
  return Math.max(8, strokeWidth * 4)
}

/**
 * Konva- und WebSocket-unabhängige Zustandsmaschine für den Radierer.
 * Löscht während des Ziehens sofort jedes getroffene Objekt (Echtzeit-Radieren);
 * ein Objekt wird pro Zug höchstens einmal gemeldet.
 */
export class EraserInteraction {
  private erasing = false
  private erasedInStroke = new Set<string>()

  constructor(private readonly callbacks: EraserInteractionCallbacks) {}

  get isErasing(): boolean {
    return this.erasing
  }

  pointerDown(point: PointDto): void {
    this.erasing = true
    this.erasedInStroke = new Set()
    this.eraseAt(point)
  }

  pointerMove(point: PointDto): void {
    if (!this.erasing) return
    this.eraseAt(point)
  }

  pointerUp(): void {
    this.reset()
  }

  cancel(): void {
    this.reset()
  }

  private eraseAt(point: PointDto): void {
    const radius = this.callbacks.getRadius()
    const cursorBounds = boundsFromRect({
      x: point.x - radius,
      y: point.y - radius,
      width: radius * 2,
      height: radius * 2,
    })
    const hits = this.callbacks
      .getObjects()
      .filter((o) => !this.erasedInStroke.has(o.id) && boundsIntersect(shapeBounds(o.data), cursorBounds))
    if (hits.length === 0) return
    for (const hit of hits) this.erasedInStroke.add(hit.id)
    this.callbacks.onErase(hits.map((o) => o.id))
  }

  private reset(): void {
    this.erasing = false
    this.erasedInStroke = new Set()
  }
}
