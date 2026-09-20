import Konva from 'konva'
import { canvasStore } from '../stores/canvasStore.svelte'
import { previewStore } from '../stores/previewStore.svelte'
import { viewportStore } from '../stores/viewportStore.svelte'
import { selectionStore } from '../stores/selectionStore.svelte'
import { translateShapeData } from '../geometry/shapeBounds'
import type { ShapeData } from '../protocol/messages'

function withSelectionStyle(config: Record<string, unknown>, selected: boolean): Record<string, unknown> {
  return {
    ...config,
    shadowColor: '#4a90d9',
    shadowBlur: selected ? 10 : 0,
    shadowOpacity: selected ? 0.9 : 0,
    shadowEnabled: selected,
  }
}

function configFor(data: ShapeData): Record<string, unknown> {
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
    case 'arrow':
      return {
        points: [data.x1, data.y1, data.x2, data.y2],
        stroke: data.color,
        strokeWidth: data.strokeWidth,
        fill: data.color,
        fillEnabled: data.filled,
        pointerAtBeginning: data.doubleHeaded,
        pointerAtEnding: true,
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

function createNode(data: ShapeData, config: Record<string, unknown>): Konva.Shape {
  switch (data.type) {
    case 'freehand':
    case 'line':
      return new Konva.Line(config)
    case 'rect':
      return new Konva.Rect(config)
    case 'circle':
      return new Konva.Circle(config)
    case 'ellipse':
      return new Konva.Ellipse(config)
    case 'arrow':
      return new Konva.Arrow(config)
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
  const previewNodesByKey = new Map<string, Konva.Shape>()

  function applyPreviewStyle(shape: Konva.Shape): void {
    shape.opacity(0.6)
    shape.dash([6, 4])
  }

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
      const selected = selectionStore.selectedIds
      const moveDelta = selectionStore.moveDelta
      const seen = new Set<string>()
      for (const obj of current) {
        seen.add(obj.id)
        const isSelected = selected.has(obj.id)
        const data = isSelected && moveDelta ? translateShapeData(obj.data, moveDelta.dx, moveDelta.dy) : obj.data
        const config = withSelectionStyle(configFor(data), isSelected)
        const existing = nodesById.get(obj.id)
        if (existing) {
          existing.setAttrs(config)
        } else {
          const created = createNode(data, config)
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

    $effect(() => {
      const entries: Array<[string, ShapeData]> = []
      if (previewStore.own) entries.push(['own', previewStore.own.data])
      for (const [userId, entry] of Object.entries(previewStore.others)) {
        entries.push([userId, entry.data])
      }

      const seen = new Set<string>()
      for (const [key, data] of entries) {
        seen.add(key)
        const existing = previewNodesByKey.get(key)
        if (existing) {
          existing.setAttrs(configFor(data))
          existing.moveToTop()
        } else {
          const created = createNode(data, configFor(data))
          applyPreviewStyle(created)
          previewNodesByKey.set(key, created)
          layer.add(created)
          created.moveToTop()
        }
      }
      for (const [key, konvaNode] of previewNodesByKey) {
        if (!seen.has(key)) {
          konvaNode.destroy()
          previewNodesByKey.delete(key)
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
