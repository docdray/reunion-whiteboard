import { describe, expect, it } from 'vitest'
import type { CanvasObjectDto } from '../protocol/messages'
import { buildContentUpdate, findEditableTextObject } from './editTextMode'

function textObj(id: string, content: string): CanvasObjectDto {
  return {
    id,
    type: 'text',
    sequence: 1,
    data: {
      type: 'text',
      color: '#000000',
      x: 10,
      y: 10,
      content,
      fontFamily: 'Arial',
      fontSize: 16,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    },
  }
}

function stickyObj(id: string, content: string): CanvasObjectDto {
  return {
    id,
    type: 'sticky-note',
    sequence: 1,
    data: {
      type: 'sticky-note',
      color: '#fff59d',
      x: 0,
      y: 0,
      width: 160,
      height: 120,
      content,
      fontFamily: 'Arial',
      fontSize: 16,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
    },
  }
}

function rectObj(id: string): CanvasObjectDto {
  return {
    id,
    type: 'rect',
    sequence: 1,
    data: { type: 'rect', color: '#000000', strokeWidth: 2, filled: false, x: 0, y: 0, width: 50, height: 50 },
  }
}

describe('findEditableTextObject', () => {
  it('findet ein text-Objekt am Punkt', () => {
    const text = textObj('t1', 'Hallo')
    expect(findEditableTextObject([text], { x: 15, y: 15 })).toBe(text)
  })

  it('findet ein sticky-note-Objekt am Punkt', () => {
    const sticky = stickyObj('s1', 'Notiz')
    expect(findEditableTextObject([sticky], { x: 50, y: 50 })).toBe(sticky)
  })

  it('liefert null für nicht-editierbare Typen wie rect', () => {
    const rect = rectObj('r1')
    expect(findEditableTextObject([rect], { x: 25, y: 25 })).toBeNull()
  })

  it('liefert null wenn kein Objekt getroffen wird', () => {
    const text = textObj('t1', 'Hallo')
    expect(findEditableTextObject([text], { x: 999, y: 999 })).toBeNull()
  })

  it('liefert das oberste Objekt bei Überlappung', () => {
    const rect = rectObj('r1')
    const text = textObj('t1', 'Hallo')
    expect(findEditableTextObject([rect, text], { x: 15, y: 15 })).toBe(text)
  })
})

describe('buildContentUpdate', () => {
  it('baut ein Update mit geändertem content, alle anderen Felder bleiben identisch', () => {
    const text = textObj('t1', 'Alt')
    const update = buildContentUpdate(text, () => 'Neu')
    expect(update).toEqual({ id: 't1', data: { ...text.data, content: 'Neu' } })
  })

  it('liefert null bei Abbruch (null)', () => {
    const text = textObj('t1', 'Alt')
    expect(buildContentUpdate(text, () => null)).toBeNull()
  })

  it('liefert null wenn der Text unverändert bleibt', () => {
    const text = textObj('t1', 'Alt')
    expect(buildContentUpdate(text, (current) => current)).toBeNull()
  })

  it('erlaubt einen leeren Text beim Bearbeiten (anders als bei der Erzeugung)', () => {
    const text = textObj('t1', 'Alt')
    const update = buildContentUpdate(text, () => '')
    expect(update).toEqual({ id: 't1', data: { ...text.data, content: '' } })
  })

  it('liefert null für nicht-editierbare Typen', () => {
    const rect = rectObj('r1')
    expect(buildContentUpdate(rect, () => 'Neu')).toBeNull()
  })
})
