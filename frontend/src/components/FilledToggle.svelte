<script lang="ts">
  import { toolStore } from '../lib/stores/toolStore.svelte'

  let { label = 'Gefüllt' }: { label?: string } = $props()
</script>

<label class="filled-toggle">
  <input
    type="checkbox"
    checked={toolStore.filled}
    onchange={(e) => toolStore.setFilled((e.currentTarget as HTMLInputElement).checked)}
  />
  {label}
</label>

<style>
  .filled-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
