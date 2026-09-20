<script lang="ts">
  import { toolStore } from '../lib/stores/toolStore.svelte'
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
  }

  let { canvasName, onLeave, onCenterView }: Props = $props()

  const isDraw = $derived(toolStore.mode === 'draw')
  const isNavigation = $derived(toolStore.mode === 'navigation')
  const showFilledToggle = $derived(
    isDraw &&
      (toolStore.tool === 'rect' ||
        toolStore.tool === 'circle' ||
        toolStore.tool === 'ellipse' ||
        toolStore.tool === 'arrow'),
  )
  const showFontDialog = $derived(isDraw && (toolStore.tool === 'text' || toolStore.tool === 'sticky-note'))
  const showDoubleHeadedToggle = $derived(isDraw && toolStore.tool === 'arrow')
  const filledToggleLabel = $derived(toolStore.tool === 'arrow' ? 'Pfeilspitze gefüllt' : 'Gefüllt')
</script>

<div class="toolbar">
  <button type="button" class="leave-button" onclick={onLeave}>Canvas "{canvasName}" verlassen</button>

  <ModeSwitch />

  {#if isNavigation}
    <button type="button" onclick={onCenterView}>Zentrieren</button>
  {/if}

  {#if isDraw}
    <ToolPicker />
    <ColorPicker />
    <StrokeWidthSelector />
    {#if showFilledToggle}
      <FilledToggle label={filledToggleLabel} />
    {/if}
    {#if showDoubleHeadedToggle}
      <DoubleHeadedToggle />
    {/if}
    {#if showFontDialog}
      <FontDialog />
    {/if}
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
