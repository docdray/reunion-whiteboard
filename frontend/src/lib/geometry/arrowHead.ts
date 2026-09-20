export interface Point {
  x: number
  y: number
}

/** Muss zur Optik von Konva.Arrow passen (dessen Defaults: pointerLength=10, pointerWidth=10). */
export const ARROW_HEAD_POINTER_LENGTH = 10
export const ARROW_HEAD_POINTER_WIDTH = 10

/**
 * Berechnet die zwei Flügelpunkte einer offenen (nur ">"-Chevron, keine Rückseite) Pfeilspitze
 * an `tip`, ausgehend von der Schaftrichtung `tail -> tip`. Spiegelt Konvas eigene interne
 * Pfeilspitzen-Geometrie (Länge/Breite -> Winkel+Distanz), damit gefüllte und offene Pfeile
 * optisch gleich groß wirken.
 */
export function arrowHeadWings(
  tailX: number,
  tailY: number,
  tipX: number,
  tipY: number,
  pointerLength: number = ARROW_HEAD_POINTER_LENGTH,
  pointerWidth: number = ARROW_HEAD_POINTER_WIDTH,
): [Point, Point] {
  const shaftAngle = Math.atan2(tipY - tailY, tipX - tailX)
  const halfWidth = pointerWidth / 2
  const wingDistance = Math.hypot(pointerLength, halfWidth)
  const wingAngleOffset = Math.atan2(halfWidth, pointerLength)
  const backAngle = shaftAngle + Math.PI
  const wing1Angle = backAngle - wingAngleOffset
  const wing2Angle = backAngle + wingAngleOffset
  return [
    { x: tipX + wingDistance * Math.cos(wing1Angle), y: tipY + wingDistance * Math.sin(wing1Angle) },
    { x: tipX + wingDistance * Math.cos(wing2Angle), y: tipY + wingDistance * Math.sin(wing2Angle) },
  ]
}
