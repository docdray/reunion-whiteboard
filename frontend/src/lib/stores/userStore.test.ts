import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('userStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('defaults to an empty string when nothing is stored', async () => {
    const { userStore } = await import('./userStore.svelte')
    expect(userStore.displayName).toBe('')
  })

  it('reads an existing name from localStorage on load', async () => {
    localStorage.setItem('reunion.displayName', 'Alice')
    const { userStore } = await import('./userStore.svelte')
    expect(userStore.displayName).toBe('Alice')
  })

  it('setDisplayName persists a trimmed name to localStorage', async () => {
    const { userStore } = await import('./userStore.svelte')
    userStore.setDisplayName('  Bob  ')
    expect(userStore.displayName).toBe('Bob')
    expect(localStorage.getItem('reunion.displayName')).toBe('Bob')
  })

  it('setDisplayName with a blank string clears the stored name', async () => {
    const { userStore } = await import('./userStore.svelte')
    userStore.setDisplayName('Carol')
    userStore.setDisplayName('   ')
    expect(userStore.displayName).toBe('')
    expect(localStorage.getItem('reunion.displayName')).toBeNull()
  })
})
