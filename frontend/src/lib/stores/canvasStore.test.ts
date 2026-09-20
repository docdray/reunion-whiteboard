import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CanvasObjectDto, RectShapeData } from '../protocol/messages'

function rect(id: string, sequence: number): CanvasObjectDto {
  const data: RectShapeData = {
    type: 'rect',
    color: '#ff0000',
    strokeWidth: 2,
    filled: false,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
  }
  return { id, type: 'rect', sequence, data }
}

describe('canvasStore', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('setInitial sorts objects by sequence', async () => {
    const { canvasStore } = await import('./canvasStore.svelte')
    canvasStore.setInitial([rect('b', 2), rect('a', 1)])
    expect(canvasStore.objects.map((o) => o.id)).toEqual(['a', 'b'])
  })

  it('upsert adds a new object and keeps sequence order', async () => {
    const { canvasStore } = await import('./canvasStore.svelte')
    canvasStore.setInitial([rect('a', 1)])
    canvasStore.upsert(rect('b', 0))
    expect(canvasStore.objects.map((o) => o.id)).toEqual(['b', 'a'])
  })

  it('upsert replaces an existing object with the same id', async () => {
    const { canvasStore } = await import('./canvasStore.svelte')
    canvasStore.setInitial([rect('a', 1)])
    const updated = { ...rect('a', 1), data: { ...rect('a', 1).data, x: 99 } as RectShapeData }
    canvasStore.upsert(updated)
    expect(canvasStore.objects).toHaveLength(1)
    expect((canvasStore.objects[0].data as RectShapeData).x).toBe(99)
  })

  it('upsertMany applies multiple updates', async () => {
    const { canvasStore } = await import('./canvasStore.svelte')
    canvasStore.setInitial([rect('a', 1), rect('b', 2)])
    canvasStore.upsertMany([rect('c', 3), rect('a', 1)])
    expect(canvasStore.objects.map((o) => o.id)).toEqual(['a', 'b', 'c'])
  })

  it('remove deletes objects by id', async () => {
    const { canvasStore } = await import('./canvasStore.svelte')
    canvasStore.setInitial([rect('a', 1), rect('b', 2), rect('c', 3)])
    canvasStore.remove(['a', 'c'])
    expect(canvasStore.objects.map((o) => o.id)).toEqual(['b'])
  })

  it('reset clears all objects', async () => {
    const { canvasStore } = await import('./canvasStore.svelte')
    canvasStore.setInitial([rect('a', 1)])
    canvasStore.reset()
    expect(canvasStore.objects).toEqual([])
  })
})
