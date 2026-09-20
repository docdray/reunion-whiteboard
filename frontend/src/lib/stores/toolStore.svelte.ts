import type { ShapeType } from '../protocol/messages'
import type { DrawSettings } from '../geometry/shapeFromDrag'

export type Mode = 'navigation' | 'draw' | 'select'

class ToolStore {
  mode = $state<Mode>('navigation')
  tool = $state<ShapeType>('freehand')
  color = $state('#000000')
  strokeWidth = $state(2)
  filled = $state(false)
  fontFamily = $state('sans-serif')
  fontSize = $state(16)
  bold = $state(false)
  italic = $state(false)
  underline = $state(false)
  strikethrough = $state(false)
  doubleHeaded = $state(false)

  setMode(mode: Mode): void {
    this.mode = mode
  }

  setTool(tool: ShapeType): void {
    this.tool = tool
  }

  setColor(color: string): void {
    this.color = color
  }

  setStrokeWidth(strokeWidth: number): void {
    this.strokeWidth = strokeWidth
  }

  setFilled(filled: boolean): void {
    this.filled = filled
  }

  setFontFamily(fontFamily: string): void {
    this.fontFamily = fontFamily
  }

  setFontSize(fontSize: number): void {
    this.fontSize = fontSize
  }

  setBold(bold: boolean): void {
    this.bold = bold
  }

  setItalic(italic: boolean): void {
    this.italic = italic
  }

  setUnderline(underline: boolean): void {
    this.underline = underline
  }

  setStrikethrough(strikethrough: boolean): void {
    this.strikethrough = strikethrough
  }

  setDoubleHeaded(doubleHeaded: boolean): void {
    this.doubleHeaded = doubleHeaded
  }

  get drawSettings(): DrawSettings {
    return {
      color: this.color,
      strokeWidth: this.strokeWidth,
      filled: this.filled,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      bold: this.bold,
      italic: this.italic,
      underline: this.underline,
      strikethrough: this.strikethrough,
      doubleHeaded: this.doubleHeaded,
    }
  }
}

export const toolStore = new ToolStore()
