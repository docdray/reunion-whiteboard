import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it } from 'vitest'
import ToolPicker from './ToolPicker.svelte'
import { toolStore } from '../lib/stores/toolStore.svelte'

describe('ToolPicker', () => {
  beforeEach(() => {
    toolStore.setTool('freehand')
  })

  it('marks the current tool as active', () => {
    toolStore.setTool('rect')
    render(ToolPicker)
    expect(screen.getByText('Rechteck').className).toContain('active')
    expect(screen.getByText('Linie').className).not.toContain('active')
  })

  it('switches the tool on click', async () => {
    render(ToolPicker)
    await fireEvent.click(screen.getByText('Ellipse'))
    expect(toolStore.tool).toBe('ellipse')
  })

  it('renders all six tools', () => {
    render(ToolPicker)
    for (const label of ['Freihand', 'Linie', 'Rechteck', 'Kreis', 'Ellipse', 'Text']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })
})
