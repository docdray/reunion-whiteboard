import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { previewStore } from './previewStore.svelte'
import type { LineShapeData } from '../protocol/messages'

const sampleLine: LineShapeData = { type: 'line', color: '#000000', strokeWidth: 2, x1: 0, y1: 0, x2: 10, y2: 10 }

describe('previewStore', () => {
  beforeEach(() => {
    previewStore.reset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sets and clears the own preview', () => {
    previewStore.setOwn({ shapeType: 'line', data: sampleLine })
    expect(previewStore.own).toEqual({ shapeType: 'line', data: sampleLine })
    previewStore.clearOwn()
    expect(previewStore.own).toBeNull()
  })

  it('upserts and removes another user preview', () => {
    previewStore.upsertOther('user-1', { shapeType: 'line', data: sampleLine })
    expect(previewStore.others['user-1']).toEqual({ shapeType: 'line', data: sampleLine })
    previewStore.removeOther('user-1')
    expect(previewStore.others['user-1']).toBeUndefined()
  })

  it('expires another user preview automatically when no update arrives in time', () => {
    vi.useFakeTimers()
    previewStore.upsertOther('user-1', { shapeType: 'line', data: sampleLine }, 1000)
    expect(previewStore.others['user-1']).toBeDefined()
    vi.advanceTimersByTime(1001)
    expect(previewStore.others['user-1']).toBeUndefined()
  })

  it('resets the expiry timer on repeated updates instead of expiring early', () => {
    vi.useFakeTimers()
    previewStore.upsertOther('user-1', { shapeType: 'line', data: sampleLine }, 1000)
    vi.advanceTimersByTime(600)
    previewStore.upsertOther('user-1', { shapeType: 'line', data: sampleLine }, 1000)
    vi.advanceTimersByTime(600)
    expect(previewStore.others['user-1']).toBeDefined()
    vi.advanceTimersByTime(500)
    expect(previewStore.others['user-1']).toBeUndefined()
  })

  it('reset clears own/others state and cancels pending expiry timers', () => {
    vi.useFakeTimers()
    previewStore.upsertOther('user-1', { shapeType: 'line', data: sampleLine }, 1000)
    previewStore.setOwn({ shapeType: 'line', data: sampleLine })
    previewStore.reset()
    expect(previewStore.own).toBeNull()
    expect(previewStore.others).toEqual({})
    vi.advanceTimersByTime(2000)
    expect(previewStore.others).toEqual({})
  })
})
