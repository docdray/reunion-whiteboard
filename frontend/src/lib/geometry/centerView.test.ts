import { describe, expect, it } from 'vitest'
import { centerView } from './centerView'
import { MIN_SCALE, MAX_SCALE } from './zoomToCursor'

describe('centerView', () => {
  it('setzt die Standardansicht bei leerem Canvas (Weltursprung mittig, scale=1)', () => {
    const result = centerView(null, 800, 600)
    expect(result).toEqual({ panX: 400, panY: 300, scale: 1 })
  })

  it('zentriert eine einzelne Bounding-Box und passt sie mit Rand ein', () => {
    const bounds = { minX: 0, minY: 0, maxX: 100, maxY: 50 }
    const result = centerView(bounds, 800, 600)

    // Weltmittelpunkt (50,25) muss auf den Stage-Mittelpunkt (400,300) abgebildet werden.
    expect(result.panX + 50 * result.scale).toBeCloseTo(400, 5)
    expect(result.panY + 25 * result.scale).toBeCloseTo(300, 5)
    expect(result.scale).toBeGreaterThan(0)
  })

  it('vereinigt eine weit verteilte Bounding-Box korrekt (kleinerer scale als bei kompakten Objekten)', () => {
    const compact = centerView({ minX: 0, minY: 0, maxX: 100, maxY: 100 }, 800, 600)
    const spread = centerView({ minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 }, 800, 600)
    expect(spread.scale).toBeLessThan(compact.scale)
  })

  it('clampt sehr kleine Bounding-Boxen auf die maximale Zoomstufe', () => {
    const bounds = { minX: 0, minY: 0, maxX: 0.001, maxY: 0.001 }
    const result = centerView(bounds, 800, 600)
    expect(result.scale).toBe(MAX_SCALE)
  })

  it('clampt sehr große Bounding-Boxen auf die minimale Zoomstufe', () => {
    const bounds = { minX: -1_000_000, minY: -1_000_000, maxX: 1_000_000, maxY: 1_000_000 }
    const result = centerView(bounds, 800, 600)
    expect(result.scale).toBe(MIN_SCALE)
  })
})
