import { describe, expect, it, vi } from 'vitest'
import { SelectInteraction, type SelectInteractionCallbacks } from './selectMode'
import type { CanvasObjectDto, RectShapeData } from '../protocol/messages'

function rect(id: string, sequence: number, x: number, y: number, width: number, height: number): CanvasObjectDto {
  const data: RectShapeData = { type: 'rect', color: '#000', strokeWidth: 1, filled: false, x, y, width, height }
  return { id, type: 'rect', sequence, data }
}

function createHarness(objects: CanvasObjectDto[]) {
  let selectedIds = new Set<string>()
  const onMovePreview = vi.fn()
  const onMovePreviewClear = vi.fn()
  const onMoveCommit = vi.fn()
  const onMarqueeChange = vi.fn()

  function select(ids: string[], additive: boolean): void {
    if (!additive) {
      selectedIds = new Set(ids)
      return
    }
    const next = new Set(selectedIds)
    for (const id of ids) {
      if (next.has(id)) next.delete(id)
      else next.add(id)
    }
    selectedIds = next
  }

  const callbacks: SelectInteractionCallbacks = {
    getObjects: () => objects,
    getSelectedIds: () => selectedIds,
    select,
    onMovePreview,
    onMovePreviewClear,
    onMoveCommit,
    onMarqueeChange,
  }

  const interaction = new SelectInteraction(callbacks)
  return {
    interaction,
    getSelected: () => selectedIds,
    onMovePreview,
    onMovePreviewClear,
    onMoveCommit,
    onMarqueeChange,
  }
}

describe('SelectInteraction', () => {
  it('Klick auf ein Objekt selektiert nur dieses (ersetzt vorherige Selektion)', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10), rect('b', 1, 100, 100, 10, 10)]
    const { interaction, getSelected } = createHarness(objects)

    interaction.pointerDown({ x: 5, y: 5 }, false)
    interaction.pointerUp({ x: 5, y: 5 })
    expect(getSelected()).toEqual(new Set(['a']))

    interaction.pointerDown({ x: 105, y: 105 }, false)
    interaction.pointerUp({ x: 105, y: 105 })
    expect(getSelected()).toEqual(new Set(['b']))
  })

  it('Strg+Klick toggelt die Selektion additiv', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10), rect('b', 1, 100, 100, 10, 10)]
    const { interaction, getSelected } = createHarness(objects)

    interaction.pointerDown({ x: 5, y: 5 }, false)
    interaction.pointerUp({ x: 5, y: 5 })
    interaction.pointerDown({ x: 105, y: 105 }, true)
    interaction.pointerUp({ x: 105, y: 105 })
    expect(getSelected()).toEqual(new Set(['a', 'b']))

    interaction.pointerDown({ x: 5, y: 5 }, true)
    interaction.pointerUp({ x: 5, y: 5 })
    expect(getSelected()).toEqual(new Set(['b']))
  })

  it('Klick ins Leere ohne Ziehen leert die Selektion', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10)]
    const { interaction, getSelected } = createHarness(objects)

    interaction.pointerDown({ x: 5, y: 5 }, false)
    interaction.pointerUp({ x: 5, y: 5 })
    expect(getSelected().size).toBe(1)

    interaction.pointerDown({ x: 500, y: 500 }, false)
    interaction.pointerUp({ x: 500, y: 500 })
    expect(getSelected().size).toBe(0)
  })

  it('Klick+Ziehen auf leerer Fläche selektiert alle vom Marquee geschnittenen Objekte', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10), rect('b', 1, 20, 20, 10, 10), rect('c', 2, 200, 200, 10, 10)]
    const { interaction, getSelected, onMarqueeChange } = createHarness(objects)

    interaction.pointerDown({ x: -5, y: -5 }, false)
    interaction.pointerMove({ x: 25, y: 25 })
    interaction.pointerUp({ x: 25, y: 25 })

    expect(getSelected()).toEqual(new Set(['a', 'b']))
    expect(onMarqueeChange).toHaveBeenLastCalledWith(null)
  })

  it('Marquee ohne Treffer leert die Selektion', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10), rect('c', 2, 200, 200, 10, 10)]
    const { interaction, getSelected } = createHarness(objects)

    interaction.pointerDown({ x: 50, y: 50 }, false)
    interaction.pointerMove({ x: 90, y: 90 })
    interaction.pointerUp({ x: 90, y: 90 })

    expect(getSelected().size).toBe(0)
  })

  it('Klick+Ziehen auf einem bereits selektierten Objekt verschiebt alle selektierten Objekte gemeinsam', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10), rect('b', 1, 20, 20, 10, 10)]
    const { interaction, onMoveCommit } = createHarness(objects)

    interaction.pointerDown({ x: 5, y: 5 }, false)
    interaction.pointerUp({ x: 5, y: 5 })
    interaction.pointerDown({ x: 25, y: 25 }, true)
    interaction.pointerUp({ x: 25, y: 25 })

    interaction.pointerDown({ x: 5, y: 5 }, false)
    interaction.pointerMove({ x: 15, y: 8 })
    interaction.pointerUp({ x: 15, y: 8 })

    expect(onMoveCommit).toHaveBeenCalledTimes(1)
    const updates = onMoveCommit.mock.calls[0][0] as Array<{ id: string; data: RectShapeData }>
    expect(updates).toHaveLength(2)
    const byId = Object.fromEntries(updates.map((u) => [u.id, u.data]))
    expect(byId.a).toMatchObject({ x: 10, y: 3 })
    expect(byId.b).toMatchObject({ x: 30, y: 23 })
  })

  it('reiner Klick ohne Ziehen auf einem Objekt löst keinen Move-Commit aus', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10)]
    const { interaction, onMoveCommit } = createHarness(objects)

    interaction.pointerDown({ x: 5, y: 5 }, false)
    interaction.pointerUp({ x: 5, y: 5 })

    expect(onMoveCommit).not.toHaveBeenCalled()
  })

  it('cancel() räumt eine laufende Marquee-/Move-Geste auf, ohne zu committen', () => {
    const objects = [rect('a', 0, 0, 0, 10, 10)]
    const { interaction, onMoveCommit, onMarqueeChange } = createHarness(objects)

    interaction.pointerDown({ x: 5, y: 5 }, false)
    interaction.pointerMove({ x: 50, y: 50 })
    interaction.cancel()

    expect(onMoveCommit).not.toHaveBeenCalled()
    expect(onMarqueeChange).not.toHaveBeenCalled()
  })
})
