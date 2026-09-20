import type { ShapeData, ShapeType } from '../protocol/messages'

export interface PreviewEntry {
  shapeType: ShapeType
  data: ShapeData
}

const DEFAULT_EXPIRY_MS = 1500

/**
 * Live-Vorschauen während des Zeichnens: die eigene (lokal, noch nicht committed)
 * und die der anderen Nutzer (aus draw-preview-relay). Da `object-created` keine
 * userId trägt, können wir eine fremde Vorschau nicht gezielt beim Commit löschen —
 * stattdessen laufen fremde Vorschauen automatisch ab, wenn länger keine
 * Aktualisierung mehr eintrifft (z.B. weil der Nutzer fertig gezeichnet hat).
 */
class PreviewStore {
  own = $state<PreviewEntry | null>(null)
  others = $state<Record<string, PreviewEntry>>({})

  private expiryTimers = new Map<string, ReturnType<typeof setTimeout>>()

  setOwn(entry: PreviewEntry | null): void {
    this.own = entry
  }

  clearOwn(): void {
    this.own = null
  }

  upsertOther(userId: string, entry: PreviewEntry, expiryMs = DEFAULT_EXPIRY_MS): void {
    this.others = { ...this.others, [userId]: entry }
    const existingTimer = this.expiryTimers.get(userId)
    if (existingTimer) clearTimeout(existingTimer)
    this.expiryTimers.set(
      userId,
      setTimeout(() => this.removeOther(userId), expiryMs),
    )
  }

  removeOther(userId: string): void {
    const timer = this.expiryTimers.get(userId)
    if (timer) {
      clearTimeout(timer)
      this.expiryTimers.delete(userId)
    }
    if (!(userId in this.others)) return
    const next = { ...this.others }
    delete next[userId]
    this.others = next
  }

  reset(): void {
    for (const timer of this.expiryTimers.values()) clearTimeout(timer)
    this.expiryTimers.clear()
    this.own = null
    this.others = {}
  }
}

export const previewStore = new PreviewStore()
