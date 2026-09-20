import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { canvasStore } from './lib/stores/canvasStore.svelte'
import { previewStore } from './lib/stores/previewStore.svelte'
import { presenceStore } from './lib/stores/presenceStore.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

declare global {
  interface Window {
    __reunionTest?: {
      getObjectCount: () => number
      getOwnPreviewCount: () => number
      getOtherPreviewCount: () => number
      getPresenceUserNames: () => string[]
    }
  }
}

// Test-Hook fuer Playwright-E2E-Tests: exponiert reinen Lesezugriff auf den
// Zeichenzustand, damit Assertions nicht auf DOM-Timing des Konva-Canvas
// angewiesen sind. Keine sicherheitsrelevanten Daten, rein additiv.
window.__reunionTest = {
  getObjectCount: () => canvasStore.objects.length,
  getOwnPreviewCount: () => (previewStore.own ? 1 : 0),
  getOtherPreviewCount: () => Object.keys(previewStore.others).length,
  getPresenceUserNames: () => Object.values(presenceStore.users).map((u) => u.displayName),
}

export default app
