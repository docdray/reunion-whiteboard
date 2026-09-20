<script lang="ts">
  import { onMount } from 'svelte'
  import { canvasListStore } from '../lib/stores/canvasListStore.svelte'
  import CanvasListItem from './CanvasListItem.svelte'

  interface Props {
    onOpenCanvas: (id: string, name: string) => void
  }

  let { onOpenCanvas }: Props = $props()

  let newCanvasName = $state('')

  onMount(() => {
    canvasListStore.refresh()
  })

  async function handleCreate() {
    const trimmed = newCanvasName.trim()
    if (!trimmed) return
    const created = await canvasListStore.create(trimmed)
    newCanvasName = ''
    onOpenCanvas(created.id, created.name)
  }

  async function handleDelete(id: string) {
    await canvasListStore.remove(id)
  }
</script>

<div class="canvas-list">
  <h2>Canvases</h2>

  {#if canvasListStore.loading}
    <p>Lade...</p>
  {:else if canvasListStore.error}
    <p class="error">{canvasListStore.error}</p>
  {/if}

  <ul>
    {#each canvasListStore.canvases as canvas (canvas.id)}
      <CanvasListItem {canvas} onOpen={onOpenCanvas} onDelete={handleDelete} />
    {/each}
  </ul>

  <form onsubmit={(e) => { e.preventDefault(); handleCreate() }}>
    <input type="text" placeholder="Name des neuen Canvas" bind:value={newCanvasName} />
    <button type="submit">Neues Canvas anlegen</button>
  </form>
</div>
