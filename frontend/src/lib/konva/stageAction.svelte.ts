import Konva from 'konva'
import { canvasStore } from '../stores/canvasStore.svelte'
import { viewportStore } from '../stores/viewportStore.svelte'
import type { CanvasObjectDto } from '../protocol/messages'

function configFor(obj: CanvasObjectDto): Record<string, unknown> {
  const data = obj.data
  switch (data.type) {
    case 'freehand':
      return {
        points: data.points.flatMap((p) => [p.x, p.y]),
        stroke: data.color,
        strokeWidth: data.strokeWidth,
        lineCap: 'round',
        lineJoin: 'round',
      }
    case 'line':
      return {
        points: [data.x1, data.y1, data.x2, data.y2],
        stroke: data.color,
        strokeWidth: data.strokeWidth,
      }
    case 'rect':
      return {
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        stroke: data.color,
        strokeWidth: data.strokeWidth,
        fill: data.filled ? data.color : null,
      }
    case 'circle':
      return {
        x: data.x,
        y: data.y,
        radius: data.radius,
        stroke: data.color,
        strokeWidth: data.strokeWidth,
        fill: data.filled ? data.color : null,
      }
    case 'ellipse':
      return {
        x: data.x,
        y: data.y,
        radiusX: data.radiusX,
        radiusY: data.radiusY,
        stroke: data.color,
        strokeWidth: data.strokeWidth,
        fill: data.filled ? data.color : null,
      }
    case 'text': {
      const textDecoration = [data.underline ? 'underline' : '', data.strikethrough ? 'line-through' : '']
        .filter(Boolean)
        .join(' ')
      const fontStyle = [data.italic ? 'italic' : '', data.bold ? 'bold' : ''].filter(Boolean).join(' ') || 'normal'
      return {
        x: data.x,
        y: data.y,
        text: data.content,
        fontFamily: data.fontFamily,
        fontSize: data.fontSize,
        fill: data.color,
        fontStyle,
        textDecoration,
      }
    }
  }
}

function createNode(obj: CanvasObjectDto): Konva.Shape {
  const config = configFor(obj)
  switch (obj.data.type) {
    case 'freehand':
    case 'line':
      return new Konva.Line(config)
    case 'rect':
      return new Konva.Rect(config)
    case 'circle':
      return new Konva.Circle(config)
    case 'ellipse':
      return new Konva.Ellipse(config)
    case 'text':
      return new Konva.Text(config)
  }
}

export function konvaStage(node: HTMLDivElement): { destroy(): void } {
  const stage = new Konva.Stage({
    container: node,
    width: node.clientWidth,
    height: node.clientHeight,
  })
  const layer = new Konva.Layer()
  stage.add(layer)

  const nodesById = new Map<string, Konva.Shape>()

  function resize(): void {
    stage.width(node.clientWidth)
    stage.height(node.clientHeight)
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(node)

  const stopEffects = $effect.root(() => {
    $effect(() => {
      stage.x(viewportStore.panX)
      stage.y(viewportStore.panY)
      stage.scale({ x: viewportStore.scale, y: viewportStore.scale })
      layer.batchDraw()
    })

    $effect(() => {
      const current = canvasStore.objects
      const seen = new Set<string>()
      for (const obj of current) {
        seen.add(obj.id)
        const existing = nodesById.get(obj.id)
        if (existing) {
          existing.setAttrs(configFor(obj))
        } else {
          const created = createNode(obj)
          nodesById.set(obj.id, created)
          layer.add(created)
        }
      }
      for (const [id, konvaNode] of nodesById) {
        if (!seen.has(id)) {
          konvaNode.destroy()
          nodesById.delete(id)
        }
      }
      layer.batchDraw()
    })
  })

  return {
    destroy(): void {
      stopEffects()
      resizeObserver.disconnect()
      stage.destroy()
    },
  }
}
