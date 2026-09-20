<script lang="ts">
  import type { CanvasSummaryDto } from '../lib/protocol/messages'

  interface Props {
    canvas: CanvasSummaryDto
    onOpen: (id: string, name: string) => void
    onDelete: (id: string) => void
  }

  let { canvas, onOpen, onDelete }: Props = $props()

  const createdAtLabel = $derived(new Date(canvas.createdAt).toLocaleString())
  const deletable = $derived(canvas.activeUsers === 0)
</script>

<li class="canvas-list-item">
  <div class="info">
    <span class="name">{canvas.name}</span>
    <span class="meta">Erstellt: {createdAtLabel} &middot; Aktive Nutzer: {canvas.activeUsers}</span>
  </div>
  <div class="actions">
    <button type="button" onclick={() => onOpen(canvas.id, canvas.name)}>Öffnen</button>
    {#if deletable}
      <button type="button" onclick={() => onDelete(canvas.id)}>Löschen</button>
    {/if}
  </div>
</li>
