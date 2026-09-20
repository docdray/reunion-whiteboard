import type { Bounds } from './shapeBounds'
import type { Viewport } from '../stores/viewportStore.svelte'
import { MIN_SCALE, MAX_SCALE, clamp } from './zoomToCursor'

/** Anteil der Stage-Fläche, den die Bounding-Box maximal einnehmen soll (Rest = Rand). */
const FIT_FACTOR = 0.85

/**
 * Berechnet den Viewport, der `bounds` zentriert und vollständig sichtbar einpasst.
 * Bei `bounds === null` (leerer Canvas) wird die Standardansicht (scale=1, Weltursprung mittig) geliefert.
 */
export function centerView(bounds: Bounds | null, stageWidth: number, stageHeight: number): Viewport {
  if (!bounds) {
    return { panX: stageWidth / 2, panY: stageHeight / 2, scale: 1 }
  }

  const width = Math.max(bounds.maxX - bounds.minX, 1e-6)
  const height = Math.max(bounds.maxY - bounds.minY, 1e-6)
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2

  const scaleX = (stageWidth * FIT_FACTOR) / width
  const scaleY = (stageHeight * FIT_FACTOR) / height
  const scale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, MAX_SCALE)

  return {
    panX: stageWidth / 2 - centerX * scale,
    panY: stageHeight / 2 - centerY * scale,
    scale,
  }
}
