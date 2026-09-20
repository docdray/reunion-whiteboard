import { describe, expect, it } from 'vitest'
import {
  arrowFromDrag,
  circleFromDrag,
  type DrawSettings,
  ellipseFromDrag,
  freehandFromDrag,
  lineFromDrag,
  rectFromDrag,
  shapeDataFromDrag,
  textFromClick,
} from './shapeFromDrag'

const settings: DrawSettings = {
  color: '#123456',
  strokeWidth: 3,
  filled: true,
  fontFamily: 'serif',
  fontSize: 18,
  bold: true,
  italic: false,
  underline: true,
  strikethrough: false,
  doubleHeaded: false,
}

describe('shapeFromDrag', () => {
  it('builds a freehand shape from all collected points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      { x: 10, y: 2 },
    ]
    const shape = freehandFromDrag({ start: points[0], end: points[points.length - 1], points }, settings)
    expect(shape).toMatchObject({
      type: 'freehand',
      color: settings.color,
      strokeWidth: settings.strokeWidth,
      points,
    })
  })

  it('freehand falls back to [start, end] when no points were collected', () => {
    const shape = freehandFromDrag({ start: { x: 0, y: 0 }, end: { x: 4, y: 4 } }, settings)
    expect(shape.points).toEqual([
      { x: 0, y: 0 },
      { x: 4, y: 4 },
    ])
  })

  it('builds a line from start to end', () => {
    const shape = lineFromDrag({ start: { x: 1, y: 2 }, end: { x: 3, y: 4 } }, settings)
    expect(shape).toMatchObject({ type: 'line', x1: 1, y1: 2, x2: 3, y2: 4 })
  })

  it('normalizes a rect dragged to the bottom right', () => {
    const shape = rectFromDrag({ start: { x: 0, y: 0 }, end: { x: 10, y: 20 } }, settings)
    expect(shape).toMatchObject({ type: 'rect', x: 0, y: 0, width: 10, height: 20, filled: true })
  })

  it('normalizes a rect dragged to the top left without negative width/height', () => {
    const shape = rectFromDrag({ start: { x: 10, y: 20 }, end: { x: 0, y: 0 } }, settings)
    expect(shape).toMatchObject({ x: 0, y: 0, width: 10, height: 20 })
  })

  it('builds a zero-size rect for a click without movement', () => {
    const shape = rectFromDrag({ start: { x: 5, y: 5 }, end: { x: 5, y: 5 } }, settings)
    expect(shape).toMatchObject({ x: 5, y: 5, width: 0, height: 0 })
  })

  it('builds a circle centered at start with radius as distance to end', () => {
    const shape = circleFromDrag({ start: { x: 0, y: 0 }, end: { x: 3, y: 4 } }, settings)
    expect(shape).toMatchObject({ type: 'circle', x: 0, y: 0, radius: 5 })
  })

  it('builds an ellipse with radii as absolute deltas regardless of drag direction', () => {
    const shape = ellipseFromDrag({ start: { x: 5, y: 5 }, end: { x: 0, y: 15 } }, settings)
    expect(shape).toMatchObject({ type: 'ellipse', x: 5, y: 5, radiusX: 5, radiusY: 10 })
  })

  it('builds a text shape from the click point, content and text settings', () => {
    const shape = textFromClick({ x: 7, y: 8 }, 'Hallo', settings)
    expect(shape).toMatchObject({
      type: 'text',
      x: 7,
      y: 8,
      content: 'Hallo',
      fontFamily: 'serif',
      fontSize: 18,
      bold: true,
      italic: false,
      underline: true,
      strikethrough: false,
    })
  })

  it('dispatches to the correct builder via shapeDataFromDrag', () => {
    const geometry = { start: { x: 0, y: 0 }, end: { x: 2, y: 2 } }
    expect(shapeDataFromDrag('rect', geometry, settings).type).toBe('rect')
    expect(shapeDataFromDrag('circle', geometry, settings).type).toBe('circle')
    expect(shapeDataFromDrag('ellipse', geometry, settings).type).toBe('ellipse')
    expect(shapeDataFromDrag('line', geometry, settings).type).toBe('line')
    expect(shapeDataFromDrag('freehand', geometry, settings).type).toBe('freehand')
    expect(shapeDataFromDrag('arrow', geometry, settings).type).toBe('arrow')
  })

  it('builds an arrow from start to end, carrying filled and doubleHeaded from settings', () => {
    const shape = arrowFromDrag(
      { start: { x: 1, y: 2 }, end: { x: 3, y: 4 } },
      { ...settings, filled: false, doubleHeaded: true },
    )
    expect(shape).toMatchObject({
      type: 'arrow',
      x1: 1,
      y1: 2,
      x2: 3,
      y2: 4,
      filled: false,
      doubleHeaded: true,
    })
  })
})
