import { boundsIntersect, type Bounds } from './shapeBounds'
import type { Viewport } from '../stores/viewportStore.svelte'

export interface OffscreenEdges {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
}

/**
 * Ermittelt, an welchen Rändern der Ansicht Objekte liegen, die gerade komplett unsichtbar sind.
 * Ein Objekt schräg außerhalb (z. B. oben links) markiert beide betroffenen Ränder.
 */
export function offscreenEdges(
  objectBounds: Bounds[],
  viewport: Viewport,
  stageWidth: number,
  stageHeight: number,
): OffscreenEdges {
  const view: Bounds = {
    minX: -viewport.panX / viewport.scale,
    minY: -viewport.panY / viewport.scale,
    maxX: (stageWidth - viewport.panX) / viewport.scale,
    maxY: (stageHeight - viewport.panY) / viewport.scale,
  }
  const edges: OffscreenEdges = { top: false, right: false, bottom: false, left: false }
  for (const b of objectBounds) {
    if (boundsIntersect(b, view)) continue
    if (b.maxY < view.minY) edges.top = true
    if (b.minY > view.maxY) edges.bottom = true
    if (b.maxX < view.minX) edges.left = true
    if (b.minX > view.maxX) edges.right = true
  }
  return edges
}
