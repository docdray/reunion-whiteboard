import { beforeEach, describe, expect, it } from 'vitest'
import { selectionStore } from './selectionStore.svelte'

describe('selectionStore', () => {
  beforeEach(() => {
    selectionStore.reset()
  })

  it('select(ids, false) ersetzt die Selektion', () => {
    selectionStore.select(['a'], false)
    selectionStore.select(['b', 'c'], false)
    expect(selectionStore.selectedIds).toEqual(new Set(['b', 'c']))
  })

  it('select(ids, true) toggelt einzelne IDs', () => {
    selectionStore.select(['a', 'b'], false)
    selectionStore.select(['b'], true)
    expect(selectionStore.selectedIds).toEqual(new Set(['a']))
    selectionStore.select(['c'], true)
    expect(selectionStore.selectedIds).toEqual(new Set(['a', 'c']))
  })

  it('has() spiegelt die aktuelle Selektion', () => {
    selectionStore.select(['x'], false)
    expect(selectionStore.has('x')).toBe(true)
    expect(selectionStore.has('y')).toBe(false)
  })

  it('clear() leert die Selektion', () => {
    selectionStore.select(['a'], false)
    selectionStore.clear()
    expect(selectionStore.selectedIds.size).toBe(0)
  })

  it('removeIds() entfernt nur die betroffenen IDs', () => {
    selectionStore.select(['a', 'b', 'c'], false)
    selectionStore.removeIds(['b'])
    expect(selectionStore.selectedIds).toEqual(new Set(['a', 'c']))
  })

  it('setMoveDelta/clearMoveDelta verwalten die lokale Verschiebungsvorschau', () => {
    selectionStore.setMoveDelta(3, 4)
    expect(selectionStore.moveDelta).toEqual({ dx: 3, dy: 4 })
    selectionStore.clearMoveDelta()
    expect(selectionStore.moveDelta).toBeNull()
  })

  it('setMarqueeRect verwaltet das Auswahl-Rechteck', () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 }
    selectionStore.setMarqueeRect(rect)
    expect(selectionStore.marqueeRect).toEqual(rect)
    selectionStore.setMarqueeRect(null)
    expect(selectionStore.marqueeRect).toBeNull()
  })

  it('reset() setzt alles zurück', () => {
    selectionStore.select(['a'], false)
    selectionStore.setMoveDelta(1, 1)
    selectionStore.setMarqueeRect({ x: 0, y: 0, width: 1, height: 1 })
    selectionStore.reset()
    expect(selectionStore.selectedIds.size).toBe(0)
    expect(selectionStore.moveDelta).toBeNull()
    expect(selectionStore.marqueeRect).toBeNull()
  })
})
