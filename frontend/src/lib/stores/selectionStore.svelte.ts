import type { MarqueeRect } from '../interaction/selectMode'

class SelectionStore {
  selectedIds = $state<Set<string>>(new Set())
  moveDelta = $state<{ dx: number; dy: number } | null>(null)
  marqueeRect = $state<MarqueeRect | null>(null)

  has(id: string): boolean {
    return this.selectedIds.has(id)
  }

  /** additive=false ersetzt die Selektion, additive=true toggelt die übergebenen IDs. */
  select(ids: string[], additive: boolean): void {
    if (!additive) {
      this.selectedIds = new Set(ids)
      return
    }
    const next = new Set(this.selectedIds)
    for (const id of ids) {
      if (next.has(id)) next.delete(id)
      else next.add(id)
    }
    this.selectedIds = next
  }

  clear(): void {
    this.selectedIds = new Set()
  }

  removeIds(ids: string[]): void {
    if (this.selectedIds.size === 0) return
    const next = new Set(this.selectedIds)
    let changed = false
    for (const id of ids) {
      if (next.delete(id)) changed = true
    }
    if (changed) this.selectedIds = next
  }

  setMoveDelta(dx: number, dy: number): void {
    this.moveDelta = { dx, dy }
  }

  clearMoveDelta(): void {
    this.moveDelta = null
  }

  setMarqueeRect(rect: MarqueeRect | null): void {
    this.marqueeRect = rect
  }

  reset(): void {
    this.selectedIds = new Set()
    this.moveDelta = null
    this.marqueeRect = null
  }
}

export const selectionStore = new SelectionStore()
