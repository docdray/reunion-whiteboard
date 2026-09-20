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
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn() } })
    expect(screen.queryByRole('group', { name: 'Werkzeug' })).not.toBeInTheDocument()
  })

  it('shows the tool picker and color/stroke settings in draw mode', () => {
    toolStore.setMode('draw')
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn() } })
    expect(screen.getByRole('group', { name: 'Werkzeug' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Farbauswahl' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Linienstärke' })).toBeInTheDocument()
  })

  it('shows the filled toggle only for rect/circle/ellipse in draw mode', () => {
    toolStore.setMode('draw')
    toolStore.setTool('line')
    const { unmount } = render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn() } })
    expect(screen.queryByText('Gefüllt')).not.toBeInTheDocument()
    unmount()

    toolStore.setTool('rect')
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn() } })
    expect(screen.getByText('Gefüllt')).toBeInTheDocument()
  })

  it('shows the font dialog only for the text tool in draw mode', () => {
    toolStore.setMode('draw')
    toolStore.setTool('rect')
    const { unmount } = render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn() } })
    expect(screen.queryByRole('group', { name: 'Textformatierung' })).not.toBeInTheDocument()
    unmount()

    toolStore.setTool('text')
    render(Toolbar, { props: { canvasName: 'Test', onLeave: vi.fn() } })
    expect(screen.getByRole('group', { name: 'Textformatierung' })).toBeInTheDocument()
  })

  it('calls onLeave when the leave button is clicked', async () => {
    const onLeave = vi.fn()
    render(Toolbar, { props: { canvasName: 'Mein Canvas', onLeave } })
    await fireEvent.click(screen.getByText('Canvas "Mein Canvas" verlassen'))
    expect(onLeave).toHaveBeenCalledOnce()
  })
})
