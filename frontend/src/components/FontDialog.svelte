<script lang="ts">
  import { toolStore } from '../lib/stores/toolStore.svelte'

  const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana']
</script>

<div class="font-dialog">
  <label>
    <span class="sr-only">Schriftart</span>
    <select
      value={toolStore.fontFamily}
      onchange={(e) => toolStore.setFontFamily((e.currentTarget as HTMLSelectElement).value)}
    >
      {#each fonts as font (font)}
        <option value={font}>{font}</option>
      {/each}
    </select>
  </label>

  <label>
    <span class="sr-only">Schriftgröße</span>
    <input
      type="number"
      min="8"
      max="96"
      value={toolStore.fontSize}
      oninput={(e) => toolStore.setFontSize(Number((e.currentTarget as HTMLInputElement).value))}
    />
  </label>

  <div class="row" role="group" aria-label="Textformatierung">
    <button type="button" class:active={toolStore.bold} onclick={() => toolStore.setBold(!toolStore.bold)}>
      <strong>F</strong>
    </button>
    <button type="button" class:active={toolStore.italic} onclick={() => toolStore.setItalic(!toolStore.italic)}>
      <em>K</em>
    </button>
    <button
      type="button"
      class:active={toolStore.underline}
      onclick={() => toolStore.setUnderline(!toolStore.underline)}
    >
      <span style="text-decoration: underline;">U</span>
    </button>
    <button
      type="button"
      class:active={toolStore.strikethrough}
      onclick={() => toolStore.setStrikethrough(!toolStore.strikethrough)}
    >
      <span style="text-decoration: line-through;">D</span>
    </button>
  </div>
</div>

<style>
  .font-dialog {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .row {
    display: flex;
    gap: 4px;
  }

  button.active {
    outline: 2px solid #4a90d9;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
