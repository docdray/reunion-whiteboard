import { describe, expect, it, vi } from 'vitest'
import { DrawInteraction, type DrawInteractionCallbacks } from './drawMode'
import type { DrawSettings } from '../geometry/shapeFromDrag'
import type { PointDto } from '../protocol/messages'

const settings: DrawSettings = {
  color: '#000000',
  strokeWidth: 2,
  filled: false,
  fontFamily: 'sans-serif',
  fontSize: 16,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
}

function makeInteraction(requestTextContent: (point: PointDto) => string | null = () => 'Hallo') {
  const onPreviewUpdate = vi.fn()
  const onPreviewClear = vi.fn()
  const onCommit = vi.fn()
  const callbacks: DrawInteractionCallbacks = {
    getSettings: () => settings,
    onPreviewUpdate,
    onPreviewClear,
    onCommit,
    requestTextContent,
  }
  return { interaction: new DrawInteraction(callbacks), onPreviewUpdate, onPreviewClear, onCommit }
}

describe('DrawInteraction', () => {
  it('previews during drag and commits a rect on pointer up', () => {
    const { interaction, onPreviewUpdate, onPreviewClear, onCommit } = makeInteraction()
    interaction.pointerDown('rect', { x: 0, y: 0 })
    expect(interaction.isDragging).toBe(true)

    interaction.pointerMove({ x: 10, y: 10 })
    expect(onPreviewUpdate).toHaveBeenCalledWith('rect', expect.objectContaining({ type: 'rect', width: 10, height: 10 }))

    interaction.pointerUp({ x: 20, y: 5 })
    expect(onCommit).toHaveBeenCalledWith('rect', expect.objectContaining({ type: 'rect', width: 20, height: 5 }))
    expect(onPreviewClear).toHaveBeenCalledOnce()
    expect(interaction.isDragging).toBe(false)
  })

  it('accumulates every point for freehand drawing', () => {
    const { interaction, onCommit } = makeInteraction()
    interaction.pointerDown('freehand', { x: 0, y: 0 })
    interaction.pointerMove({ x: 1, y: 1 })
    interaction.pointerMove({ x: 2, y: 3 })
    interaction.pointerUp({ x: 4, y: 4 })

    expect(onCommit).toHaveBeenCalledWith(
      'freehand',
      expect.objectContaining({
        type: 'freehand',
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 3 },
          { x: 4, y: 4 },
        ],
      }),
    )
  })

  it('commits text immediately on pointer down without entering a drag state', () => {
    const requestTextContent = vi.fn(() => 'Hallo')
    const { interaction, onCommit, onPreviewUpdate } = makeInteraction(requestTextContent)

    interaction.pointerDown('text', { x: 5, y: 6 })

    expect(requestTextContent).toHaveBeenCalledWith({ x: 5, y: 6 })
    expect(onCommit).toHaveBeenCalledWith('text', expect.objectContaining({ type: 'text', x: 5, y: 6, content: 'Hallo' }))
    expect(interaction.isDragging).toBe(false)

    interaction.pointerMove({ x: 6, y: 6 })
    expect(onPreviewUpdate).not.toHaveBeenCalled()
  })

  it('does not commit text when the user cancels the prompt', () => {
    const { interaction, onCommit } = makeInteraction(() => null)
    interaction.pointerDown('text', { x: 5, y: 6 })
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('does not commit text for blank/whitespace-only input', () => {
    const { interaction, onCommit } = makeInteraction(() => '   ')
    interaction.pointerDown('text', { x: 5, y: 6 })
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('ignores pointerMove/pointerUp when not currently dragging', () => {
    const { interaction, onPreviewUpdate, onCommit } = makeInteraction()
    interaction.pointerMove({ x: 1, y: 1 })
    interaction.pointerUp({ x: 1, y: 1 })
    expect(onPreviewUpdate).not.toHaveBeenCalled()
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('cancel clears the preview and resets drag state without committing', () => {
    const { interaction, onPreviewClear, onCommit } = makeInteraction()
    interaction.pointerDown('line', { x: 0, y: 0 })
    interaction.pointerMove({ x: 5, y: 5 })

    interaction.cancel()

    expect(onPreviewClear).toHaveBeenCalledOnce()
    expect(interaction.isDragging).toBe(false)

    interaction.pointerUp({ x: 5, y: 5 })
    expect(onCommit).not.toHaveBeenCalled()
  })
})
