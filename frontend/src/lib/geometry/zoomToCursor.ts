import type { Viewport } from '../stores/viewportStore.svelte'

export const MIN_SCALE = 0.1
export const MAX_SCALE = 10

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Zoom factor per wheel "tick", direction-aware (scroll down = zoom out). */
export function wheelScaleFactor(deltaY: number): number {
  return deltaY > 0 ? 0.9 : 1 / 0.9
}

/**
 * Computes the new viewport for a zoom centered on `cursor` (in screen coordinates),
 * keeping the world point currently under the cursor at the same screen position.
 */
export function zoomToCursor(viewport: Viewport, cursor: { x: number; y: number }, scaleFactor: number): Viewport {
  const targetScale = clamp(viewport.scale * scaleFactor, MIN_SCALE, MAX_SCALE)
  if (targetScale === viewport.scale) {
    return viewport
  }

  const worldX = (cursor.x - viewport.panX) / viewport.scale
  const worldY = (cursor.y - viewport.panY) / viewport.scale

  return {
    panX: cursor.x - worldX * targetScale,
    panY: cursor.y - worldY * targetScale,
    scale: targetScale,
  }
}
