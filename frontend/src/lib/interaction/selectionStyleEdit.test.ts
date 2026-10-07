import { describe, expect, it } from 'vitest'
import type { CanvasObjectDto } from '../protocol/messages'
import {
  hasFilled,
  hasFont,
  hasStrokeWidth,
  hasTextColor,
  withBold,
  withColor,
  withFilled,
  withFontFamily,
  withFontSize,
  withItalic,
  withStrikethrough,
  withStrokeWidth,
  withTextColor,
  withUnderline,
} from './selectionStyleEdit'

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

function stickyObj(id: string): CanvasObjectDto {
  return {
    id,
    type: 'sticky-note',
    sequence: 4,
    data: {
      type: 'sticky-note',
      color: '#fff59d',
      x: 0,
      y: 0,
      width: 160,
      height: 120,
      content: 'note',
      fontFamily: 'Arial',
      fontSize: 16,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      textColor: '#1a1a1a',
    },
  }
}

describe('hasStrokeWidth / hasFilled / hasFont', () => {
  it('classifies each shape type correctly', () => {
    expect(hasStrokeWidth(rectObj('a').data)).toBe(true)
    expect(hasStrokeWidth(textObj('a').data)).toBe(false)
    expect(hasFilled(rectObj('a').data)).toBe(true)
    expect(hasFilled(lineObj('a').data)).toBe(false)
    expect(hasFont(textObj('a').data)).toBe(true)
    expect(hasFont(rectObj('a').data)).toBe(false)
  })
})

describe('withColor', () => {
  it('applies to every selected object regardless of type', () => {
    const objects = [rectObj('a'), lineObj('b'), textObj('c'), stickyObj('d')]
    const updates = withColor(objects, '#ff0000')
    expect(updates).toHaveLength(4)
    for (const u of updates) expect(u.data.color).toBe('#ff0000')
  })

  it('returns an empty list for an empty selection', () => {
    expect(withColor([], '#ff0000')).toEqual([])
  })
})

describe('withStrokeWidth', () => {
  it('only updates objects that support strokeWidth, leaving text/sticky-note out', () => {
    const objects = [rectObj('a'), textObj('b'), stickyObj('c')]
    const updates = withStrokeWidth(objects, 8)
    expect(updates.map((u) => u.id)).toEqual(['a'])
    expect((updates[0].data as { strokeWidth: number }).strokeWidth).toBe(8)
  })

  it('returns an empty list when no selected object supports strokeWidth', () => {
    expect(withStrokeWidth([textObj('a'), stickyObj('b')], 8)).toEqual([])
  })

  it('leaves all other fields of the updated object unchanged', () => {
    const original = rectObj('a')
    const [update] = withStrokeWidth([original], 5)
    expect(update.data).toEqual({ ...original.data, strokeWidth: 5 })
  })
})

describe('withFilled', () => {
  it('only updates rect/circle/ellipse/arrow', () => {
    const objects = [rectObj('a'), lineObj('b')]
    const updates = withFilled(objects, true)
    expect(updates.map((u) => u.id)).toEqual(['a'])
    expect((updates[0].data as { filled: boolean }).filled).toBe(true)
  })
})

describe('font-related updates', () => {
  it('withFontFamily only updates text/sticky-note', () => {
    const objects = [rectObj('a'), textObj('b'), stickyObj('c')]
    const updates = withFontFamily(objects, 'Georgia')
    expect(updates.map((u) => u.id).sort()).toEqual(['b', 'c'])
    for (const u of updates) expect((u.data as { fontFamily: string }).fontFamily).toBe('Georgia')
  })

  it('withFontSize/withBold/withItalic/withUnderline/withStrikethrough change only their own field', () => {
    const original = textObj('a')
    expect((withFontSize([original], 24)[0].data as { fontSize: number }).fontSize).toBe(24)
    expect((withBold([original], true)[0].data as { bold: boolean }).bold).toBe(true)
    expect((withItalic([original], true)[0].data as { italic: boolean }).italic).toBe(true)
    expect((withUnderline([original], true)[0].data as { underline: boolean }).underline).toBe(true)
    expect((withStrikethrough([original], true)[0].data as { strikethrough: boolean }).strikethrough).toBe(true)

    const [sizeUpdate] = withFontSize([original], 24)
    expect(sizeUpdate.data).toEqual({ ...original.data, fontSize: 24 })
  })

  it('returns an empty list when no selected object supports font fields', () => {
    expect(withBold([rectObj('a'), lineObj('b')], true)).toEqual([])
  })
})

describe('withTextColor', () => {
  it('only updates sticky-note, not text (where color is already the text color)', () => {
    expect(hasTextColor(stickyObj('a').data)).toBe(true)
    expect(hasTextColor(textObj('a').data)).toBe(false)

    const objects = [stickyObj('a'), textObj('b'), rectObj('c')]
    const updates = withTextColor(objects, '#ffffff')
    expect(updates.map((u) => u.id)).toEqual(['a'])
    expect((updates[0].data as { textColor: string }).textColor).toBe('#ffffff')
  })

  it('leaves the background color and all other fields unchanged', () => {
    const original = stickyObj('a')
    const [update] = withTextColor([original], '#ffffff')
    expect(update.data).toEqual({ ...original.data, textColor: '#ffffff' })
  })

  it('returns an empty list when no sticky-note is selected', () => {
    expect(withTextColor([rectObj('a'), textObj('b')], '#ffffff')).toEqual([])
  })
})
