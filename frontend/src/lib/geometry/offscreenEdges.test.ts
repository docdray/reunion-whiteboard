import { describe, expect, it } from 'vitest'
import { offscreenEdges } from './offscreenEdges'

const viewport = { panX: 0, panY: 0, scale: 1 }
const box = (minX: number, minY: number, size = 10) => ({ minX, minY, maxX: minX + size, maxY: minY + size })

describe('offscreenEdges', () => {
  it('meldet keinen Rand, wenn alle Objekte sichtbar sind', () => {
    expect(offscreenEdges([box(10, 10), box(700, 500)], viewport, 800, 600)).toEqual({
      top: false,
      right: false,
      bottom: false,
      left: false,
    })
  })

  it('meldet den passenden Rand für Objekte oben, unten, links und rechts', () => {
    expect(offscreenEdges([box(100, -50)], viewport, 800, 600)).toMatchObject({ top: true, bottom: false })
    expect(offscreenEdges([box(100, 650)], viewport, 800, 600)).toMatchObject({ bottom: true, top: false })
    expect(offscreenEdges([box(-50, 100)], viewport, 800, 600)).toMatchObject({ left: true, right: false })
    expect(offscreenEdges([box(850, 100)], viewport, 800, 600)).toMatchObject({ right: true, left: false })
  })

  it('ignoriert teilweise sichtbare Objekte', () => {
    expect(offscreenEdges([box(-5, -5)], viewport, 800, 600)).toEqual({
      top: false,
      right: false,
      bottom: false,
      left: false,
    })
  })

  it('markiert bei schräg liegenden Objekten beide Ränder', () => {
    expect(offscreenEdges([box(-50, -50)], viewport, 800, 600)).toEqual({
      top: true,
      right: false,
      bottom: false,
      left: true,
    })
  })

  it('berücksichtigt Pan und Zoom', () => {
    // Bei scale=2 und Pan (-400,-300) ist der Weltausschnitt (200,150)–(600,450).
    const zoomed = { panX: -400, panY: -300, scale: 2 }
    expect(offscreenEdges([box(300, 300)], zoomed, 800, 600).left).toBe(false)
    expect(offscreenEdges([box(100, 300)], zoomed, 800, 600).left).toBe(true)
    expect(offscreenEdges([box(300, 500)], zoomed, 800, 600).bottom).toBe(true)
  })
})
