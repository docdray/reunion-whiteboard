import type { CanvasObjectDto, ShapeData } from '../protocol/messages'
import { hasFilled, hasFont, hasStrokeWidth, hasTextColor } from './selectionStyleEdit'

/**
 * Bestimmt deterministisch das "repräsentative" Objekt einer Selektion: das erste Objekt in
 * Einfüge-/z-Reihenfolge (`objects` ist bereits nach `sequence` sortiert), dessen id selektiert ist.
 * Bei Einzelselektion ist das exakt das eine selektierte Objekt; bei Mehrfachselektion eine bewusste
 * Vereinfachung ohne "gemischte Werte"-Erkennung.
 */
export function pickRepresentativeObject(
  objects: CanvasObjectDto[],
  selectedIds: Set<string>,
): CanvasObjectDto | null {
  for (const obj of objects) {
    if (selectedIds.has(obj.id)) return obj
  }
  return null
}

export interface ToolStoreValues {
  color: string
  strokeWidth?: number
  filled?: boolean
  fontFamily?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  textColor?: string
}

/** Liefert nur die Felder, die der jeweilige Shape-Typ tatsächlich besitzt (keine Defaults für fehlende Felder). */
export function toolStoreValuesFrom(data: ShapeData): ToolStoreValues {
  const values: ToolStoreValues = { color: data.color }
  if (hasStrokeWidth(data)) values.strokeWidth = data.strokeWidth
  if (hasFilled(data)) values.filled = data.filled
  if (hasFont(data)) {
    values.fontFamily = data.fontFamily
    values.fontSize = data.fontSize
    values.bold = data.bold
    values.italic = data.italic
    values.underline = data.underline
    values.strikethrough = data.strikethrough
  }
  if (hasTextColor(data)) values.textColor = data.textColor
  return values
}
