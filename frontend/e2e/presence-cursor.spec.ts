import { test, expect } from '@playwright/test'
import { createCanvas, openExistingCanvas, setDisplayName, uniqueName } from './helpers'

test('Cursor-Position und Name eines anderen Nutzers erscheinen live', async ({ browser }) => {
  const canvasName = uniqueName('presence-cursor')

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

  // Bewusst weit weg von der fest positionierten Toolbar oben links (überdeckt sonst den Canvas-Container).
  await pageA.mouse.move(700, 450)
  await pageA.mouse.move(900, 550, { steps: 5 })

  await expect(pageB.locator('.remote-cursor-label', { hasText: 'Alice' })).toBeVisible({ timeout: 5_000 })

  await contextA.close()
  await contextB.close()
})
