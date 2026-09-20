import { describe, expect, it } from 'vitest'
import { MAX_SCALE, MIN_SCALE, wheelScaleFactor, zoomToCursor } from './zoomToCursor'

describe('zoomToCursor', () => {
  it('keeps the world point under the cursor fixed on screen when zooming in', () => {
    const viewport = { panX: 0, panY: 0, scale: 1 }
    const cursor = { x: 100, y: 50 }
    const worldBefore = {
      x: (cursor.x - viewport.panX) / viewport.scale,
      y: (cursor.y - viewport.panY) / viewport.scale,
    }

    const next = zoomToCursor(viewport, cursor, 1.5)

    const worldAfter = {
      x: (cursor.x - next.panX) / next.scale,
      y: (cursor.y - next.panY) / next.scale,
    }
    expect(worldAfter.x).toBeCloseTo(worldBefore.x)
    expect(worldAfter.y).toBeCloseTo(worldBefore.y)
    expect(next.scale).toBeCloseTo(1.5)
  })

  it('keeps the world point under the cursor fixed on screen when zooming out', () => {
    const viewport = { panX: 20, panY: -10, scale: 2 }
    const cursor = { x: 300, y: 200 }

    const next = zoomToCursor(viewport, cursor, 0.5)

    const worldBefore = { x: (cursor.x - viewport.panX) / viewport.scale, y: (cursor.y - viewport.panY) / viewport.scale }
    const worldAfter = { x: (cursor.x - next.panX) / next.scale, y: (cursor.y - next.panY) / next.scale }
    expect(worldAfter.x).toBeCloseTo(worldBefore.x)
    expect(worldAfter.y).toBeCloseTo(worldBefore.y)
    expect(next.scale).toBeCloseTo(1)
  })

  it('clamps zooming in at MAX_SCALE', () => {
    const viewport = { panX: 0, panY: 0, scale: MAX_SCALE }
    const next = zoomToCursor(viewport, { x: 0, y: 0 }, 2)
    expect(next.scale).toBe(MAX_SCALE)
  })

  it('clamps zooming out at MIN_SCALE', () => {
    const viewport = { panX: 0, panY: 0, scale: MIN_SCALE }
    const next = zoomToCursor(viewport, { x: 0, y: 0 }, 0.5)
    expect(next.scale).toBe(MIN_SCALE)
  })

  it('returns the same viewport reference when already clamped and factor pushes further out of range', () => {
    const viewport = { panX: 5, panY: 5, scale: MAX_SCALE }
    const next = zoomToCursor(viewport, { x: 10, y: 10 }, 10)
    expect(next).toEqual(viewport)
  })

  describe('wheelScaleFactor', () => {
    it('zooms out for positive deltaY (scroll down)', () => {
      expect(wheelScaleFactor(100)).toBeLessThan(1)
    })

    it('zooms in for negative deltaY (scroll up)', () => {
      expect(wheelScaleFactor(-100)).toBeGreaterThan(1)
    })
  })
})
