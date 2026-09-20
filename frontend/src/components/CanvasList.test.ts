import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CanvasList from './CanvasList.svelte'
import type { CanvasSummaryDto } from '../lib/protocol/messages'

const store = vi.hoisted(() => ({
  canvases: [] as CanvasSummaryDto[],
  loading: false,
  error: null as string | null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  get sorted() {
    return [...this.canvases].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
}))

vi.mock('../lib/stores/canvasListStore.svelte', () => ({ canvasListStore: store }))

const canvasOld: CanvasSummaryDto = { id: 'old', name: 'Old', createdAt: '2024-01-01T00:00:00Z', activeUsers: 0 }
const canvasNew: CanvasSummaryDto = { id: 'new', name: 'New', createdAt: '2024-06-01T00:00:00Z', activeUsers: 1 }

describe('CanvasList', () => {
  beforeEach(() => {
    store.canvases = []
    store.loading = false
    store.error = null
    vi.clearAllMocks()
  })

  it('connects on mount', () => {
    render(CanvasList, { props: { onOpenCanvas: vi.fn() } })
    expect(store.connect).toHaveBeenCalledOnce()
  })

  it('disconnects on destroy', () => {
    const { unmount } = render(CanvasList, { props: { onOpenCanvas: vi.fn() } })
    unmount()
    expect(store.disconnect).toHaveBeenCalledOnce()
  })

  it('renders the create form above the table', () => {
    render(CanvasList, { props: { onOpenCanvas: vi.fn() } })
    const form = screen.getByPlaceholderText('Name des neuen Canvas')
    const table = screen.getByRole('table')
    expect(form.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders one table row per canvas, newest first', () => {
    store.canvases = [canvasOld, canvasNew]
    render(CanvasList, { props: { onOpenCanvas: vi.fn() } })
    const rows = screen.getAllByRole('row').slice(1) // ohne Header-Zeile
    expect(rows[0]).toHaveTextContent('New')
    expect(rows[1]).toHaveTextContent('Old')
  })

  it('submitting the create form calls store.create and opens the created canvas', async () => {
    const created = { id: 'x', name: 'Neu', createdAt: '2024-07-01T00:00:00Z', activeUsers: 0 }
    store.create.mockResolvedValue(created)
    const onOpenCanvas = vi.fn()
    render(CanvasList, { props: { onOpenCanvas } })

    await fireEvent.input(screen.getByPlaceholderText('Name des neuen Canvas'), { target: { value: 'Neu' } })
    await fireEvent.click(screen.getByText('Neues Canvas anlegen'))

    expect(store.create).toHaveBeenCalledWith('Neu')
    await Promise.resolve()
    expect(onOpenCanvas).toHaveBeenCalledWith('x', 'Neu')
  })

  it('shows an empty state when there are no canvases', () => {
    render(CanvasList, { props: { onOpenCanvas: vi.fn() } })
    expect(screen.getByText('Noch keine Canvases vorhanden.')).toBeInTheDocument()
  })
})
