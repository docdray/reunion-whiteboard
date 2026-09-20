<script lang="ts">
  import { toolStore } from '../lib/stores/toolStore.svelte'
</script>

<label class="double-headed-toggle">
  <input
    type="checkbox"
    checked={toolStore.doubleHeaded}
    onchange={(e) => toolStore.setDoubleHeaded((e.currentTarget as HTMLInputElement).checked)}
  />
  Doppelpfeil
</label>

<style>
  .double-headed-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
