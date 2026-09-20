export interface Viewport {
  panX: number
  panY: number
  scale: number
}

class ViewportStore {
  panX = $state(0)
  panY = $state(0)
  scale = $state(1)

  setViewport(next: Viewport): void {
    this.panX = next.panX
    this.panY = next.panY
    this.scale = next.scale
  }

  pan(dx: number, dy: number): void {
    this.panX += dx
    this.panY += dy
  }
}

export const viewportStore = new ViewportStore()
