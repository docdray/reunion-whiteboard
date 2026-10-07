import { describe, expect, it } from 'vitest'
import type { CanvasObjectDto } from '../protocol/messages'
import { pickRepresentativeObject, toolStoreValuesFrom } from './selectionToToolStore'

function rectObj(id: string, sequence: number): CanvasObjectDto {
  return {
    id,
    type: 'rect',
    sequence,
    data: { type: 'rect', color: '#ff0000', strokeWidth: 4, filled: true, x: 0, y: 0, width: 10, height: 10 },
  }
}

function lineObj(id: string, sequence: number): CanvasObjectDto {
  return {
    id,
    type: 'line',
    sequence,
    data: { type: 'line', color: '#000000', strokeWidth: 2, x1: 0, y1: 0, x2: 10, y2: 10 },
  }
}

function textObj(id: string, sequence: number): CanvasObjectDto {
  return {
    id,
    type: 'text',
    sequence,
    data: {
      type: 'text',
      color: '#123456',
      x: 0,
      y: 0,
      content: 'hi',
      fontFamily: 'Georgia',
      fontSize: 24,
      bold: true,
      italic: true,
      underline: false,
      strikethrough: false,
    },
  }
}

function stickyObj(id: string, sequence: number): CanvasObjectDto {
  return {
    id,
    type: 'sticky-note',
    sequence,
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
      textColor: '#003366',
    },
  }
}

describe('pickRepresentativeObject', () => {
  it('returns the single selected object', () => {
    const objects = [lineObj('a', 1), rectObj('b', 2)]
    expect(pickRepresentativeObject(objects, new Set(['b']))).toEqual(rectObj('b', 2))
  })

  it('returns the first in sequence order when multiple are selected', () => {
    const objects = [lineObj('a', 1), rectObj('b', 2), textObj('c', 3)]
    expect(pickRepresentativeObject(objects, new Set(['c', 'a']))?.id).toBe('a')
  })

  it('returns null for an empty selection', () => {
    expect(pickRepresentativeObject([lineObj('a', 1)], new Set())).toBeNull()
  })

  it('returns null when no selected id matches an existing object', () => {
    expect(pickRepresentativeObject([lineObj('a', 1)], new Set(['missing']))).toBeNull()
  })
})

describe('toolStoreValuesFrom', () => {
  it('includes only color for a type without strokeWidth/filled/font (line still has strokeWidth though)', () => {
    expect(toolStoreValuesFrom(textObj('a', 1).data)).toEqual({
      color: '#123456',
      fontFamily: 'Georgia',
      fontSize: 24,
      bold: true,
      italic: true,
      underline: false,
      strikethrough: false,
    })
  })

  it('includes strokeWidth and filled for rect, but no font fields', () => {
    expect(toolStoreValuesFrom(rectObj('a', 1).data)).toEqual({
      color: '#ff0000',
      strokeWidth: 4,
      filled: true,
    })
  })

  it('includes strokeWidth but not filled for line', () => {
    expect(toolStoreValuesFrom(lineObj('a', 1).data)).toEqual({
      color: '#000000',
      strokeWidth: 2,
    })
  })

  it('includes textColor only for sticky-note', () => {
    const values = toolStoreValuesFrom(stickyObj('a', 1).data)
    expect(values.textColor).toBe('#003366')
    expect(values.color).toBe('#fff59d')
    expect(toolStoreValuesFrom(textObj('a', 1).data).textColor).toBeUndefined()
  })
})
