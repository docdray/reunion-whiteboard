import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FilledToggle from './FilledToggle.svelte'
import { toolStore } from '../lib/stores/toolStore.svelte'

describe('FilledToggle', () => {
  beforeEach(() => {
    toolStore.setFilled(false)
  })

  it('reflects the current store value', () => {
    toolStore.setFilled(true)
    render(FilledToggle)
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
  })

  it('updates the store when toggled', async () => {
    render(FilledToggle)
    await fireEvent.click(screen.getByRole('checkbox'))
    expect(toolStore.filled).toBe(true)
  })

  it('renders a custom label when provided', () => {
    render(FilledToggle, { label: 'Pfeilspitze gefüllt' })
    expect(screen.getByText('Pfeilspitze gefüllt')).toBeInTheDocument()
  })

  it('calls onFilledChange in addition to updating the store', async () => {
    const onFilledChange = vi.fn()
    render(FilledToggle, { onFilledChange })
    await fireEvent.click(screen.getByRole('checkbox'))
    expect(onFilledChange).toHaveBeenCalledWith(true)
    expect(toolStore.filled).toBe(true)
  })
})
