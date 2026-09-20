import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it } from 'vitest'
import ColorPicker from './ColorPicker.svelte'
import { toolStore } from '../lib/stores/toolStore.svelte'

describe('ColorPicker', () => {
  beforeEach(() => {
    toolStore.setColor('#000000')
  })

  it('renders ten quick-select swatches', () => {
    render(ColorPicker)
    expect(screen.getAllByRole('button')).toHaveLength(10)
  })

  it('marks the active swatch', () => {
    toolStore.setColor('#e53935')
    render(ColorPicker)
    const active = screen.getByLabelText('#e53935')
    expect(active.className).toContain('active')
  })

  it('updates the store color when a swatch is clicked', async () => {
    render(ColorPicker)
    await fireEvent.click(screen.getByLabelText('#1e88e5'))
    expect(toolStore.color).toBe('#1e88e5')
  })

  it('updates the store color from the custom color input', async () => {
    render(ColorPicker)
    const input = screen.getByDisplayValue('#000000') as HTMLInputElement
    await fireEvent.input(input, { target: { value: '#123456' } })
    expect(toolStore.color).toBe('#123456')
  })
})
