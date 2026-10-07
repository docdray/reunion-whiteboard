<script lang="ts">
  import { toolStore } from '../lib/stores/toolStore.svelte'

  let { label = 'Gefüllt', onFilledChange }: { label?: string; onFilledChange?: (filled: boolean) => void } =
    $props()

  function toggle(checked: boolean): void {
    toolStore.setFilled(checked)
    onFilledChange?.(checked)
  }
</script>

<label class="filled-toggle">
  <input
    type="checkbox"
    checked={toolStore.filled}
    onchange={(e) => toggle((e.currentTarget as HTMLInputElement).checked)}
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
