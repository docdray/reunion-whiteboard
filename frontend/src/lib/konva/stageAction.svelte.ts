import Konva from 'konva'
import { canvasStore } from '../stores/canvasStore.svelte'
import { previewStore } from '../stores/previewStore.svelte'
import { viewportStore } from '../stores/viewportStore.svelte'
import { selectionStore } from '../stores/selectionStore.svelte'
import { paddedBoundsForSelection, translateShapeData } from '../geometry/shapeBounds'
import { arrowHeadWings } from '../geometry/arrowHead'
import { computeGridLines } from '../geometry/gridLines'
import { handlePositionsFor, HANDLE_SIZE_PX } from '../interaction/resizeMode'
import type { ArrowShapeData, ShapeData, StickyNoteShapeData } from '../protocol/messages'

const GRID_COLOR = '#e3e3e3'

type VisualNode = Konva.Shape | Konva.Group

const STICKY_NOTE_PADDING = 10

const SELECTION_COLOR = '#4a90d9'
const HANDLE_FILL = '#ffffff'
const HANDLE_HOVER_FILL = SELECTION_COLOR

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
      // Nur der gefüllte Fall nutzt diesen generischen Pfad (Konva.Arrow); der offene Fall
      // wird als Konva.Group (Schaft + Chevron-Linien) separat behandelt, siehe unten.
      return {
        points: [data.x1, data.y1, data.x2, data.y2],
        stroke: data.color,
        strokeWidth: data.strokeWidth,
        fill: data.color,
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
    case 'sticky-note':
      // Wird nie tatsächlich genutzt (Notizzettel ist immer eine Konva.Group aus Rect+Text,
      // siehe createStickyNoteGroup) — nur für die Exhaustivität der Switch nötig.
      return {}
  }
}

function isOpenArrow(data: ShapeData): data is ArrowShapeData {
  return data.type === 'arrow' && !data.filled
}

/** ">"-Chevron aus GENAU zwei Linien (keine Rückseite), im Gegensatz zum geschlossenen Dreiecks-Umriss. */
function buildChevron(tailX: number, tailY: number, tipX: number, tipY: number, stroke: string, strokeWidth: number): Konva.Line {
  const [wing1, wing2] = arrowHeadWings(tailX, tailY, tipX, tipY)
  return new Konva.Line({
    points: [wing1.x, wing1.y, tipX, tipY, wing2.x, wing2.y],
    stroke,
    strokeWidth,
    lineCap: 'round',
    lineJoin: 'round',
  })
}

function updateChevron(line: Konva.Line, tailX: number, tailY: number, tipX: number, tipY: number, stroke: string, strokeWidth: number): void {
  const [wing1, wing2] = arrowHeadWings(tailX, tailY, tipX, tipY)
  line.points([wing1.x, wing1.y, tipX, tipY, wing2.x, wing2.y])
  line.stroke(stroke)
  line.strokeWidth(strokeWidth)
}

function createOpenArrowGroup(data: ArrowShapeData): Konva.Group {
  const group = new Konva.Group()
  const shaft = new Konva.Line({
    points: [data.x1, data.y1, data.x2, data.y2],
    stroke: data.color,
    strokeWidth: data.strokeWidth,
    name: 'shaft',
  })
  group.add(shaft)

  const endChevron = buildChevron(data.x1, data.y1, data.x2, data.y2, data.color, data.strokeWidth)
  endChevron.name('chevron-end')
  group.add(endChevron)

  if (data.doubleHeaded) {
    const beginChevron = buildChevron(data.x2, data.y2, data.x1, data.y1, data.color, data.strokeWidth)
    beginChevron.name('chevron-begin')
    group.add(beginChevron)
  }
  return group
}

function updateOpenArrowGroup(group: Konva.Group, data: ArrowShapeData): void {
  const shaft = group.findOne<Konva.Line>('.shaft')
  if (shaft) {
    shaft.points([data.x1, data.y1, data.x2, data.y2])
    shaft.stroke(data.color)
    shaft.strokeWidth(data.strokeWidth)
  }

  const endChevron = group.findOne<Konva.Line>('.chevron-end')
  if (endChevron) {
    updateChevron(endChevron, data.x1, data.y1, data.x2, data.y2, data.color, data.strokeWidth)
  }

  const beginChevron = group.findOne<Konva.Line>('.chevron-begin')
  if (data.doubleHeaded && !beginChevron) {
    const created = buildChevron(data.x2, data.y2, data.x1, data.y1, data.color, data.strokeWidth)
    created.name('chevron-begin')
    group.add(created)
  } else if (data.doubleHeaded && beginChevron) {
    updateChevron(beginChevron, data.x2, data.y2, data.x1, data.y1, data.color, data.strokeWidth)
  } else if (!data.doubleHeaded && beginChevron) {
    beginChevron.destroy()
  }
}

function isStickyNote(data: ShapeData): data is StickyNoteShapeData {
  return data.type === 'sticky-note'
}

function stickyNoteTextConfig(data: StickyNoteShapeData): Record<string, unknown> {
  const textDecoration = [data.underline ? 'underline' : '', data.strikethrough ? 'line-through' : '']
    .filter(Boolean)
    .join(' ')
  const fontStyle = [data.italic ? 'italic' : '', data.bold ? 'bold' : ''].filter(Boolean).join(' ') || 'normal'
  return {
    x: data.x + STICKY_NOTE_PADDING,
    y: data.y + STICKY_NOTE_PADDING,
    width: Math.max(data.width - STICKY_NOTE_PADDING * 2, 0),
    height: Math.max(data.height - STICKY_NOTE_PADDING * 2, 0),
    text: data.content,
    fontFamily: data.fontFamily,
    fontSize: data.fontSize,
    fill: data.textColor,
    fontStyle,
    textDecoration,
    wrap: 'word',
  }
}

function createStickyNoteGroup(data: StickyNoteShapeData): Konva.Group {
  const group = new Konva.Group()
  const background = new Konva.Rect({
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    fill: data.color,
    cornerRadius: 4,
    shadowColor: 'black',
    shadowBlur: 6,
    shadowOpacity: 0.25,
    shadowOffset: { x: 2, y: 2 },
    name: 'background',
  })
  group.add(background)
  const label = new Konva.Text({ ...stickyNoteTextConfig(data), name: 'label' })
  group.add(label)
  return group
}

function updateStickyNoteGroup(group: Konva.Group, data: StickyNoteShapeData): void {
  const background = group.findOne<Konva.Rect>('.background')
  if (background) {
    background.setAttrs({ x: data.x, y: data.y, width: data.width, height: data.height, fill: data.color })
  }
  const label = group.findOne<Konva.Text>('.label')
  if (label) {
    label.setAttrs(stickyNoteTextConfig(data))
  }
}

function createNode(data: ShapeData, config: Record<string, unknown>): VisualNode {
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
      return isOpenArrow(data) ? createOpenArrowGroup(data) : new Konva.Arrow(config)
    case 'text':
      return new Konva.Text(config)
    case 'sticky-note':
      return createStickyNoteGroup(data)
  }
}

/** Aktualisiert einen bestehenden Node in-place; baut bei Bedarf (Gruppe <-> anderer Typ) neu. */
function syncNode(
  layer: Konva.Layer,
  map: Map<string, VisualNode>,
  key: string,
  data: ShapeData,
  applyStyle: (node: VisualNode) => void,
): void {
  const existing = map.get(key)
  const wantsGroup = isOpenArrow(data) || isStickyNote(data)
  const existingIsGroup = existing instanceof Konva.Group

  if (existing && wantsGroup === existingIsGroup) {
    if (isOpenArrow(data)) {
      updateOpenArrowGroup(existing as Konva.Group, data)
    } else if (isStickyNote(data)) {
      updateStickyNoteGroup(existing as Konva.Group, data)
    } else {
      existing.setAttrs(configFor(data))
    }
    applyStyle(existing)
    return
  }

  if (existing) {
    existing.destroy()
  }
  const created = isOpenArrow(data)
    ? createOpenArrowGroup(data)
    : isStickyNote(data)
      ? createStickyNoteGroup(data)
      : createNode(data, configFor(data))
  map.set(key, created)
  layer.add(created)
  applyStyle(created)
}

export function konvaStage(node: HTMLDivElement): { destroy(): void } {
  const stage = new Konva.Stage({
    container: node,
    width: node.clientWidth,
    height: node.clientHeight,
  })
  const gridLayer = new Konva.Layer({ listening: false })
  const gridShape = new Konva.Shape({
    listening: false,
    stroke: GRID_COLOR,
    strokeWidth: 1,
    strokeScaleEnabled: false,
    sceneFunc: (ctx, shape) => {
      const { verticalX, horizontalY, bounds } = computeGridLines(
        { panX: viewportStore.panX, panY: viewportStore.panY, scale: viewportStore.scale },
        stage.width(),
        stage.height(),
      )
      ctx.beginPath()
      for (const x of verticalX) {
        ctx.moveTo(x, bounds.minY)
        ctx.lineTo(x, bounds.maxY)
      }
      for (const y of horizontalY) {
        ctx.moveTo(bounds.minX, y)
        ctx.lineTo(bounds.maxX, y)
      }
      ctx.strokeShape(shape)
    },
  })
  gridLayer.add(gridShape)
  stage.add(gridLayer)

  const layer = new Konva.Layer()
  stage.add(layer)

  const selectionLayer = new Konva.Layer({ listening: false })
  stage.add(selectionLayer)

  const handlesLayer = new Konva.Layer({ listening: false })
  stage.add(handlesLayer)

  const nodesById = new Map<string, VisualNode>()
  const previewNodesByKey = new Map<string, VisualNode>()
  const selectionRectsById = new Map<string, Konva.Rect>()
  const handleRectsById = new Map<string, Konva.Rect>()

  function applyPreviewStyle(node: VisualNode): void {
    node.opacity(0.6)
    if (node instanceof Konva.Group) {
      for (const child of node.getChildren()) {
        if (child instanceof Konva.Line) child.dash([6, 4])
      }
    } else {
      (node as Konva.Shape).dash([6, 4])
    }
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
      gridLayer.batchDraw()
      selectionLayer.batchDraw()
      handlesLayer.batchDraw()
    })

    $effect(() => {
      const current = canvasStore.objects
      const selected = selectionStore.selectedIds
      const moveDelta = selectionStore.moveDelta
      const resizePreview = selectionStore.resizePreview
      const seen = new Set<string>()
      for (const obj of current) {
        seen.add(obj.id)
        const isSelected = selected.has(obj.id)
        let data = obj.data
        if (isSelected && moveDelta) data = translateShapeData(data, moveDelta.dx, moveDelta.dy)
        if (resizePreview && resizePreview.id === obj.id) data = resizePreview.data
        syncNode(layer, nodesById, obj.id, data, () => {})

        if (isSelected) {
          const b = paddedBoundsForSelection(data)
          const rectConfig = {
            x: b.minX,
            y: b.minY,
            width: b.maxX - b.minX,
            height: b.maxY - b.minY,
            stroke: SELECTION_COLOR,
            strokeWidth: 2,
            dash: [4, 3],
            strokeScaleEnabled: false,
            listening: false,
          }
          const existingRect = selectionRectsById.get(obj.id)
          if (existingRect) {
            existingRect.setAttrs(rectConfig)
          } else {
            const rect = new Konva.Rect(rectConfig)
            selectionRectsById.set(obj.id, rect)
            selectionLayer.add(rect)
          }
        } else {
          const existingRect = selectionRectsById.get(obj.id)
          if (existingRect) {
            existingRect.destroy()
            selectionRectsById.delete(obj.id)
          }
        }
      }
      for (const [id, konvaNode] of nodesById) {
        if (!seen.has(id)) {
          konvaNode.destroy()
          nodesById.delete(id)
        }
      }
      for (const [id, rect] of selectionRectsById) {
        if (!seen.has(id)) {
          rect.destroy()
          selectionRectsById.delete(id)
        }
      }
      layer.batchDraw()
      selectionLayer.batchDraw()
    })

    $effect(() => {
      const selected = selectionStore.selectedIds
      const moveDelta = selectionStore.moveDelta
      const resizePreview = selectionStore.resizePreview
      const hoveredId = selectionStore.hoveredHandleId
      const scale = viewportStore.scale
      const sizeWorld = HANDLE_SIZE_PX / scale

      let handles: Array<{ id: string; x: number; y: number }> = []
      if (selected.size === 1) {
        const [id] = selected
        const obj = canvasStore.objects.find((o) => o.id === id)
        if (obj) {
          let data = resizePreview && resizePreview.id === id ? resizePreview.data : obj.data
          if (moveDelta) data = translateShapeData(data, moveDelta.dx, moveDelta.dy)
          handles = handlePositionsFor(data)
        }
      }

      const seen = new Set<string>()
      for (const h of handles) {
        seen.add(h.id)
        const isHovered = hoveredId === h.id
        const config = {
          x: h.x - sizeWorld / 2,
          y: h.y - sizeWorld / 2,
          width: sizeWorld,
          height: sizeWorld,
          fill: isHovered ? HANDLE_HOVER_FILL : HANDLE_FILL,
          stroke: SELECTION_COLOR,
          strokeWidth: 1,
          strokeScaleEnabled: false,
          listening: false,
        }
        const existing = handleRectsById.get(h.id)
        if (existing) {
          existing.setAttrs(config)
        } else {
          const rect = new Konva.Rect(config)
          handleRectsById.set(h.id, rect)
          handlesLayer.add(rect)
        }
      }
      for (const [id, rect] of handleRectsById) {
        if (!seen.has(id)) {
          rect.destroy()
          handleRectsById.delete(id)
        }
      }
      handlesLayer.batchDraw()
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
        syncNode(layer, previewNodesByKey, key, data, (n) => {
          applyPreviewStyle(n)
          n.moveToTop()
        })
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
