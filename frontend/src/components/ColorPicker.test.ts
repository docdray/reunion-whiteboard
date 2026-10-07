import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import ColorPicker from './ColorPicker.svelte'

describe('ColorPicker', () => {
  it('renders ten quick-select swatches', () => {
    render(ColorPicker, { value: '#000000', onChange: vi.fn() })
    expect(screen.getAllByRole('button')).toHaveLength(10)
  })

  it('marks the active swatch based on the value prop', () => {
    render(ColorPicker, { value: '#e53935', onChange: vi.fn() })
    const active = screen.getByLabelText('#e53935')
    expect(active.className).toContain('active')
  })

  it('calls onChange when a swatch is clicked', async () => {
    const onChange = vi.fn()
    render(ColorPicker, { value: '#000000', onChange })
    await fireEvent.click(screen.getByLabelText('#1e88e5'))
    expect(onChange).toHaveBeenCalledWith('#1e88e5')
  })

  it('calls onChange from the custom color input', async () => {
    const onChange = vi.fn()
    render(ColorPicker, { value: '#000000', onChange })
    const input = screen.getByDisplayValue('#000000') as HTMLInputElement
    await fireEvent.input(input, { target: { value: '#123456' } })
    expect(onChange).toHaveBeenCalledWith('#123456')
  })

  it('uses the label prop for the group accessible name, defaulting to Farbauswahl', () => {
    const { rerender } = render(ColorPicker, { value: '#000000', onChange: vi.fn() })
    expect(screen.getByRole('group', { name: 'Farbauswahl' })).toBeTruthy()
    rerender({ value: '#000000', onChange: vi.fn(), label: 'Textfarbe' })
    expect(screen.getByRole('group', { name: 'Textfarbe' })).toBeTruthy()
  })
})
