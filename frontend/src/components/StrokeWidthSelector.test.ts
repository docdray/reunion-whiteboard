import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it } from 'vitest'
import StrokeWidthSelector from './StrokeWidthSelector.svelte'
import { toolStore } from '../lib/stores/toolStore.svelte'

describe('StrokeWidthSelector', () => {
  beforeEach(() => {
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
})
