<script lang="ts">
  import { toolStore } from '../lib/stores/toolStore.svelte'

  interface Props {
    onFontFamilyChange?: (fontFamily: string) => void
    onFontSizeChange?: (fontSize: number) => void
    onBoldChange?: (bold: boolean) => void
    onItalicChange?: (italic: boolean) => void
    onUnderlineChange?: (underline: boolean) => void
    onStrikethroughChange?: (strikethrough: boolean) => void
  }

  let {
    onFontFamilyChange,
    onFontSizeChange,
    onBoldChange,
    onItalicChange,
    onUnderlineChange,
    onStrikethroughChange,
  }: Props = $props()

  function pickFontFamily(fontFamily: string): void {
    toolStore.setFontFamily(fontFamily)
    onFontFamilyChange?.(fontFamily)
  }

  function pickFontSize(fontSize: number): void {
    toolStore.setFontSize(fontSize)
    onFontSizeChange?.(fontSize)
  }

  function toggleBold(): void {
    const next = !toolStore.bold
    toolStore.setBold(next)
    onBoldChange?.(next)
  }

  function toggleItalic(): void {
    const next = !toolStore.italic
    toolStore.setItalic(next)
    onItalicChange?.(next)
  }

  function toggleUnderline(): void {
    const next = !toolStore.underline
    toolStore.setUnderline(next)
    onUnderlineChange?.(next)
  }

  function toggleStrikethrough(): void {
    const next = !toolStore.strikethrough
    toolStore.setStrikethrough(next)
    onStrikethroughChange?.(next)
  }

  const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana']
</script>

<div class="font-dialog">
  <label>
    <span class="sr-only">Schriftart</span>
    <select value={toolStore.fontFamily} onchange={(e) => pickFontFamily((e.currentTarget as HTMLSelectElement).value)}>
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
      oninput={(e) => pickFontSize(Number((e.currentTarget as HTMLInputElement).value))}
    />
  </label>

  <div class="row" role="group" aria-label="Textformatierung">
    <button type="button" class:active={toolStore.bold} onclick={toggleBold}>
      <strong>F</strong>
    </button>
    <button type="button" class:active={toolStore.italic} onclick={toggleItalic}>
      <em>K</em>
    </button>
    <button type="button" class:active={toolStore.underline} onclick={toggleUnderline}>
      <span style="text-decoration: underline;">U</span>
    </button>
    <button type="button" class:active={toolStore.strikethrough} onclick={toggleStrikethrough}>
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
