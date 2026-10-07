import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Toolbar from './Toolbar.svelte'
import { toolStore } from '../lib/stores/toolStore.svelte'
import { canvasStore } from '../lib/stores/canvasStore.svelte'
import { selectionStore } from '../lib/stores/selectionStore.svelte'
import type { CanvasObjectDto } from '../lib/protocol/messages'

function rectObj(id: string): CanvasObjectDto {
  return {
    id,
    type: 'rect',
    sequence: 1,
    data: { type: 'rect', color: '#000000', strokeWidth: 2, filled: false, x: 0, y: 0, width: 10, height: 10 },
  }
}

function lineObj(id: string): CanvasObjectDto {
  return {
    id,
    type: 'line',
    sequence: 2,
    data: { type: 'line', color: '#000000', strokeWidth: 2, x1: 0, y1: 0, x2: 10, y2: 10 },
  }
}

function textObj(id: string): CanvasObjectDto {
  return {
    id,
    type: 'text',
    sequence: 3,
    data: {
      type: 'text',
      color: '#000000',
      x: 0,
      y: 0,
      content: 'hi',
      fontFamily: 'Arial',
      fontSize: 16,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    },
  }
}

function baseProps() {
  return { canvasName: 'Test', onLeave: vi.fn(), onCenterView: vi.fn(), onApplyStyleToSelection: vi.fn() }
}

describe('Toolbar', () => {
  beforeEach(() => {
    toolStore.setMode('navigation')
    toolStore.setTool('freehand')
    canvasStore.reset()
    selectionStore.reset()
  })

  it('hides drawing settings in navigation mode', () => {
    render(Toolbar, { props: baseProps() })
    expect(screen.queryByRole('group', { name: 'Werkzeug' })).not.toBeInTheDocument()
  })

  it('shows the tool picker and color/stroke settings in draw mode', () => {
    toolStore.setMode('draw')
    render(Toolbar, { props: baseProps() })
    expect(screen.getByRole('group', { name: 'Werkzeug' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Farbauswahl' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Linienstärke' })).toBeInTheDocument()
  })

  it('shows the filled toggle only for rect/circle/ellipse in draw mode', () => {
    toolStore.setMode('draw')
    toolStore.setTool('line')
    const { unmount } = render(Toolbar, { props: baseProps() })
    expect(screen.queryByText('Gefüllt')).not.toBeInTheDocument()
    unmount()

    toolStore.setTool('rect')
    render(Toolbar, { props: baseProps() })
    expect(screen.getByText('Gefüllt')).toBeInTheDocument()
  })

  it('shows the filled toggle with an arrow-specific label and the double-headed toggle only for arrow', () => {
    toolStore.setMode('draw')
    toolStore.setTool('rect')
    const { unmount } = render(Toolbar, { props: baseProps() })
    expect(screen.queryByText('Doppelpfeil')).not.toBeInTheDocument()
    unmount()

    toolStore.setTool('arrow')
    render(Toolbar, { props: baseProps() })
    expect(screen.getByText('Pfeilspitze gefüllt')).toBeInTheDocument()
    expect(screen.getByText('Doppelpfeil')).toBeInTheDocument()
  })

  it('shows the font dialog only for the text and sticky-note tools in draw mode', () => {
    toolStore.setMode('draw')
    toolStore.setTool('rect')
    const { unmount } = render(Toolbar, { props: baseProps() })
    expect(screen.queryByRole('group', { name: 'Textformatierung' })).not.toBeInTheDocument()
    unmount()

    toolStore.setTool('text')
    const { unmount: unmountText } = render(Toolbar, { props: baseProps() })
    expect(screen.getByRole('group', { name: 'Textformatierung' })).toBeInTheDocument()
    unmountText()

    toolStore.setTool('sticky-note')
    render(Toolbar, { props: baseProps() })
    expect(screen.getByRole('group', { name: 'Textformatierung' })).toBeInTheDocument()
  })

  it('does not show the filled toggle for the sticky-note tool', () => {
    toolStore.setMode('draw')
    toolStore.setTool('sticky-note')
    render(Toolbar, { props: baseProps() })
    expect(screen.queryByText('Gefüllt')).not.toBeInTheDocument()
  })

  it('shows the stroke width group with an eraser-specific label for the eraser tool', () => {
    toolStore.setMode('draw')
    toolStore.setTool('eraser')
    render(Toolbar, { props: baseProps() })
    expect(screen.getByRole('group', { name: 'Radiergröße' })).toBeInTheDocument()
  })

  it('calls onLeave when the leave button is clicked', async () => {
    const onLeave = vi.fn()
    render(Toolbar, { props: { ...baseProps(), canvasName: 'Mein Canvas', onLeave } })
    await fireEvent.click(screen.getByText('Canvas "Mein Canvas" verlassen'))
    expect(onLeave).toHaveBeenCalledOnce()
  })

  it('shows the center button only in navigation mode and calls onCenterView when clicked', async () => {
    toolStore.setMode('draw')
    const { unmount } = render(Toolbar, { props: baseProps() })
    expect(screen.queryByText('Zentrieren')).not.toBeInTheDocument()
    unmount()

    toolStore.setMode('navigation')
    const onCenterView = vi.fn()
    render(Toolbar, { props: { ...baseProps(), onCenterView } })
    await fireEvent.click(screen.getByText('Zentrieren'))
    expect(onCenterView).toHaveBeenCalledOnce()
  })

  describe('select mode with a selection', () => {
    it('hides all style controls when nothing is selected', () => {
      toolStore.setMode('select')
      render(Toolbar, { props: baseProps() })
      expect(screen.queryByRole('group', { name: 'Farbauswahl' })).not.toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Linienstärke' })).not.toBeInTheDocument()
      expect(screen.queryByText('Gefüllt')).not.toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Textformatierung' })).not.toBeInTheDocument()
    })

    it('shows color + stroke width + filled for a selected rect', () => {
      canvasStore.setInitial([rectObj('a')])
      selectionStore.select(['a'], false)
      toolStore.setMode('select')
      render(Toolbar, { props: baseProps() })
      expect(screen.getByRole('group', { name: 'Farbauswahl' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Linienstärke' })).toBeInTheDocument()
      expect(screen.getByText('Gefüllt')).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Textformatierung' })).not.toBeInTheDocument()
    })

    it('shows color + font dialog but not stroke width/filled for a selected text object', () => {
      canvasStore.setInitial([textObj('a')])
      selectionStore.select(['a'], false)
      toolStore.setMode('select')
      render(Toolbar, { props: baseProps() })
      expect(screen.getByRole('group', { name: 'Farbauswahl' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Textformatierung' })).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Linienstärke' })).not.toBeInTheDocument()
      expect(screen.queryByText('Gefüllt')).not.toBeInTheDocument()
    })

    it('shows stroke width for a mixed selection containing at least one eligible object, labelled "Linienstärke" even if the leftover draw tool is the eraser', () => {
      canvasStore.setInitial([rectObj('a'), textObj('b')])
      selectionStore.select(['a', 'b'], false)
      toolStore.setMode('select')
      toolStore.setTool('eraser')
      render(Toolbar, { props: baseProps() })
      expect(screen.getByRole('group', { name: 'Linienstärke' })).toBeInTheDocument()
    })

    it('applies a color change to all selected objects via onApplyStyleToSelection', async () => {
      canvasStore.setInitial([rectObj('a'), lineObj('b')])
      selectionStore.select(['a', 'b'], false)
      toolStore.setMode('select')
      const onApplyStyleToSelection = vi.fn()
      render(Toolbar, { props: { ...baseProps(), onApplyStyleToSelection } })

      await fireEvent.click(screen.getByLabelText('#e53935'))

      expect(onApplyStyleToSelection).toHaveBeenCalledOnce()
      const updates = onApplyStyleToSelection.mock.calls[0][0]
      expect(updates.map((u: { id: string }) => u.id).sort()).toEqual(['a', 'b'])
      for (const u of updates) expect(u.data.color).toBe('#e53935')
    })

    it('applies a stroke width change only to selected objects that support it', async () => {
      canvasStore.setInitial([rectObj('a'), textObj('b')])
      selectionStore.select(['a', 'b'], false)
      toolStore.setMode('select')
      const onApplyStyleToSelection = vi.fn()
      render(Toolbar, { props: { ...baseProps(), onApplyStyleToSelection } })

      await fireEvent.click(screen.getByText('8'))

      expect(onApplyStyleToSelection).toHaveBeenCalledOnce()
      const updates = onApplyStyleToSelection.mock.calls[0][0]
      expect(updates.map((u: { id: string }) => u.id)).toEqual(['a'])
    })

    it('does not apply style changes while in draw mode', async () => {
      toolStore.setMode('draw')
      toolStore.setTool('rect')
      const onApplyStyleToSelection = vi.fn()
      render(Toolbar, { props: { ...baseProps(), onApplyStyleToSelection } })

      await fireEvent.click(screen.getByLabelText('#e53935'))

      expect(onApplyStyleToSelection).not.toHaveBeenCalled()
    })
  })
})
