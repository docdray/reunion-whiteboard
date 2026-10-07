import { describe, expect, it, vi } from 'vitest'
import { handlePositionsFor, hitTestHandle, resizeShape, ResizeInteraction } from './resizeMode'
import type {
  ArrowShapeData,
  CanvasObjectDto,
  CircleShapeData,
  EllipseShapeData,
  FreehandShapeData,
  LineShapeData,
  RectShapeData,
  StickyNoteShapeData,
  TextShapeData,
} from '../protocol/messages'

const line: LineShapeData = { type: 'line', color: '#000', strokeWidth: 2, x1: 10, y1: 20, x2: 110, y2: 220 }
const arrow: ArrowShapeData = {
  type: 'arrow',
  color: '#000',
  strokeWidth: 2,
  filled: true,
  x1: 0,
  y1: 0,
  x2: 100,
  y2: 0,
  doubleHeaded: false,
}
const rect: RectShapeData = { type: 'rect', color: '#000', strokeWidth: 2, filled: false, x: 10, y: 10, width: 100, height: 50 }
const sticky: StickyNoteShapeData = {
  type: 'sticky-note',
  color: '#ff0',
  x: 0,
  y: 0,
  width: 160,
  height: 120,
  content: 'hi',
  fontFamily: 'Arial',
  fontSize: 16,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  textColor: '#111',
}
const circle: CircleShapeData = { type: 'circle', color: '#000', strokeWidth: 2, filled: false, x: 50, y: 50, radius: 20 }
const ellipse: EllipseShapeData = { type: 'ellipse', color: '#000', strokeWidth: 2, filled: false, x: 50, y: 50, radiusX: 30, radiusY: 15 }
const freehand: FreehandShapeData = { type: 'freehand', color: '#000', strokeWidth: 2, points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] }
const text: TextShapeData = {
  type: 'text',
  color: '#000',
  x: 5,
  y: 5,
  content: 'hi',
  fontFamily: 'Arial',
  fontSize: 16,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
}

describe('handlePositionsFor', () => {
  it('liefert start/end für line', () => {
    expect(handlePositionsFor(line)).toEqual([
      { id: 'start', x: 10, y: 20 },
      { id: 'end', x: 110, y: 220 },
    ])
  })

  it('liefert start/end für arrow', () => {
    expect(handlePositionsFor(arrow)).toEqual([
      { id: 'start', x: 0, y: 0 },
      { id: 'end', x: 100, y: 0 },
    ])
  })

  it('liefert vier Ecken für rect', () => {
    expect(handlePositionsFor(rect)).toEqual([
      { id: 'nw', x: 10, y: 10 },
      { id: 'ne', x: 110, y: 10 },
      { id: 'sw', x: 10, y: 60 },
      { id: 'se', x: 110, y: 60 },
    ])
  })

  it('liefert vier Ecken für sticky-note', () => {
    expect(handlePositionsFor(sticky)).toEqual([
      { id: 'nw', x: 0, y: 0 },
      { id: 'ne', x: 160, y: 0 },
      { id: 'sw', x: 0, y: 120 },
      { id: 'se', x: 160, y: 120 },
    ])
  })

  it('liefert vier Bounding-Box-Ecken für circle', () => {
    expect(handlePositionsFor(circle)).toEqual([
      { id: 'nw', x: 30, y: 30 },
      { id: 'ne', x: 70, y: 30 },
      { id: 'sw', x: 30, y: 70 },
      { id: 'se', x: 70, y: 70 },
    ])
  })

  it('liefert vier Bounding-Box-Ecken für ellipse', () => {
    expect(handlePositionsFor(ellipse)).toEqual([
      { id: 'nw', x: 20, y: 35 },
      { id: 'ne', x: 80, y: 35 },
      { id: 'sw', x: 20, y: 65 },
      { id: 'se', x: 80, y: 65 },
    ])
  })

  it('liefert leeres Array für freehand und text', () => {
    expect(handlePositionsFor(freehand)).toEqual([])
    expect(handlePositionsFor(text)).toEqual([])
  })
})

describe('hitTestHandle', () => {
  it('trifft einen Griff innerhalb der Toleranz', () => {
    expect(hitTestHandle({ x: 11, y: 21 }, line, 1)).toBe('start')
    expect(hitTestHandle({ x: 109, y: 219 }, line, 1)).toBe('end')
  })

  it('trifft keinen Griff außerhalb der Toleranz', () => {
    expect(hitTestHandle({ x: 50, y: 50 }, line, 1)).toBeNull()
  })

  it('Toleranz skaliert mit dem Zoom (kleinerer Weltradius bei hohem scale)', () => {
    // Bei scale=10 ist die Welt-Toleranz (0.9) zu klein für einen Versatz von 2, bei scale=1 (Toleranz 9) passt er.
    expect(hitTestHandle({ x: 12, y: 22 }, line, 10)).toBeNull()
    expect(hitTestHandle({ x: 12, y: 22 }, line, 1)).toBe('start')
  })

  it('liefert null für Typen ohne Griffe', () => {
    expect(hitTestHandle({ x: 0, y: 0 }, freehand, 1)).toBeNull()
    expect(hitTestHandle({ x: 5, y: 5 }, text, 1)).toBeNull()
  })

  it('wählt den nächstgelegenen Griff bei mehreren Treffern in Toleranz', () => {
    const tiny: RectShapeData = { type: 'rect', color: '#000', strokeWidth: 1, filled: false, x: 0, y: 0, width: 1, height: 1 }
    expect(hitTestHandle({ x: 0.4, y: 0.4 }, tiny, 1)).toBe('nw')
    expect(hitTestHandle({ x: 0.6, y: 0.6 }, tiny, 1)).toBe('se')
  })
})

describe('resizeShape', () => {
  it('verschiebt bei line nur den gezogenen Endpunkt', () => {
    expect(resizeShape(line, 'start', { x: 1, y: 2 })).toEqual({ ...line, x1: 1, y1: 2 })
    expect(resizeShape(line, 'end', { x: 9, y: 8 })).toEqual({ ...line, x2: 9, y2: 8 })
  })

  it('verschiebt bei arrow nur den gezogenen Endpunkt, Filled/DoubleHeaded bleiben unverändert', () => {
    const updated = resizeShape(arrow, 'end', { x: 50, y: 50 }) as ArrowShapeData
    expect(updated.x2).toBe(50)
    expect(updated.y2).toBe(50)
    expect(updated.x1).toBe(0)
    expect(updated.y1).toBe(0)
    expect(updated.filled).toBe(true)
    expect(updated.doubleHeaded).toBe(false)
  })

  it('rect: Ziehen der se-Ecke lässt nw fix', () => {
    const updated = resizeShape(rect, 'se', { x: 200, y: 150 }) as RectShapeData
    expect(updated).toMatchObject({ x: 10, y: 10, width: 190, height: 140 })
  })

  it('rect: Ziehen der nw-Ecke lässt se fix', () => {
    const updated = resizeShape(rect, 'nw', { x: 5, y: 5 }) as RectShapeData
    expect(updated).toMatchObject({ x: 5, y: 5, width: 105, height: 55 })
  })

  it('rect: Ziehen über die gegenüberliegende Ecke hinaus normalisiert (keine negative Breite/Höhe)', () => {
    const updated = resizeShape(rect, 'se', { x: 5, y: 5 }) as RectShapeData
    // se über die fixe nw-Ecke (10,10) hinaus auf (5,5) gezogen -> x/y tauschen, Größe bleibt positiv
    expect(updated.width).toBeGreaterThanOrEqual(0)
    expect(updated.height).toBeGreaterThanOrEqual(0)
    expect(updated).toMatchObject({ x: 5, y: 5, width: 5, height: 5 })
  })

  it('sticky-note: Resize wie rect, andere Felder unverändert', () => {
    const updated = resizeShape(sticky, 'se', { x: 200, y: 200 }) as StickyNoteShapeData
    expect(updated).toMatchObject({ x: 0, y: 0, width: 200, height: 200, content: 'hi', textColor: '#111' })
  })

  it('circle: Mittelpunkt bleibt fix, Radius = Distanz zum neuen Punkt', () => {
    const updated = resizeShape(circle, 'se', { x: 50 + 30, y: 50 + 40 }) as CircleShapeData
    expect(updated.x).toBe(50)
    expect(updated.y).toBe(50)
    expect(updated.radius).toBe(50) // 3-4-5 Dreieck skaliert *10
  })

  it('ellipse: Mittelpunkt bleibt fix, radiusX/radiusY aus Differenz', () => {
    // Mittelpunkt ist (50,50); neuer Punkt (90,25) -> radiusX=|90-50|=40, radiusY=|25-50|=25.
    const updated = resizeShape(ellipse, 'ne', { x: 90, y: 25 }) as EllipseShapeData
    expect(updated.x).toBe(50)
    expect(updated.y).toBe(50)
    expect(updated.radiusX).toBe(40)
    expect(updated.radiusY).toBe(25)
  })

  it('freehand und text bleiben unverändert (keine Griffe unterstützt)', () => {
    expect(resizeShape(freehand, 'start', { x: 99, y: 99 })).toBe(freehand)
    expect(resizeShape(text, 'nw', { x: 99, y: 99 })).toBe(text)
  })
})

describe('ResizeInteraction', () => {
  function makeObjects(): CanvasObjectDto[] {
    return [{ id: 'r1', type: 'rect', sequence: 1, data: rect }]
  }

  it('pointerDown liefert false ohne Treffer oder bei Mehrfachselektion', () => {
    const onPreview = vi.fn()
    const interaction = new ResizeInteraction({
      getObjects: makeObjects,
      getSelectedIds: () => new Set(['r1', 'r2']),
      getScale: () => 1,
      onPreview,
      onPreviewClear: vi.fn(),
      onCommit: vi.fn(),
    })
    expect(interaction.pointerDown({ x: 10, y: 10 })).toBe(false)
    expect(interaction.isActive).toBe(false)
  })

  it('pointerDown auf einem Griff startet den Resize und ruft bei Move/Up die Callbacks', () => {
    const onPreview = vi.fn()
    const onPreviewClear = vi.fn()
    const onCommit = vi.fn()
    const interaction = new ResizeInteraction({
      getObjects: makeObjects,
      getSelectedIds: () => new Set(['r1']),
      getScale: () => 1,
      onPreview,
      onPreviewClear,
      onCommit,
    })
    expect(interaction.pointerDown({ x: 110, y: 60 })).toBe(true) // 'se'
    expect(interaction.isActive).toBe(true)

    interaction.pointerMove({ x: 200, y: 150 })
    expect(onPreview).toHaveBeenCalledWith('r1', expect.objectContaining({ x: 10, y: 10, width: 190, height: 140 }))

    interaction.pointerUp({ x: 200, y: 150 })
    expect(onCommit).toHaveBeenCalledWith('r1', expect.objectContaining({ x: 10, y: 10, width: 190, height: 140 }))
    expect(onPreviewClear).toHaveBeenCalled()
    expect(interaction.isActive).toBe(false)
  })

  it('hoveredHandle liefert die Griff-ID ohne einen Drag zu starten', () => {
    const interaction = new ResizeInteraction({
      getObjects: makeObjects,
      getSelectedIds: () => new Set(['r1']),
      getScale: () => 1,
      onPreview: vi.fn(),
      onPreviewClear: vi.fn(),
      onCommit: vi.fn(),
    })
    expect(interaction.hoveredHandle({ x: 10, y: 10 })).toBe('nw')
    expect(interaction.hoveredHandle({ x: 500, y: 500 })).toBeNull()
    expect(interaction.isActive).toBe(false)
  })

  it('cancel bricht einen aktiven Resize ab und ruft onPreviewClear', () => {
    const onPreviewClear = vi.fn()
    const interaction = new ResizeInteraction({
      getObjects: makeObjects,
      getSelectedIds: () => new Set(['r1']),
      getScale: () => 1,
      onPreview: vi.fn(),
      onPreviewClear,
      onCommit: vi.fn(),
    })
    interaction.pointerDown({ x: 10, y: 10 })
    interaction.cancel()
    expect(onPreviewClear).toHaveBeenCalled()
    expect(interaction.isActive).toBe(false)
  })
})
