import { describe, expect, it } from 'vitest'
import { ARROW_HEAD_POINTER_LENGTH, ARROW_HEAD_POINTER_WIDTH, arrowHeadWings } from './arrowHead'

const expectedWingDistance = Math.hypot(ARROW_HEAD_POINTER_LENGTH, ARROW_HEAD_POINTER_WIDTH / 2)
const expectedHalfAngle = Math.atan2(ARROW_HEAD_POINTER_WIDTH / 2, ARROW_HEAD_POINTER_LENGTH)

describe('arrowHeadWings', () => {
  it('places both wings behind the tip, symmetric to the shaft, for a rightward arrow', () => {
    const [w1, w2] = arrowHeadWings(0, 0, 10, 0)
    expect(w1.x).toBeLessThan(10)
    expect(w2.x).toBeLessThan(10)
    expect(w1.y).toBeCloseTo(-w2.y, 10)
    expect(Math.hypot(w1.x - 10, w1.y - 0)).toBeCloseTo(expectedWingDistance, 10)
    expect(Math.hypot(w2.x - 10, w2.y - 0)).toBeCloseTo(expectedWingDistance, 10)
  })

  it('places both wings behind the tip, symmetric to the shaft, for an upward arrow', () => {
    const [w1, w2] = arrowHeadWings(0, 10, 0, 0)
    expect(w1.y).toBeGreaterThan(0)
    expect(w2.y).toBeGreaterThan(0)
    expect(w1.x).toBeCloseTo(-w2.x, 10)
  })

  it('keeps a wing-to-wing angle of exactly twice the pointer half-angle', () => {
    const [w1, w2] = arrowHeadWings(0, 0, 10, 0)
    const tip = { x: 10, y: 0 }
    const angle1 = Math.atan2(w1.y - tip.y, w1.x - tip.x)
    const angle2 = Math.atan2(w2.y - tip.y, w2.x - tip.x)
    let delta = Math.abs(angle1 - angle2)
    if (delta > Math.PI) delta = 2 * Math.PI - delta
    expect(delta).toBeCloseTo(2 * expectedHalfAngle, 10)
  })

  it('is direction-independent: reversing tail/tip mirrors the arrowhead to the other end', () => {
    const [a1, a2] = arrowHeadWings(0, 0, 10, 0)
    const [b1, b2] = arrowHeadWings(10, 0, 0, 0)
    // Spitze am jeweils anderen Ende, Flügel zeigen entsprechend in die Gegenrichtung.
    expect(a1.x).not.toBeCloseTo(b1.x, 0)
    expect(Math.hypot(b1.x - 0, b1.y - 0)).toBeCloseTo(expectedWingDistance, 10)
    expect(Math.hypot(b2.x - 0, b2.y - 0)).toBeCloseTo(expectedWingDistance, 10)
  })

  it('honors custom pointerLength/pointerWidth', () => {
    const [w1] = arrowHeadWings(0, 0, 10, 0, 20, 0)
    // pointerWidth=0 -> beide Flügel liegen exakt auf der Schaftlinie, Distanz = pointerLength
    expect(w1.y).toBeCloseTo(0, 10)
    expect(w1.x).toBeCloseTo(10 - 20, 10)
  })
})
