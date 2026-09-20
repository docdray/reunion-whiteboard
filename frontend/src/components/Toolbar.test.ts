import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Toolbar from './Toolbar.svelte'
import { toolStore } from '../lib/stores/toolStore.svelte'

describe('Toolbar', () => {
  beforeEach(() => {
    toolStore.setMode('navigation')
    toolStore.setTool('freehand')
  })

  it('hides drawing settings in navigation mode', () => {
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() } })
    expect(screen.queryByRole('group', { name: 'Werkzeug' })).not.toBeInTheDocument()
  })

  it('shows the tool picker and color/stroke settings in draw mode', () => {
    toolStore.setMode('draw')
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() } })
    expect(screen.getByRole('group', { name: 'Werkzeug' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Farbauswahl' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Linienstärke' })).toBeInTheDocument()
  })

  it('shows the filled toggle only for rect/circle/ellipse in draw mode', () => {
    toolStore.setMode('draw')
    toolStore.setTool('line')
    const { unmount } = render(Toolbar, {
      props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() },
    })
    expect(screen.queryByText('Gefüllt')).not.toBeInTheDocument()
    unmount()

    toolStore.setTool('rect')
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() } })
    expect(screen.getByText('Gefüllt')).toBeInTheDocument()
  })

  it('shows the filled toggle with an arrow-specific label and the double-headed toggle only for arrow', () => {
    toolStore.setMode('draw')
    toolStore.setTool('rect')
    const { unmount } = render(Toolbar, {
      props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() },
    })
    expect(screen.queryByText('Doppelpfeil')).not.toBeInTheDocument()
    unmount()

    toolStore.setTool('arrow')
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() } })
    expect(screen.getByText('Pfeilspitze gefüllt')).toBeInTheDocument()
    expect(screen.getByText('Doppelpfeil')).toBeInTheDocument()
  })

  it('shows the font dialog only for the text and sticky-note tools in draw mode', () => {
    toolStore.setMode('draw')
    toolStore.setTool('rect')
    const { unmount } = render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() } })
    expect(screen.queryByRole('group', { name: 'Textformatierung' })).not.toBeInTheDocument()
    unmount()

    toolStore.setTool('text')
    const { unmount: unmountText } = render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() } })
    expect(screen.getByRole('group', { name: 'Textformatierung' })).toBeInTheDocument()
    unmountText()

    toolStore.setTool('sticky-note')
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() } })
    expect(screen.getByRole('group', { name: 'Textformatierung' })).toBeInTheDocument()
  })

  it('does not show the filled toggle for the sticky-note tool', () => {
    toolStore.setMode('draw')
    toolStore.setTool('sticky-note')
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() } })
    expect(screen.queryByText('Gefüllt')).not.toBeInTheDocument()
  })

  it('shows the stroke width group with an eraser-specific label for the eraser tool', () => {
    toolStore.setMode('draw')
    toolStore.setTool('eraser')
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() } })
    expect(screen.getByRole('group', { name: 'Radiergröße' })).toBeInTheDocument()
  })

  it('calls onLeave when the leave button is clicked', async () => {
    const onLeave = vi.fn()
    render(Toolbar, { props: { canvasName: 'Mein Canvas', onLeave, onCenterView: vi.fn() } })
    await fireEvent.click(screen.getByText('Canvas "Mein Canvas" verlassen'))
    expect(onLeave).toHaveBeenCalledOnce()
  })

  it('shows the center button only in navigation mode and calls onCenterView when clicked', async () => {
    toolStore.setMode('draw')
    const { unmount } = render(Toolbar, {
      props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn() },
    })
    expect(screen.queryByText('Zentrieren')).not.toBeInTheDocument()
    unmount()

    toolStore.setMode('navigation')
    const onCenterView = vi.fn()
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn(), onCenterView } })
    await fireEvent.click(screen.getByText('Zentrieren'))
    expect(onCenterView).toHaveBeenCalledOnce()
  })
})
