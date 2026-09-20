<script lang="ts">
  import { toolStore } from '../lib/stores/toolStore.svelte'
  import type { ShapeType } from '../lib/protocol/messages'

  const tools: { value: ShapeType; label: string }[] = [
    { value: 'freehand', label: 'Freihand' },
    { value: 'line', label: 'Linie' },
    { value: 'rect', label: 'Rechteck' },
    { value: 'circle', label: 'Kreis' },
    { value: 'ellipse', label: 'Ellipse' },
    { value: 'text', label: 'Text' },
    { value: 'arrow', label: 'Pfeil' },
  ]
</script>

<div class="row" role="group" aria-label="Werkzeug">
  {#each tools as t (t.value)}
    <button type="button" class:active={toolStore.tool === t.value} onclick={() => toolStore.setTool(t.value)}>
      {t.label}
    </button>
  {/each}
</div>

<style>
  .row {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  button.active {
    font-weight: bold;
    outline: 2px solid #4a90d9;
  }
</style>
