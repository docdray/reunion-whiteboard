<script lang="ts">
  import { toolStore, type Mode } from '../lib/stores/toolStore.svelte'

  const modes: { value: Mode; label: string }[] = [
    { value: 'navigation', label: 'Navigation' },
    { value: 'draw', label: 'Zeichnen' },
    { value: 'select', label: 'Markieren' },
  ]
</script>

<div class="row" role="group" aria-label="Modus">
  {#each modes as m (m.value)}
    <button type="button" class:active={toolStore.mode === m.value} onclick={() => toolStore.setMode(m.value)}>
      {m.label}
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
