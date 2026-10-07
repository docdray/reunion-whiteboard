import { describe, expect, it } from 'vitest'
import { boundsFromRect, boundsIntersect, containsPoint, paddedBoundsForSelection, shapeBounds, translateShapeData } from './shapeBounds'
import type {
  ArrowShapeData,
  CircleShapeData,
  EllipseShapeData,
  FreehandShapeData,
  LineShapeData,
  RectShapeData,
  StickyNoteShapeData,
  TextShapeData,
} from '../protocol/messages'

describe('shapeBounds', () => {
  it('berechnet Bounds für freehand über alle Punkte', () => {
    const data: FreehandShapeData = {
      type: 'freehand',
      color: '#000',
      strokeWidth: 1,
      points: [
        { x: 5, y: 10 },
        { x: -2, y: 20 },
        { x: 8, y: 3 },
      ],
    }
    expect(shapeBounds(data)).toEqual({ minX: -2, minY: 3, maxX: 8, maxY: 20 })
  })

  it('berechnet Bounds für line unabhängig von der Zugrichtung', () => {
    const data: LineShapeData = { type: 'line', color: '#000', strokeWidth: 1, x1: 10, y1: 10, x2: 2, y2: 30 }
    expect(shapeBounds(data)).toEqual({ minX: 2, minY: 10, maxX: 10, maxY: 30 })
  })

  it('berechnet Bounds für rect', () => {
    const data: RectShapeData = { type: 'rect', color: '#000', strokeWidth: 1, filled: false, x: 5, y: 5, width: 10, height: 20 }
    expect(shapeBounds(data)).toEqual({ minX: 5, minY: 5, maxX: 15, maxY: 25 })
  })

  it('berechnet Bounds für circle als Mittelpunkt ± radius', () => {
    const data: CircleShapeData = { type: 'circle', color: '#000', strokeWidth: 1, filled: false, x: 0, y: 0, radius: 5 }
    expect(shapeBounds(data)).toEqual({ minX: -5, minY: -5, maxX: 5, maxY: 5 })
  })

  it('berechnet Bounds für ellipse als Mittelpunkt ± radiusX/radiusY', () => {
    const data: EllipseShapeData = {
      type: 'ellipse',
      color: '#000',
      strokeWidth: 1,
      filled: false,
      x: 10,
      y: 10,
      radiusX: 4,
      radiusY: 2,
    }
    expect(shapeBounds(data)).toEqual({ minX: 6, minY: 8, maxX: 14, maxY: 12 })
  })

  it('berechnet eine Näherungs-Bounds für text abhängig von Zeicheninhalt und fontSize', () => {
    const data: TextShapeData = {
      type: 'text',
      color: '#000',
      x: 0,
      y: 0,
      content: 'hallo',
      fontFamily: 'sans-serif',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    }
    const bounds = shapeBounds(data)
    expect(bounds.minX).toBe(0)
    expect(bounds.minY).toBe(0)
    expect(bounds.maxX).toBeGreaterThan(0)
    expect(bounds.maxY).toBeGreaterThan(0)
  })

  it('berechnet Bounds für arrow unabhängig von der Zugrichtung', () => {
    const data: ArrowShapeData = {
      type: 'arrow',
      color: '#000',
      strokeWidth: 1,
      filled: true,
      x1: 10,
      y1: 10,
      x2: 2,
      y2: 30,
      doubleHeaded: false,
    }
    expect(shapeBounds(data)).toEqual({ minX: 2, minY: 10, maxX: 10, maxY: 30 })
  })

  it('berechnet Bounds für sticky-note wie bei rect', () => {
    const data: StickyNoteShapeData = {
      type: 'sticky-note',
      color: '#fff59d',
      x: 5,
      y: 5,
      width: 160,
      height: 120,
      content: 'Notiz',
      fontFamily: 'sans-serif',
      fontSize: 14,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    }
    expect(shapeBounds(data)).toEqual({ minX: 5, minY: 5, maxX: 165, maxY: 125 })
  })
})

describe('boundsIntersect', () => {
  it('erkennt überlappende Bounds', () => {
    expect(boundsIntersect({ minX: 0, minY: 0, maxX: 10, maxY: 10 }, { minX: 5, minY: 5, maxX: 15, maxY: 15 })).toBe(true)
  })

  it('erkennt nicht überlappende Bounds', () => {
    expect(boundsIntersect({ minX: 0, minY: 0, maxX: 10, maxY: 10 }, { minX: 20, minY: 20, maxX: 30, maxY: 30 })).toBe(
      false,
    )
  })

  it('berührende Kanten gelten als Überlappung', () => {
    expect(boundsIntersect({ minX: 0, minY: 0, maxX: 10, maxY: 10 }, { minX: 10, minY: 10, maxX: 20, maxY: 20 })).toBe(
      true,
    )
  })
})

describe('paddedBoundsForSelection', () => {
  it('erweitert die Bounding-Box um den Standard-Rand (6)', () => {
    const data: RectShapeData = { type: 'rect', color: '#000', strokeWidth: 1, filled: false, x: 5, y: 5, width: 10, height: 20 }
    expect(paddedBoundsForSelection(data)).toEqual({ minX: -1, minY: -1, maxX: 21, maxY: 31 })
  })

  it('erlaubt einen eigenen Rand-Wert', () => {
    const data: RectShapeData = { type: 'rect', color: '#000', strokeWidth: 1, filled: false, x: 0, y: 0, width: 10, height: 10 }
    expect(paddedBoundsForSelection(data, 2)).toEqual({ minX: -2, minY: -2, maxX: 12, maxY: 12 })
  })

  it('funktioniert auch bei einer Bounding-Box ohne Ausdehnung (z.B. eine vertikale line)', () => {
    const data: LineShapeData = { type: 'line', color: '#000', strokeWidth: 1, x1: 5, y1: 0, x2: 5, y2: 10 }
    expect(paddedBoundsForSelection(data, 3)).toEqual({ minX: 2, minY: -3, maxX: 8, maxY: 13 })
  })
})

describe('boundsFromRect', () => {
  it('wandelt ein Rechteck in Bounds um', () => {
    expect(boundsFromRect({ x: 1, y: 2, width: 3, height: 4 })).toEqual({ minX: 1, minY: 2, maxX: 4, maxY: 6 })
  })
})

describe('containsPoint', () => {
  it('erkennt Punkte innerhalb und außerhalb', () => {
    const bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 }
    expect(containsPoint(bounds, { x: 5, y: 5 })).toBe(true)
    expect(containsPoint(bounds, { x: 15, y: 5 })).toBe(false)
  })
})

describe('translateShapeData', () => {
  it('verschiebt alle Punkte einer freehand-Form', () => {
    const data: FreehandShapeData = {
      type: 'freehand',
      color: '#000',
      strokeWidth: 1,
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
    }
    const moved = translateShapeData(data, 5, -3) as FreehandShapeData
    expect(moved.points).toEqual([
      { x: 5, y: -3 },
      { x: 6, y: -2 },
    ])
  })

  it('verschiebt beide Endpunkte einer line', () => {
    const data: LineShapeData = { type: 'line', color: '#000', strokeWidth: 1, x1: 0, y1: 0, x2: 10, y2: 10 }
    const moved = translateShapeData(data, 2, 3) as LineShapeData
    expect(moved).toMatchObject({ x1: 2, y1: 3, x2: 12, y2: 13 })
  })

  it('verschiebt beide Endpunkte eines arrow', () => {
    const data: ArrowShapeData = {
      type: 'arrow',
      color: '#000',
      strokeWidth: 1,
      filled: true,
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 10,
      doubleHeaded: true,
    }
    const moved = translateShapeData(data, 2, 3) as ArrowShapeData
    expect(moved).toMatchObject({ x1: 2, y1: 3, x2: 12, y2: 13, doubleHeaded: true })
  })

  it('verschiebt x/y bei rect/circle/ellipse/text, andere Felder bleiben unverändert', () => {
    const rect: RectShapeData = { type: 'rect', color: '#f00', strokeWidth: 2, filled: true, x: 1, y: 1, width: 9, height: 9 }
    const moved = translateShapeData(rect, 4, 4) as RectShapeData
    expect(moved).toMatchObject({ x: 5, y: 5, width: 9, height: 9, filled: true, color: '#f00' })
  })

  it('verschiebt x/y bei sticky-note, Inhalt/Größe bleiben unverändert', () => {
    const note: StickyNoteShapeData = {
      type: 'sticky-note',
      color: '#fff59d',
      x: 1,
      y: 1,
      width: 160,
      height: 120,
      content: 'Notiz',
      fontFamily: 'sans-serif',
      fontSize: 14,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    }
    const moved = translateShapeData(note, 4, 4) as StickyNoteShapeData
    expect(moved).toMatchObject({ x: 5, y: 5, width: 160, height: 120, content: 'Notiz' })
  })
})
