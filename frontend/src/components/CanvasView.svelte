<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { connectCanvasSocket, type CanvasSocket } from '../lib/api/ws'
  import { canvasStore } from '../lib/stores/canvasStore.svelte'
  import { presenceStore } from '../lib/stores/presenceStore.svelte'
  import { previewStore } from '../lib/stores/previewStore.svelte'
  import { viewportStore } from '../lib/stores/viewportStore.svelte'
  import { toolStore } from '../lib/stores/toolStore.svelte'
  import { selectionStore } from '../lib/stores/selectionStore.svelte'
  import { konvaStage } from '../lib/konva/stageAction.svelte'
  import { zoomToCursor, wheelScaleFactor } from '../lib/geometry/zoomToCursor'
  import { DrawInteraction } from '../lib/interaction/drawMode'
  import { SelectInteraction } from '../lib/interaction/selectMode'
  import Toolbar from './Toolbar.svelte'

  interface Props {
    canvasId: string
    canvasName: string
    displayName: string
    onLeave: () => void
  }

  let { canvasId, canvasName, displayName, onLeave }: Props = $props()

  let containerEl: HTMLDivElement
  let socket: CanvasSocket | null = null
  let isPanning = false
  let lastPointer = { x: 0, y: 0 }
  let lastCursorSendAt = 0
  let lastDrawPreviewSendAt = 0

  const CURSOR_SEND_INTERVAL_MS = 50
  const DRAW_PREVIEW_SEND_INTERVAL_MS = 50

  function screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - viewportStore.panX) / viewportStore.scale,
      y: (screenY - viewportStore.panY) / viewportStore.scale,
    }
  }

  const drawInteraction = new DrawInteraction({
    getSettings: () => toolStore.drawSettings,
    onPreviewUpdate: (shapeType, data) => {
      previewStore.setOwn({ shapeType, data })
      const now = Date.now()
      if (now - lastDrawPreviewSendAt >= DRAW_PREVIEW_SEND_INTERVAL_MS) {
        lastDrawPreviewSendAt = now
        socket?.send({ type: 'draw-preview', shapeType, data })
      }
    },
    onPreviewClear: () => previewStore.clearOwn(),
    onCommit: (shapeType, data) => {
      socket?.send({ type: 'object-create', shapeType, data })
    },
    requestTextContent: () => window.prompt('Text eingeben:'),
  })

  const selectInteraction = new SelectInteraction({
    getObjects: () => canvasStore.objects,
    getSelectedIds: () => selectionStore.selectedIds,
    select: (ids, additive) => selectionStore.select(ids, additive),
    onMovePreview: (dx, dy) => selectionStore.setMoveDelta(dx, dy),
    onMovePreviewClear: () => selectionStore.clearMoveDelta(),
    onMoveCommit: (updates) => socket?.send({ type: 'object-update', objects: updates }),
    onMarqueeChange: (rect) => selectionStore.setMarqueeRect(rect),
  })

  function isEditableTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (toolStore.mode !== 'select') return
    if (event.key !== 'Delete' && event.key !== 'Backspace') return
    if (isEditableTarget(event.target)) return
    const ids = [...selectionStore.selectedIds]
    if (ids.length === 0) return
    event.preventDefault()
    socket?.send({ type: 'object-delete', ids })
  }

  onMount(() => {
    canvasStore.reset()
    presenceStore.reset()
    previewStore.reset()
    selectionStore.reset()
    viewportStore.setViewport({ panX: 0, panY: 0, scale: 1 })
    window.addEventListener('keydown', handleKeyDown)

    socket = connectCanvasSocket(canvasId, displayName)
    socket.onMessage((msg) => {
      switch (msg.type) {
        case 'initial-state':
          canvasStore.setInitial(msg.objects)
          presenceStore.setInitial(msg.users)
          break
        case 'user-joined':
          presenceStore.upsert({ userId: msg.userId, displayName: msg.displayName, color: msg.color })
          break
        case 'user-left':
          presenceStore.remove(msg.userId)
          previewStore.removeOther(msg.userId)
          break
        case 'presence-update':
          presenceStore.updateCursor(msg.userId, msg.x, msg.y)
          break
        case 'object-created':
          canvasStore.upsert(msg.obj)
          break
        case 'object-updated':
          canvasStore.upsertMany(msg.objects)
          break
        case 'object-deleted':
          canvasStore.remove(msg.ids)
          selectionStore.removeIds(msg.ids)
          break
        case 'draw-preview-relay':
          previewStore.upsertOther(msg.userId, { shapeType: msg.shapeType, data: msg.data })
          break
      }
    })
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown)
    socket?.close()
    canvasStore.reset()
    presenceStore.reset()
    previewStore.reset()
    selectionStore.reset()
  })

  function handleWheel(event: WheelEvent): void {
    event.preventDefault()
    const rect = containerEl.getBoundingClientRect()
    const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const next = zoomToCursor(
      { panX: viewportStore.panX, panY: viewportStore.panY, scale: viewportStore.scale },
      cursor,
      wheelScaleFactor(event.deltaY),
    )
    viewportStore.setViewport(next)
  }

  function handlePointerDown(event: PointerEvent): void {
    containerEl.setPointerCapture(event.pointerId)
    const rect = containerEl.getBoundingClientRect()
    const world = screenToWorld(event.clientX - rect.left, event.clientY - rect.top)

    if (toolStore.mode === 'draw') {
      drawInteraction.pointerDown(toolStore.tool, world)
      return
    }

    if (toolStore.mode === 'select') {
      selectInteraction.pointerDown(world, event.ctrlKey || event.metaKey)
      return
    }

    isPanning = true
    lastPointer = { x: event.clientX, y: event.clientY }
  }

  function handlePointerMove(event: PointerEvent): void {
    const rect = containerEl.getBoundingClientRect()
    const world = screenToWorld(event.clientX - rect.left, event.clientY - rect.top)

    const now = Date.now()
    if (now - lastCursorSendAt >= CURSOR_SEND_INTERVAL_MS) {
      lastCursorSendAt = now
      socket?.send({ type: 'cursor-move', x: world.x, y: world.y })
    }

    if (toolStore.mode === 'draw' && drawInteraction.isDragging) {
      drawInteraction.pointerMove(world)
      return
    }

    if (toolStore.mode === 'select') {
      selectInteraction.pointerMove(world)
      return
    }

    if (isPanning) {
      const dx = event.clientX - lastPointer.x
      const dy = event.clientY - lastPointer.y
      lastPointer = { x: event.clientX, y: event.clientY }
      viewportStore.pan(dx, dy)
    }
  }

  function handlePointerUp(event: PointerEvent): void {
    containerEl.releasePointerCapture(event.pointerId)

    const rect = containerEl.getBoundingClientRect()
    const world = screenToWorld(event.clientX - rect.left, event.clientY - rect.top)

    if (toolStore.mode === 'draw' && drawInteraction.isDragging) {
      drawInteraction.pointerUp(world)
      return
    }

    if (toolStore.mode === 'select') {
      selectInteraction.pointerUp(world)
      return
    }

    isPanning = false
  }

  const remoteCursors = $derived(
    Object.values(presenceStore.users).filter((u) => u.cursorX != null && u.cursorY != null),
  )

  function marqueeStyle(rect: { x: number; y: number; width: number; height: number }): string {
    const left = rect.x * viewportStore.scale + viewportStore.panX
    const top = rect.y * viewportStore.scale + viewportStore.panY
    const width = rect.width * viewportStore.scale
    const height = rect.height * viewportStore.scale
    return `left:${left}px; top:${top}px; width:${width}px; height:${height}px;`
  }
</script>

<div
  bind:this={containerEl}
  class="canvas-container"
  role="application"
  use:konvaStage
  onwheel={handleWheel}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
>
  {#each remoteCursors as user (user.userId)}
    <div
      class="remote-cursor"
      style={`left:${(user.cursorX ?? 0) * viewportStore.scale + viewportStore.panX}px; top:${(user.cursorY ?? 0) * viewportStore.scale + viewportStore.panY}px; --cursor-color:${user.color}`}
    >
      <span class="remote-cursor-label">{user.displayName}</span>
    </div>
  {/each}
  {#if selectionStore.marqueeRect}
    <div class="marquee" style={marqueeStyle(selectionStore.marqueeRect)}></div>
  {/if}
</div>

<Toolbar {canvasName} {onLeave} />

<style>
  .canvas-container {
    position: fixed;
    inset: 0;
    overflow: hidden;
    touch-action: none;
    background: #f5f5f5;
  }

  .remote-cursor {
    position: fixed;
    pointer-events: none;
    z-index: 5;
    transform: translate(-2px, -2px);
  }

  .remote-cursor::before {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--cursor-color, #333);
  }

  .marquee {
    position: fixed;
    pointer-events: none;
    z-index: 4;
    border: 1px dashed #4a90d9;
    background: rgba(74, 144, 217, 0.1);
  }

  .remote-cursor-label {
    position: absolute;
    left: 12px;
    top: -4px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    color: white;
    background: var(--cursor-color, #333);
    white-space: nowrap;
  }
</style>
