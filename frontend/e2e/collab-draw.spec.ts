import { test, expect } from '@playwright/test'
import { createCanvas, getObjectCount, getOtherPreviewCount, openExistingCanvas, setDisplayName, setMode, setTool, uniqueName } from './helpers'

test('zwei Nutzer sehen die Live-Vorschau und das fertige Objekt beim gemeinsamen Zeichnen', async ({ browser }) => {
  const canvasName = uniqueName('collab-draw')

  const contextA = await browser.newContext()
  const pageA = await contextA.newPage()
  await pageA.goto('/')
  await setDisplayName(pageA, 'Alice')
  await createCanvas(pageA, canvasName)

  const contextB = await browser.newContext()
  const pageB = await contextB.newPage()
  await pageB.goto('/')
  await setDisplayName(pageB, 'Bob')
  await openExistingCanvas(pageB, canvasName)

  await setMode(pageA, 'Zeichnen')
  await setTool(pageA, 'Rechteck')

  await pageA.mouse.move(300, 300)
  await pageA.mouse.down()
  await pageA.mouse.move(500, 450, { steps: 5 })

  await expect.poll(() => getOtherPreviewCount(pageB), { timeout: 5_000 }).toBe(1)

  await pageA.mouse.up()

  await expect.poll(() => getObjectCount(pageA), { timeout: 5_000 }).toBe(1)
  await expect.poll(() => getObjectCount(pageB), { timeout: 5_000 }).toBe(1)

  await contextA.close()
  await contextB.close()
})
