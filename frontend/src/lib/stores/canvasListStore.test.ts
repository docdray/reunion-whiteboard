import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LobbyServerMessage, CanvasSummaryDto } from '../protocol/messages'

const mockSocket = {
  onMessage: vi.fn<(handler: (msg: LobbyServerMessage) => void) => void>(),
  onStatusChange: vi.fn<(handler: (status: string) => void) => void>(),
  close: vi.fn(),
}
let capturedHandler: ((msg: LobbyServerMessage) => void) | null = null

vi.mock('../api/lobbyWs', () => ({
  connectLobbySocket: vi.fn(() => {
    mockSocket.onMessage.mockImplementation((h) => {
      capturedHandler = h
    })
    return mockSocket
  }),
}))

vi.mock('../api/canvasApi', () => ({
  createCanvas: vi.fn(),
  deleteCanvas: vi.fn(),
}))

const canvasA: CanvasSummaryDto = { id: 'a', name: 'A', createdAt: '2024-01-01T00:00:00Z', activeUsers: 0 }
const canvasB: CanvasSummaryDto = { id: 'b', name: 'B', createdAt: '2024-02-01T00:00:00Z', activeUsers: 0 }

describe('canvasListStore', () => {
  beforeEach(async () => {
    vi.resetModules()
    capturedHandler = null
    mockSocket.close.mockClear()
    mockSocket.onStatusChange.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  async function loadStore() {
    const { canvasListStore } = await import('./canvasListStore.svelte')
    return canvasListStore
  }

  it('connect() opens the socket once and applies lobby-initial-state', async () => {
    const store = await loadStore()
    store.connect()
    expect(capturedHandler).not.toBeNull()

    capturedHandler!({ type: 'lobby-initial-state', canvases: [canvasA, canvasB] })

    expect(store.canvases).toHaveLength(2)
    expect(store.loading).toBe(false)
  })

  it('sorted returns newest-first order regardless of insertion order', async () => {
    const store = await loadStore()
    store.connect()
    capturedHandler!({ type: 'lobby-initial-state', canvases: [canvasA, canvasB] })

    expect(store.sorted.map((c) => c.id)).toEqual(['b', 'a'])
  })

  it('canvas-added adds a new canvas to the list', async () => {
    const store = await loadStore()
    store.connect()
    capturedHandler!({ type: 'lobby-initial-state', canvases: [canvasA] })

    capturedHandler!({ type: 'canvas-added', canvas: canvasB })

    expect(store.canvases.map((c) => c.id)).toContain('b')
  })

  it('canvas-updated replaces the matching canvas', async () => {
    const store = await loadStore()
    store.connect()
    capturedHandler!({ type: 'lobby-initial-state', canvases: [canvasA] })

    capturedHandler!({ type: 'canvas-updated', canvas: { ...canvasA, activeUsers: 3 } })

    expect(store.canvases.find((c) => c.id === 'a')?.activeUsers).toBe(3)
  })

  it('canvas-removed removes the matching canvas', async () => {
    const store = await loadStore()
    store.connect()
    capturedHandler!({ type: 'lobby-initial-state', canvases: [canvasA, canvasB] })

    capturedHandler!({ type: 'canvas-removed', id: 'a' })

    expect(store.canvases.map((c) => c.id)).toEqual(['b'])
  })

  it('disconnect() closes the socket', async () => {
    const store = await loadStore()
    store.connect()
    store.disconnect()
    expect(mockSocket.close).toHaveBeenCalledOnce()
  })

  it('create() delegates to the REST API and does not locally mutate the list', async () => {
    const { createCanvas } = await import('../api/canvasApi')
    ;(createCanvas as ReturnType<typeof vi.fn>).mockResolvedValue(canvasA)
    const store = await loadStore()

    const result = await store.create('A')

    expect(createCanvas).toHaveBeenCalledWith('A')
    expect(result).toEqual(canvasA)
    expect(store.canvases).toHaveLength(0)
  })

  it('remove() delegates to the REST API and surfaces errors', async () => {
    const { deleteCanvas } = await import('../api/canvasApi')
    ;(deleteCanvas as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'))
    const store = await loadStore()

    await expect(store.remove('a')).rejects.toThrow('boom')
    expect(store.error).toBe('boom')
  })
})
