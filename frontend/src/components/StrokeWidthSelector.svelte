<script lang="ts">
  import { toolStore } from '../lib/stores/toolStore.svelte'

  const widths = [1, 2, 4, 8]
  const groupLabel = $derived(toolStore.tool === 'eraser' ? 'Radiergröße' : 'Linienstärke')
</script>

<div class="row" role="group" aria-label={groupLabel}>
  {#each widths as w (w)}
    <button type="button" class:active={toolStore.strokeWidth === w} onclick={() => toolStore.setStrokeWidth(w)}>
      {w}
    </button>
  {/each}
</div>

<style>
  .row {
    display: flex;
    gap: 4px;
  }

  button.active {
    font-weight: bold;
    outline: 2px solid #4a90d9;
  }
</style>
