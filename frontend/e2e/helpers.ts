import { expect, type Page } from '@playwright/test'

export async function setDisplayName(page: Page, name: string): Promise<void> {
  const input = page.getByLabel('Dein Name')
  await input.fill(name)
  await input.blur()
}

export async function createCanvas(page: Page, canvasName: string): Promise<void> {
  await page.getByPlaceholder('Name des neuen Canvas').fill(canvasName)
  await page.getByRole('button', { name: 'Neues Canvas anlegen' }).click()
  await expect(page.getByRole('application')).toBeVisible()
}

export async function openExistingCanvas(page: Page, canvasName: string): Promise<void> {
  const row = page.getByRole('row').filter({ hasText: canvasName })
  await row.getByRole('button', { name: 'Öffnen' }).click()
  await expect(page.getByRole('application')).toBeVisible()
}

export async function setMode(page: Page, mode: 'Navigation' | 'Zeichnen' | 'Markieren'): Promise<void> {
  await page.getByRole('group', { name: 'Modus' }).getByRole('button', { name: mode }).click()
}

export async function setTool(
  page: Page,
  tool: 'Freihand' | 'Linie' | 'Rechteck' | 'Kreis' | 'Ellipse' | 'Text',
): Promise<void> {
  await page.getByRole('group', { name: 'Werkzeug' }).getByRole('button', { name: tool }).click()
}

export function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

export function getObjectCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as any).__reunionTest.getObjectCount())
}

export function getOtherPreviewCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as any).__reunionTest.getOtherPreviewCount())
}
