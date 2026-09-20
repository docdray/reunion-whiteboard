import { test, expect } from '@playwright/test'
import { createCanvas, getObjectCount, openExistingCanvas, setDisplayName, setMode, setTool, uniqueName } from './helpers'

test('Objekt zeichnen, selektieren, löschen – Löschung bleibt nach Reload persistent', async ({ page }) => {
  const canvasName = uniqueName('select-delete')

  await page.goto('/')
  await setDisplayName(page, 'Carol')
  await createCanvas(page, canvasName)

  await setMode(page, 'Zeichnen')
  await setTool(page, 'Rechteck')
  await page.mouse.move(300, 300)
  await page.mouse.down()
  await page.mouse.move(500, 450, { steps: 5 })
  await page.mouse.up()

  await expect.poll(() => getObjectCount(page), { timeout: 5_000 }).toBe(1)

  await setMode(page, 'Markieren')
  await page.mouse.click(400, 375)
  await page.keyboard.press('Delete')

  await expect.poll(() => getObjectCount(page), { timeout: 5_000 }).toBe(0)

  await page.reload()
  await openExistingCanvas(page, canvasName)

  await expect.poll(() => getObjectCount(page), { timeout: 5_000 }).toBe(0)
})
