<script lang="ts">
  import { toolStore } from '../lib/stores/toolStore.svelte'
</script>

<label class="filled-toggle">
  <input
    type="checkbox"
    checked={toolStore.filled}
    onchange={(e) => toolStore.setFilled((e.currentTarget as HTMLInputElement).checked)}
  />
  Gefüllt
</label>

<style>
  .filled-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
