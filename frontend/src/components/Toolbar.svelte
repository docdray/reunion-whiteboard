<script lang="ts">
  import { toolStore } from '../lib/stores/toolStore.svelte'
  import { canvasStore } from '../lib/stores/canvasStore.svelte'
  import { selectionStore } from '../lib/stores/selectionStore.svelte'
  import type { ObjectUpdateEntry } from '../lib/protocol/messages'
  import {
    hasFilled,
    hasFont,
    hasStrokeWidth,
    withBold,
    withColor,
    withFilled,
    withFontFamily,
    withFontSize,
    withItalic,
    withStrikethrough,
    withStrokeWidth,
    withUnderline,
  } from '../lib/interaction/selectionStyleEdit'
  import ModeSwitch from './ModeSwitch.svelte'
  import ToolPicker from './ToolPicker.svelte'
  import ColorPicker from './ColorPicker.svelte'
  import StrokeWidthSelector from './StrokeWidthSelector.svelte'
  import FilledToggle from './FilledToggle.svelte'
  import FontDialog from './FontDialog.svelte'
  import DoubleHeadedToggle from './DoubleHeadedToggle.svelte'

  interface Props {
    canvasName: string
    onLeave: () => void
    onCenterView: () => void
    onApplyStyleToSelection: (updates: ObjectUpdateEntry[]) => void
  }

  let { canvasName, onLeave, onCenterView, onApplyStyleToSelection }: Props = $props()

  const isDraw = $derived(toolStore.mode === 'draw')
  const isNavigation = $derived(toolStore.mode === 'navigation')
  const isSelect = $derived(toolStore.mode === 'select')
  const selectedObjects = $derived(canvasStore.objects.filter((o) => selectionStore.selectedIds.has(o.id)))
  const hasSelection = $derived(selectedObjects.length > 0)

  const showColorPicker = $derived(isDraw || (isSelect && hasSelection))
  const showStrokeWidthSelector = $derived(
    isDraw || (isSelect && selectedObjects.some((o) => hasStrokeWidth(o.data))),
  )
  const showFilledToggle = $derived(
    (isDraw &&
      (toolStore.tool === 'rect' ||
        toolStore.tool === 'circle' ||
        toolStore.tool === 'ellipse' ||
        toolStore.tool === 'arrow')) ||
      (isSelect && selectedObjects.some((o) => hasFilled(o.data))),
  )
  const showFontDialog = $derived(
    (isDraw && (toolStore.tool === 'text' || toolStore.tool === 'sticky-note')) ||
      (isSelect && selectedObjects.some((o) => hasFont(o.data))),
  )
  const showDoubleHeadedToggle = $derived(isDraw && toolStore.tool === 'arrow')
  const filledToggleLabel = $derived(toolStore.tool === 'arrow' ? 'Pfeilspitze gefüllt' : 'Gefüllt')

  function applyToSelection(updates: ObjectUpdateEntry[]): void {
    if (updates.length > 0) onApplyStyleToSelection(updates)
  }

  function handleColorChange(color: string): void {
    if (isSelect) applyToSelection(withColor(selectedObjects, color))
  }
  function handleStrokeWidthChange(strokeWidth: number): void {
    if (isSelect) applyToSelection(withStrokeWidth(selectedObjects, strokeWidth))
  }
  function handleFilledChange(filled: boolean): void {
    if (isSelect) applyToSelection(withFilled(selectedObjects, filled))
  }
  function handleFontFamilyChange(fontFamily: string): void {
    if (isSelect) applyToSelection(withFontFamily(selectedObjects, fontFamily))
  }
  function handleFontSizeChange(fontSize: number): void {
    if (isSelect) applyToSelection(withFontSize(selectedObjects, fontSize))
  }
  function handleBoldChange(bold: boolean): void {
    if (isSelect) applyToSelection(withBold(selectedObjects, bold))
  }
  function handleItalicChange(italic: boolean): void {
    if (isSelect) applyToSelection(withItalic(selectedObjects, italic))
  }
  function handleUnderlineChange(underline: boolean): void {
    if (isSelect) applyToSelection(withUnderline(selectedObjects, underline))
  }
  function handleStrikethroughChange(strikethrough: boolean): void {
    if (isSelect) applyToSelection(withStrikethrough(selectedObjects, strikethrough))
  }
</script>

<div class="toolbar">
  <button type="button" class="leave-button" onclick={onLeave}>Canvas "{canvasName}" verlassen</button>

  <ModeSwitch />

  {#if isNavigation}
    <button type="button" onclick={onCenterView}>Zentrieren</button>
  {/if}

  {#if isDraw}
    <ToolPicker />
  {/if}

  {#if showColorPicker}
    <ColorPicker onColorChange={handleColorChange} />
  {/if}
  {#if showStrokeWidthSelector}
    <StrokeWidthSelector onStrokeWidthChange={handleStrokeWidthChange} />
  {/if}
  {#if showFilledToggle}
    <FilledToggle label={filledToggleLabel} onFilledChange={handleFilledChange} />
  {/if}
  {#if isDraw && showDoubleHeadedToggle}
    <DoubleHeadedToggle />
  {/if}
  {#if showFontDialog}
    <FontDialog
      onFontFamilyChange={handleFontFamilyChange}
      onFontSizeChange={handleFontSizeChange}
      onBoldChange={handleBoldChange}
      onItalicChange={handleItalicChange}
      onUnderlineChange={handleUnderlineChange}
      onStrikethroughChange={handleStrikethroughChange}
    />
  {/if}
</div>

<style>
  .toolbar {
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: white;
    padding: 10px;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    max-width: min(90vw, 420px);
  }
</style>
