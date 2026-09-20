import { describe, expect, it } from 'vitest'
import { computeGridLines, gridSpacing, visibleWorldBounds, BASE_GRID_SPACING } from './gridLines'

describe('visibleWorldBounds', () => {
  it('berechnet den sichtbaren Weltausschnitt bei Identitäts-Viewport', () => {
    const bounds = visibleWorldBounds({ panX: 0, panY: 0, scale: 1 }, 800, 600)
    expect(bounds).toEqual({ minX: 0, minY: 0, maxX: 800, maxY: 600 })
  })

  it('berücksichtigt Pan und Zoom', () => {
    const bounds = visibleWorldBounds({ panX: 100, panY: 50, scale: 2 }, 800, 600)
    expect(bounds.minX).toBeCloseTo(-50, 5)
    expect(bounds.maxX).toBeCloseTo(350, 5)
    expect(bounds.minY).toBeCloseTo(-25, 5)
    expect(bounds.maxY).toBeCloseTo(275, 5)
  })
})

describe('gridSpacing', () => {
  it('behält die Basisweite bei normaler Zoomstufe', () => {
    expect(gridSpacing(1)).toBe(BASE_GRID_SPACING)
  })

  it('verdoppelt die Weite, wenn der Bildschirmabstand sonst zu eng würde', () => {
    // 50 * 0.1 = 5px < 20px -> verdoppeln bis Abstand ausreicht (200 * 0.1 = 20px)
    expect(gridSpacing(0.1)).toBe(200)
  })

  it('verkleinert die Weite nicht bei starkem Hineinzoomen (nur Verdoppelung nach oben)', () => {
    expect(gridSpacing(10)).toBe(BASE_GRID_SPACING)
  })
})

describe('computeGridLines', () => {
  it('liefert Linien, die den sichtbaren Bereich lückenlos abdecken', () => {
    const result = computeGridLines({ panX: 0, panY: 0, scale: 1 }, 200, 150)
    expect(result.spacing).toBe(50)
    expect(result.verticalX).toEqual([0, 50, 100, 150, 200])
    expect(result.horizontalY).toEqual([0, 50, 100, 150])
  })

  it('deckt auch negative Weltkoordinaten ab, wenn verschoben wurde', () => {
    const result = computeGridLines({ panX: 60, panY: 0, scale: 1 }, 200, 100)
    // sichtbarer Bereich: x von -60 bis 140
    expect(result.verticalX[0]).toBeLessThanOrEqual(result.bounds.minX)
    expect(result.verticalX.some((x) => x < 0)).toBe(true)
    expect(result.verticalX.at(-1)).toBeGreaterThan(result.bounds.maxX - result.spacing)
  })

  it('nutzt die vergröberte Gitterweite bei starkem Herauszoomen', () => {
    const result = computeGridLines({ panX: 0, panY: 0, scale: 0.1 }, 800, 600)
    expect(result.spacing).toBe(200)
  })
})
