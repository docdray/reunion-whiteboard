import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import CanvasListItem from './CanvasListItem.svelte'
import type { CanvasSummaryDto } from '../lib/protocol/messages'

const canvas: CanvasSummaryDto = {
  id: '1',
  name: 'Test-Canvas',
  createdAt: '2024-01-01T00:00:00Z',
  activeUsers: 0,
}

describe('CanvasListItem', () => {
  it('enables the delete button when there are no active users', () => {
    render(CanvasListItem, { props: { canvas, onOpen: vi.fn(), onDelete: vi.fn() } })
    expect(screen.getByText('Löschen')).not.toBeDisabled()
  })

  it('disables the delete button with a tooltip when there are active users', () => {
    render(CanvasListItem, {
      props: { canvas: { ...canvas, activeUsers: 2 }, onOpen: vi.fn(), onDelete: vi.fn() },
    })
    const button = screen.getByText('Löschen')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('title', 'Canvas wird noch verwendet')
  })

  it('calls onOpen with the canvas id and name when "Öffnen" is clicked', async () => {
    const onOpen = vi.fn()
    render(CanvasListItem, { props: { canvas, onOpen, onDelete: vi.fn() } })
    await fireEvent.click(screen.getByText('Öffnen'))
    expect(onOpen).toHaveBeenCalledWith('1', 'Test-Canvas')
  })

  it('calls onDelete with the canvas id when "Löschen" is clicked', async () => {
    const onDelete = vi.fn()
    render(CanvasListItem, { props: { canvas, onOpen: vi.fn(), onDelete } })
    await fireEvent.click(screen.getByText('Löschen'))
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
