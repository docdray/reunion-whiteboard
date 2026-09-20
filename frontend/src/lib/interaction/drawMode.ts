import type { PointDto, ShapeData, ShapeType } from '../protocol/messages'
import {
  type DrawSettings,
  shapeDataFromDrag,
  stickyNoteAreaFromDrag,
  stickyNoteFromArea,
  textFromClick,
} from '../geometry/shapeFromDrag'

export interface DrawInteractionCallbacks {
  getSettings: () => DrawSettings
  onPreviewUpdate: (shapeType: ShapeType, data: ShapeData) => void
  onPreviewClear: () => void
  onCommit: (shapeType: ShapeType, data: ShapeData) => void
  /** Synchronously asks the user for text content (e.g. window.prompt); null/blank cancels. */
  requestTextContent: (point: PointDto) => string | null
}

/**
 * Konva- und WebSocket-unabhängige Zustandsmaschine für den Zeichnen-Modus.
 * Nimmt Weltkoordinaten entgegen, ruft Callbacks für Vorschau/Commit auf.
 */
export class DrawInteraction {
  private dragging = false
  private tool: ShapeType | null = null
  private start: PointDto | null = null
  private points: PointDto[] = []

  constructor(private readonly callbacks: DrawInteractionCallbacks) {}

  get isDragging(): boolean {
    return this.dragging
  }

  pointerDown(tool: ShapeType, point: PointDto): void {
    if (tool === 'text') {
      const content = this.callbacks.requestTextContent(point)
      if (content != null && content.trim().length > 0) {
        this.callbacks.onCommit('text', textFromClick(point, content, this.callbacks.getSettings()))
      }
      return
    }
    this.dragging = true
    this.tool = tool
    this.start = point
    this.points = [point]
  }

  pointerMove(point: PointDto): void {
    if (!this.dragging || !this.start || !this.tool) return
    this.points.push(point)
    const data = shapeDataFromDrag(
      this.tool as Exclude<ShapeType, 'text'>,
      { start: this.start, end: point, points: this.points },
      this.callbacks.getSettings(),
    )
    this.callbacks.onPreviewUpdate(this.tool, data)
  }

  pointerUp(point: PointDto): void {
    if (!this.dragging || !this.start || !this.tool) return
    this.points.push(point)
    const geometry = { start: this.start, end: point, points: this.points }

    if (this.tool === 'sticky-note') {
      const area = stickyNoteAreaFromDrag(geometry)
      const content = this.callbacks.requestTextContent(point)
      this.callbacks.onPreviewClear()
      if (content != null && content.trim().length > 0) {
        this.callbacks.onCommit('sticky-note', stickyNoteFromArea(area, content, this.callbacks.getSettings()))
      }
      this.reset()
      return
    }

    const data = shapeDataFromDrag(
      this.tool as Exclude<ShapeType, 'text' | 'sticky-note'>,
      geometry,
      this.callbacks.getSettings(),
    )
    this.callbacks.onCommit(this.tool, data)
    this.callbacks.onPreviewClear()
    this.reset()
  }

  cancel(): void {
    if (this.dragging) {
      this.callbacks.onPreviewClear()
    }
    this.reset()
  }

  private reset(): void {
    this.dragging = false
    this.tool = null
    this.start = null
    this.points = []
  }
}
