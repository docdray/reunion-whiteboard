<script lang="ts">
  import { toolStore, type Mode } from '../lib/stores/toolStore.svelte'
  import type { ShapeType } from '../lib/protocol/messages'

  const modes: { value: Mode; label: string }[] = [
    { value: 'navigation', label: 'Navigation' },
    { value: 'draw', label: 'Zeichnen' },
  ]

  const tools: { value: ShapeType; label: string }[] = [
    { value: 'freehand', label: 'Freihand' },
    { value: 'line', label: 'Linie' },
    { value: 'rect', label: 'Rechteck' },
    { value: 'circle', label: 'Kreis' },
    { value: 'ellipse', label: 'Ellipse' },
    { value: 'text', label: 'Text' },
  ]
</script>

<div class="draw-tool-picker">
  <div class="row">
    {#each modes as m (m.value)}
      <button type="button" class:active={toolStore.mode === m.value} onclick={() => toolStore.setMode(m.value)}>
        {m.label}
      </button>
    {/each}
  </div>

  {#if toolStore.mode === 'draw'}
    <div class="row">
      {#each tools as t (t.value)}
        <button type="button" class:active={toolStore.tool === t.value} onclick={() => toolStore.setTool(t.value)}>
          {t.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .draw-tool-picker {
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: white;
    padding: 8px;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  .row {
    display: flex;
    gap: 4px;
  }

  button.active {
    font-weight: bold;
    outline: 2px solid #4a90d9;
  }
</style>
