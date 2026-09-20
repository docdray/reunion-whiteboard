<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { canvasListStore } from '../lib/stores/canvasListStore.svelte'
  import CanvasListItem from './CanvasListItem.svelte'

  interface Props {
    onOpenCanvas: (id: string, name: string) => void
  }

  let { onOpenCanvas }: Props = $props()

  let newCanvasName = $state('')

  onMount(() => {
    canvasListStore.connect()
  })

  onDestroy(() => {
    canvasListStore.disconnect()
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

<section class="canvas-list">
  <form class="create-form" onsubmit={(e) => { e.preventDefault(); handleCreate() }}>
    <input type="text" placeholder="Name des neuen Canvas" bind:value={newCanvasName} />
    <button type="submit" class="btn btn-create">Neues Canvas anlegen</button>
  </form>

  {#if canvasListStore.error}
    <p class="error">{canvasListStore.error}</p>
  {/if}

  <div class="table-card">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Erstellt am</th>
          <th>Aktive Nutzer</th>
          <th class="actions-col">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        {#if canvasListStore.loading}
          <tr><td colspan="4" class="empty">Lade...</td></tr>
        {:else if canvasListStore.sorted.length === 0}
          <tr><td colspan="4" class="empty">Noch keine Canvases vorhanden.</td></tr>
        {:else}
          {#each canvasListStore.sorted as canvas (canvas.id)}
            <CanvasListItem {canvas} onOpen={onOpenCanvas} onDelete={handleDelete} />
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</section>

<style>
  .canvas-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .create-form {
    display: flex;
    gap: 0.6rem;
  }

  .create-form input {
    flex: 1;
    padding: 0.65rem 0.9rem;
    border: 1px solid #d8dbe1;
    border-radius: 10px;
    font-size: 0.95rem;
  }

  .create-form input:focus {
    outline: none;
    border-color: #4f5df6;
    box-shadow: 0 0 0 3px rgba(79, 93, 246, 0.15);
  }

  .btn-create {
    border: none;
    border-radius: 10px;
    padding: 0.65rem 1.1rem;
    background: #4f5df6;
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.15s ease;
  }

  .btn-create:hover {
    background: #3f4de0;
  }

  .error {
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 0.6rem 0.9rem;
    font-size: 0.9rem;
  }

  .table-card {
    border: 1px solid #eef0f3;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    text-align: left;
    padding: 0.7rem 0.9rem;
    background: #f7f8fa;
    color: #6b7280;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid #eef0f3;
  }

  .actions-col {
    text-align: right;
  }

  .empty {
    padding: 1.5rem 0.9rem;
    text-align: center;
    color: #9ca3af;
  }
</style>
