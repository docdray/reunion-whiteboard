import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StrokeWidthSelector from './StrokeWidthSelector.svelte'
import { toolStore } from '../lib/stores/toolStore.svelte'

describe('StrokeWidthSelector', () => {
  beforeEach(() => {
    toolStore.setMode('draw')
    toolStore.setTool('freehand')
    toolStore.setStrokeWidth(2)
  })

  it('marks the current width as active', () => {
    render(StrokeWidthSelector)
    expect(screen.getByText('2').className).toContain('active')
  })

  it('updates the store on click', async () => {
    render(StrokeWidthSelector)
    await fireEvent.click(screen.getByText('8'))
    expect(toolStore.strokeWidth).toBe(8)
  })

  it('labels the group "Radiergröße" only in draw mode with the eraser tool', () => {
    toolStore.setTool('eraser')
    const { unmount } = render(StrokeWidthSelector)
    expect(screen.getByRole('group', { name: 'Radiergröße' })).toBeInTheDocument()
    unmount()

    toolStore.setMode('select')
    render(StrokeWidthSelector)
    expect(screen.getByRole('group', { name: 'Linienstärke' })).toBeInTheDocument()
  })

  it('calls onStrokeWidthChange in addition to updating the store', async () => {
    const onStrokeWidthChange = vi.fn()
    render(StrokeWidthSelector, { onStrokeWidthChange })
    await fireEvent.click(screen.getByText('4'))
    expect(onStrokeWidthChange).toHaveBeenCalledWith(4)
    expect(toolStore.strokeWidth).toBe(4)
  })
})
