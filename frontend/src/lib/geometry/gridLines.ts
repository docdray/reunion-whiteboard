import type { Viewport } from '../stores/viewportStore.svelte'

export const BASE_GRID_SPACING = 50
/** Mindestabstand zwischen Gitterlinien auf dem Bildschirm (px), bevor die Weltweite verdoppelt wird. */
const MIN_SCREEN_SPACING = 20

export interface VisibleWorldBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface GridLines {
  spacing: number
  verticalX: number[]
  horizontalY: number[]
  bounds: VisibleWorldBounds
}

/** Sichtbarer Weltausschnitt aus Pan/Zoom + Stage-Größe zurückgerechnet. */
export function visibleWorldBounds(viewport: Viewport, stageWidth: number, stageHeight: number): VisibleWorldBounds {
  return {
    // "0 - panX" statt "-panX", damit panX=0 als +0 statt -0 herauskommt (toEqual/Object.is unterscheiden das).
    minX: (0 - viewport.panX) / viewport.scale,
    maxX: (stageWidth - viewport.panX) / viewport.scale,
    minY: (0 - viewport.panY) / viewport.scale,
    maxY: (stageHeight - viewport.panY) / viewport.scale,
  }
}

/** Verdoppelt die Gitterweite so lange, bis der Bildschirmabstand nicht mehr zu eng wird. */
export function gridSpacing(scale: number, baseSpacing: number = BASE_GRID_SPACING): number {
  let spacing = baseSpacing
  while (spacing * scale < MIN_SCREEN_SPACING) {
    spacing *= 2
  }
  return spacing
}

function linesInRange(min: number, max: number, spacing: number): number[] {
  const start = Math.floor(min / spacing) * spacing
  const lines: number[] = []
  for (let v = start; v <= max; v += spacing) {
    lines.push(v)
  }
  return lines
}

/** Positionen (in Weltkoordinaten) aller sichtbaren Gitterlinien für den aktuellen Viewport. */
export function computeGridLines(
  viewport: Viewport,
  stageWidth: number,
  stageHeight: number,
  baseSpacing: number = BASE_GRID_SPACING,
): GridLines {
  const bounds = visibleWorldBounds(viewport, stageWidth, stageHeight)
  const spacing = gridSpacing(viewport.scale, baseSpacing)
  return {
    spacing,
    verticalX: linesInRange(bounds.minX, bounds.maxX, spacing),
    horizontalY: linesInRange(bounds.minY, bounds.maxY, spacing),
    bounds,
  }
}
