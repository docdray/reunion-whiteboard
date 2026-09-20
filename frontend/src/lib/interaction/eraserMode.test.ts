import { describe, expect, it, vi } from 'vitest'
import { EraserInteraction, eraserRadius } from './eraserMode'
import type { CanvasObjectDto, RectShapeData } from '../protocol/messages'

function rect(id: string, sequence: number, x: number, y: number, width: number, height: number): CanvasObjectDto {
  const data: RectShapeData = { type: 'rect', color: '#000', strokeWidth: 1, filled: false, x, y, width, height }
  return { id, type: 'rect', sequence, data }
}

function createHarness(objects: CanvasObjectDto[], radius = 8) {
  const onErase = vi.fn()
  const interaction = new EraserInteraction({
    getObjects: () => objects,
    getRadius: () => radius,
    onErase,
  })
  return { interaction, onErase }
}

describe('EraserInteraction', () => {
  it('löscht ein getroffenes Objekt beim Antippen', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10)]
    const { interaction, onErase } = createHarness(objects)
    interaction.pointerDown({ x: 5, y: 5 })
    expect(onErase).toHaveBeenCalledWith(['a'])
  })

  it('trifft kein Objekt außerhalb des Toleranzradius', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10)]
    const { interaction, onErase } = createHarness(objects, 4)
    interaction.pointerDown({ x: 100, y: 100 })
    expect(onErase).not.toHaveBeenCalled()
  })

  it('meldet ein bereits getroffenes Objekt im selben Zug nicht erneut', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10)]
    const { interaction, onErase } = createHarness(objects)
    interaction.pointerDown({ x: 5, y: 5 })
    interaction.pointerMove({ x: 6, y: 6 })
    expect(onErase).toHaveBeenCalledTimes(1)
  })

  it('meldet mehrere gleichzeitig getroffene Objekte in einem Schritt zusammen', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10), rect('b', 1, 5, 5, 10, 10)]
    const { interaction, onErase } = createHarness(objects)
    interaction.pointerDown({ x: 8, y: 8 })
    expect(onErase).toHaveBeenCalledTimes(1)
    expect(onErase.mock.calls[0][0]).toEqual(expect.arrayContaining(['a', 'b']))
    expect(onErase.mock.calls[0][0]).toHaveLength(2)
  })

  it('erlaubt erneutes Treffen nach pointerUp (neuer Zug)', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10)]
    const { interaction, onErase } = createHarness(objects)
    interaction.pointerDown({ x: 5, y: 5 })
    interaction.pointerUp()
    interaction.pointerDown({ x: 5, y: 5 })
    expect(onErase).toHaveBeenCalledTimes(2)
  })

  it('pointerMove ohne vorheriges pointerDown tut nichts', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10)]
    const { interaction, onErase } = createHarness(objects)
    interaction.pointerMove({ x: 5, y: 5 })
    expect(onErase).not.toHaveBeenCalled()
  })

  describe('eraserRadius', () => {
    it('hat eine Mindestgröße von 8', () => {
      expect(eraserRadius(1)).toBe(8)
    })

    it('skaliert mit der Strichstärke', () => {
      expect(eraserRadius(10)).toBe(40)
    })
  })
})
