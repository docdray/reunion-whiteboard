import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FontDialog from './FontDialog.svelte'
import { toolStore } from '../lib/stores/toolStore.svelte'

describe('FontDialog', () => {
  beforeEach(() => {
    toolStore.setFontFamily('sans-serif')
    toolStore.setFontSize(16)
    toolStore.setBold(false)
    toolStore.setItalic(false)
    toolStore.setUnderline(false)
    toolStore.setStrikethrough(false)
  })

  it('updates the font family', async () => {
    render(FontDialog)
    await fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Georgia' } })
    expect(toolStore.fontFamily).toBe('Georgia')
  })

  it('updates the font size', async () => {
    render(FontDialog)
    const input = screen.getByRole('spinbutton') as HTMLInputElement
    await fireEvent.input(input, { target: { value: '24' } })
    expect(toolStore.fontSize).toBe(24)
  })

  it('toggles bold, italic, underline and strikethrough independently', async () => {
    render(FontDialog)
    await fireEvent.click(screen.getByText('F'))
    expect(toolStore.bold).toBe(true)
    expect(toolStore.italic).toBe(false)

    await fireEvent.click(screen.getByText('K'))
    expect(toolStore.italic).toBe(true)
    expect(toolStore.bold).toBe(true)

    await fireEvent.click(screen.getByText('U'))
    expect(toolStore.underline).toBe(true)

    await fireEvent.click(screen.getByText('D'))
    expect(toolStore.strikethrough).toBe(true)

    await fireEvent.click(screen.getByText('F'))
    expect(toolStore.bold).toBe(false)
    expect(toolStore.italic).toBe(true)
  })

  it('calls the respective onXChange callbacks in addition to updating the store', async () => {
    const onFontFamilyChange = vi.fn()
    const onFontSizeChange = vi.fn()
    const onBoldChange = vi.fn()
    render(FontDialog, { onFontFamilyChange, onFontSizeChange, onBoldChange })

    await fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Georgia' } })
    expect(onFontFamilyChange).toHaveBeenCalledWith('Georgia')

    await fireEvent.input(screen.getByRole('spinbutton'), { target: { value: '24' } })
    expect(onFontSizeChange).toHaveBeenCalledWith(24)

    await fireEvent.click(screen.getByText('F'))
    expect(onBoldChange).toHaveBeenCalledWith(true)
  })
})
