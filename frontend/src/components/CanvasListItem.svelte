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

<tr class="canvas-row">
  <td class="name-cell">{canvas.name}</td>
  <td class="created-cell">{createdAtLabel}</td>
  <td class="users-cell">
    <span class="badge" class:badge-active={canvas.activeUsers > 0}>{canvas.activeUsers}</span>
  </td>
  <td class="actions-cell">
    <button type="button" class="btn btn-open" onclick={() => onOpen(canvas.id, canvas.name)}>Öffnen</button>
    <button
      type="button"
      class="btn btn-delete"
      disabled={!deletable}
      title={deletable ? '' : 'Canvas wird noch verwendet'}
      onclick={() => onDelete(canvas.id)}
    >
      Löschen
    </button>
  </td>
</tr>

<style>
  .canvas-row td {
    padding: 0.7rem 0.9rem;
    border-bottom: 1px solid #eef0f3;
    vertical-align: middle;
  }

  .canvas-row:hover {
    background: #f7f8fa;
  }

  .name-cell {
    font-weight: 600;
    color: #1f2430;
  }

  .created-cell,
  .users-cell {
    color: #6b7280;
    font-size: 0.9rem;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.6rem;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    background: #eef0f3;
    color: #6b7280;
    font-weight: 600;
  }

  .badge-active {
    background: #e6f6ec;
    color: #1a8a4a;
  }

  .actions-cell {
    text-align: right;
    white-space: nowrap;
  }

  .btn {
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 0.4rem 0.85rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
  }

  .btn + .btn {
    margin-left: 0.5rem;
  }

  .btn-open {
    background: #4f5df6;
    color: white;
  }

  .btn-open:hover {
    background: #3f4de0;
  }

  .btn-delete {
    background: white;
    border-color: #e2645a;
    color: #e2645a;
  }

  .btn-delete:hover:not(:disabled) {
    background: #fdf1f0;
  }

  .btn-delete:disabled {
    border-color: #e5e7eb;
    color: #b6bac2;
    cursor: not-allowed;
  }
</style>
