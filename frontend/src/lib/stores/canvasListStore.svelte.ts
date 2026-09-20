import { createCanvas, deleteCanvas, listCanvases } from '../api/canvasApi'
import type { CanvasSummaryDto } from '../protocol/messages'

class CanvasListStore {
  canvases = $state<CanvasSummaryDto[]>([])
  loading = $state(false)
  error = $state<string | null>(null)

  async refresh(): Promise<void> {
    this.loading = true
    this.error = null
    try {
      this.canvases = await listCanvases()
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e)
    } finally {
      this.loading = false
    }
  }

  async create(name: string): Promise<CanvasSummaryDto> {
    const created = await createCanvas(name)
    this.canvases = [...this.canvases, created]
    return created
  }

  async remove(id: string): Promise<void> {
    await deleteCanvas(id)
    this.canvases = this.canvases.filter((c) => c.id !== id)
  }
}

export const canvasListStore = new CanvasListStore()
