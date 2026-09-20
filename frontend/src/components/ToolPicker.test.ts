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

  it('renders all eight tools', () => {
    render(ToolPicker)
    for (const label of ['Freihand', 'Linie', 'Rechteck', 'Kreis', 'Ellipse', 'Text', 'Pfeil', 'Radierer']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('switches to the arrow tool on click', async () => {
    render(ToolPicker)
    await fireEvent.click(screen.getByText('Pfeil'))
    expect(toolStore.tool).toBe('arrow')
  })

  it('switches to the eraser tool on click', async () => {
    render(ToolPicker)
    await fireEvent.click(screen.getByText('Radierer'))
    expect(toolStore.tool).toBe('eraser')
  })
})
