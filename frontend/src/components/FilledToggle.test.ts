import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it } from 'vitest'
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
})
