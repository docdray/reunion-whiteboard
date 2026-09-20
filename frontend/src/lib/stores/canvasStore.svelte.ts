import type { CanvasObjectDto } from '../protocol/messages'

function bySequence(a: CanvasObjectDto, b: CanvasObjectDto): number {
  return a.sequence - b.sequence
}

class CanvasStore {
  objects = $state<CanvasObjectDto[]>([])

  setInitial(objects: CanvasObjectDto[]): void {
    this.objects = [...objects].sort(bySequence)
  }

  upsert(obj: CanvasObjectDto): void {
    const index = this.objects.findIndex((o) => o.id === obj.id)
    const next = [...this.objects]
    if (index === -1) {
      next.push(obj)
    } else {
      next[index] = obj
    }
    this.objects = next.sort(bySequence)
  }

  upsertMany(objs: CanvasObjectDto[]): void {
    for (const obj of objs) this.upsert(obj)
  }

  remove(ids: string[]): void {
    const idSet = new Set(ids)
    this.objects = this.objects.filter((o) => !idSet.has(o.id))
  }

  reset(): void {
    this.objects = []
  }
}

export const canvasStore = new CanvasStore()
