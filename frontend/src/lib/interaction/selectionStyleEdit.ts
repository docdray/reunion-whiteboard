import type { CanvasObjectDto, ObjectUpdateEntry, ShapeData } from '../protocol/messages'

type WithStrokeWidth = Extract<ShapeData, { strokeWidth: number }>
type WithFilled = Extract<ShapeData, { filled: boolean }>
type WithFont = Extract<ShapeData, { fontFamily: string }>

export function hasStrokeWidth(data: ShapeData): data is WithStrokeWidth {
  switch (data.type) {
    case 'freehand':
    case 'line':
    case 'rect':
    case 'circle':
    case 'ellipse':
    case 'arrow':
      return true
    case 'text':
    case 'sticky-note':
      return false
  }
}

export function hasFilled(data: ShapeData): data is WithFilled {
  switch (data.type) {
    case 'rect':
    case 'circle':
    case 'ellipse':
    case 'arrow':
      return true
    case 'freehand':
    case 'line':
    case 'text':
    case 'sticky-note':
      return false
  }
}

export function hasFont(data: ShapeData): data is WithFont {
  switch (data.type) {
    case 'text':
    case 'sticky-note':
      return true
    case 'freehand':
    case 'line':
    case 'rect':
    case 'circle':
    case 'ellipse':
    case 'arrow':
      return false
  }
}

function buildUpdates<T extends ShapeData>(
  objects: CanvasObjectDto[],
  predicate: (data: ShapeData) => data is T,
  apply: (data: T) => T,
): ObjectUpdateEntry[] {
  const updates: ObjectUpdateEntry[] = []
  for (const obj of objects) {
    if (predicate(obj.data)) {
      updates.push({ id: obj.id, data: apply(obj.data) })
    }
  }
  return updates
}

/** Farbe gilt für jeden Shape-Typ, daher keine Filterung nötig. */
export function withColor(objects: CanvasObjectDto[], color: string): ObjectUpdateEntry[] {
  return objects.map((o) => ({ id: o.id, data: { ...o.data, color } }))
}

export function withStrokeWidth(objects: CanvasObjectDto[], strokeWidth: number): ObjectUpdateEntry[] {
  return buildUpdates(objects, hasStrokeWidth, (d) => ({ ...d, strokeWidth }))
}

export function withFilled(objects: CanvasObjectDto[], filled: boolean): ObjectUpdateEntry[] {
  return buildUpdates(objects, hasFilled, (d) => ({ ...d, filled }))
}

export function withFontFamily(objects: CanvasObjectDto[], fontFamily: string): ObjectUpdateEntry[] {
  return buildUpdates(objects, hasFont, (d) => ({ ...d, fontFamily }))
}

export function withFontSize(objects: CanvasObjectDto[], fontSize: number): ObjectUpdateEntry[] {
  return buildUpdates(objects, hasFont, (d) => ({ ...d, fontSize }))
}

export function withBold(objects: CanvasObjectDto[], bold: boolean): ObjectUpdateEntry[] {
  return buildUpdates(objects, hasFont, (d) => ({ ...d, bold }))
}

export function withItalic(objects: CanvasObjectDto[], italic: boolean): ObjectUpdateEntry[] {
  return buildUpdates(objects, hasFont, (d) => ({ ...d, italic }))
}

export function withUnderline(objects: CanvasObjectDto[], underline: boolean): ObjectUpdateEntry[] {
  return buildUpdates(objects, hasFont, (d) => ({ ...d, underline }))
}

export function withStrikethrough(objects: CanvasObjectDto[], strikethrough: boolean): ObjectUpdateEntry[] {
  return buildUpdates(objects, hasFont, (d) => ({ ...d, strikethrough }))
}
