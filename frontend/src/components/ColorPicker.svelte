<script lang="ts">
  interface Props {
    value: string
    label?: string
    onChange: (color: string) => void
  }

  let { value, label = 'Farbauswahl', onChange }: Props = $props()

  const swatches = [
    '#000000',
    '#ffffff',
    '#e53935',
    '#fb8c00',
    '#fdd835',
    '#43a047',
    '#1e88e5',
    '#8e24aa',
    '#d81b60',
    '#6d4c41',
  ]
</script>

<div class="color-picker">
  {#if label}<span class="label">{label}</span>{/if}
  <div class="swatches" role="group" aria-label={label}>
    {#each swatches as swatch (swatch)}
      <button
        type="button"
        class="swatch"
        class:active={value === swatch}
        style={`background:${swatch}`}
        aria-label={swatch}
        onclick={() => onChange(swatch)}
      ></button>
    {/each}
  </div>
  <label>
    <span class="sr-only">{label} (eigene Farbe)</span>
    <input type="color" {value} oninput={(e) => onChange((e.currentTarget as HTMLInputElement).value)} />
  </label>
</div>

<style>
  .color-picker {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .label {
    font-size: 0.8em;
    color: #555;
  }

  .swatches {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .swatch {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid #999;
    padding: 0;
    cursor: pointer;
  }

  .swatch.active {
    outline: 2px solid #4a90d9;
    outline-offset: 1px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
