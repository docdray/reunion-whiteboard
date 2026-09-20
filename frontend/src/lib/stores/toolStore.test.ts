import { beforeEach, describe, expect, it } from 'vitest'
import { toolStore } from './toolStore.svelte'

describe('toolStore', () => {
  beforeEach(() => {
    toolStore.setMode('navigation')
    toolStore.setTool('freehand')
    toolStore.setColor('#000000')
    toolStore.setStrokeWidth(2)
    toolStore.setFilled(false)
    toolStore.setFontFamily('sans-serif')
    toolStore.setFontSize(16)
    toolStore.setBold(false)
    toolStore.setItalic(false)
    toolStore.setUnderline(false)
    toolStore.setStrikethrough(false)
  })

  it('defaults to navigation mode and freehand tool', () => {
    expect(toolStore.mode).toBe('navigation')
    expect(toolStore.tool).toBe('freehand')
  })

  it('switches mode and tool', () => {
    toolStore.setMode('draw')
    toolStore.setTool('rect')
    expect(toolStore.mode).toBe('draw')
    expect(toolStore.tool).toBe('rect')
  })

  it('switches to the eraser tool', () => {
    toolStore.setMode('draw')
    toolStore.setTool('eraser')
    expect(toolStore.tool).toBe('eraser')
  })

  it('updates drawing settings', () => {
    toolStore.setColor('#ff0000')
    toolStore.setStrokeWidth(5)
    toolStore.setFilled(true)
    expect(toolStore.drawSettings).toMatchObject({ color: '#ff0000', strokeWidth: 5, filled: true })
  })

  it('updates text formatting settings', () => {
    toolStore.setFontFamily('serif')
    toolStore.setFontSize(24)
    toolStore.setBold(true)
    toolStore.setItalic(true)
    toolStore.setUnderline(true)
    toolStore.setStrikethrough(true)
    expect(toolStore.drawSettings).toMatchObject({
      fontFamily: 'serif',
      fontSize: 24,
      bold: true,
      italic: true,
      underline: true,
      strikethrough: true,
    })
  })
})
