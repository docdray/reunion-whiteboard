import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it } from 'vitest'
import ModeSwitch from './ModeSwitch.svelte'
import { toolStore } from '../lib/stores/toolStore.svelte'

describe('ModeSwitch', () => {
  beforeEach(() => {
    toolStore.setMode('navigation')
  })

  it('marks the current mode as active', () => {
    toolStore.setMode('draw')
    render(ModeSwitch)
    expect(screen.getByText('Zeichnen').className).toContain('active')
    expect(screen.getByText('Navigation').className).not.toContain('active')
  })

  it('switches the mode on click', async () => {
    render(ModeSwitch)
    await fireEvent.click(screen.getByText('Markieren'))
    expect(toolStore.mode).toBe('select')
  })
})
