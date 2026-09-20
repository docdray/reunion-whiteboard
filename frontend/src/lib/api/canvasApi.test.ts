import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CanvasHasActiveUsersError,
  CanvasNotFoundError,
  createCanvas,
  deleteCanvas,
  listCanvases,
} from './canvasApi'

describe('canvasApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('listCanvases fetches /api/canvases and returns the parsed body', async () => {
    const canvases = [{ id: '1', name: 'A', createdAt: '2024-01-01T00:00:00Z', activeUsers: 0 }]
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => canvases })
    vi.stubGlobal('fetch', fetchMock)

    const result = await listCanvases()

    expect(fetchMock).toHaveBeenCalledWith('/api/canvases')
    expect(result).toEqual(canvases)
  })

  it('createCanvas POSTs a JSON body with the name', async () => {
    const created = { id: '2', name: 'B', createdAt: '2024-01-01T00:00:00Z', activeUsers: 0 }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => created })
    vi.stubGlobal('fetch', fetchMock)

    const result = await createCanvas('B')

    expect(fetchMock).toHaveBeenCalledWith('/api/canvases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'B' }),
    })
    expect(result).toEqual(created)
  })

  it('deleteCanvas throws CanvasHasActiveUsersError on 409', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 409 }))
    await expect(deleteCanvas('1')).rejects.toBeInstanceOf(CanvasHasActiveUsersError)
  })

  it('deleteCanvas throws CanvasNotFoundError on 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    await expect(deleteCanvas('1')).rejects.toBeInstanceOf(CanvasNotFoundError)
  })

  it('deleteCanvas resolves without error on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }))
    await expect(deleteCanvas('1')).resolves.toBeUndefined()
  })
})
