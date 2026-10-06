import type { CanvasObjectDto, ObjectUpdateEntry, PointDto, ShapeData } from '../protocol/messages'
import { hitTest } from './selectMode'

type EditableType = 'text' | 'sticky-note'

function isEditable(data: ShapeData): data is Extract<ShapeData, { type: EditableType }> {
  return data.type === 'text' || data.type === 'sticky-note'
}

/** Liefert das oberste Objekt unter `point`, falls es ein bearbeitbarer Typ (text/sticky-note) ist, sonst `null`. */
export function findEditableTextObject(objects: CanvasObjectDto[], point: PointDto): CanvasObjectDto | null {
  const hit = hitTest(objects, point)
  if (!hit || !isEditable(hit.data)) return null
  return hit
}

/** Fragt über `requestEditedContent` den neuen Text ab und baut bei einer echten Änderung ein Update-Objekt. */
export function buildContentUpdate(
  obj: CanvasObjectDto,
  requestEditedContent: (current: string) => string | null,
): ObjectUpdateEntry | null {
  if (!isEditable(obj.data)) return null
  const next = requestEditedContent(obj.data.content)
  if (next == null || next === obj.data.content) return null
  return { id: obj.id, data: { ...obj.data, content: next } }
}
