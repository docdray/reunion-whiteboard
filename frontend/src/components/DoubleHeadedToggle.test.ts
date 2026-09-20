import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it } from 'vitest'
import DoubleHeadedToggle from './DoubleHeadedToggle.svelte'
import { toolStore } from '../lib/stores/toolStore.svelte'

describe('DoubleHeadedToggle', () => {
  beforeEach(() => {
    toolStore.setDoubleHeaded(false)
  })

  it('reflects the current store value', () => {
    toolStore.setDoubleHeaded(true)
    render(DoubleHeadedToggle)
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
  })

  it('updates the store when toggled', async () => {
    render(DoubleHeadedToggle)
    await fireEvent.click(screen.getByRole('checkbox'))
    expect(toolStore.doubleHeaded).toBe(true)
  })
})
