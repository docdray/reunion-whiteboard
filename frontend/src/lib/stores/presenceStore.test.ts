import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PresenceInfo } from '../protocol/messages'

function user(userId: string, displayName = 'Alice', color = '#00ff00'): PresenceInfo {
  return { userId, displayName, color, cursorX: null, cursorY: null }
}

describe('presenceStore', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('setInitial populates users by id', async () => {
    const { presenceStore } = await import('./presenceStore.svelte')
    presenceStore.setInitial([user('1', 'Alice'), user('2', 'Bob')])
    expect(Object.keys(presenceStore.users)).toEqual(['1', '2'])
    expect(presenceStore.users['2'].displayName).toBe('Bob')
  })

  it('upsert adds a new user', async () => {
    const { presenceStore } = await import('./presenceStore.svelte')
    presenceStore.upsert(user('1', 'Alice', '#123456'))
    expect(presenceStore.users['1'].displayName).toBe('Alice')
    expect(presenceStore.users['1'].color).toBe('#123456')
  })

  it('upsert merges partial fields into an existing user', async () => {
    const { presenceStore } = await import('./presenceStore.svelte')
    presenceStore.setInitial([user('1', 'Alice', '#123456')])
    presenceStore.upsert({ userId: '1', displayName: 'Alice Renamed' })
    expect(presenceStore.users['1'].displayName).toBe('Alice Renamed')
    expect(presenceStore.users['1'].color).toBe('#123456')
  })

  it('updateCursor updates position of a known user', async () => {
    const { presenceStore } = await import('./presenceStore.svelte')
    presenceStore.setInitial([user('1')])
    presenceStore.updateCursor('1', 10, 20)
    expect(presenceStore.users['1'].cursorX).toBe(10)
    expect(presenceStore.users['1'].cursorY).toBe(20)
  })

  it('updateCursor is a no-op for an unknown user', async () => {
    const { presenceStore } = await import('./presenceStore.svelte')
    presenceStore.updateCursor('missing', 1, 2)
    expect(presenceStore.users['missing']).toBeUndefined()
  })

  it('remove deletes a user by id', async () => {
    const { presenceStore } = await import('./presenceStore.svelte')
    presenceStore.setInitial([user('1'), user('2')])
    presenceStore.remove('1')
    expect(Object.keys(presenceStore.users)).toEqual(['2'])
  })

  it('reset clears all users', async () => {
    const { presenceStore } = await import('./presenceStore.svelte')
    presenceStore.setInitial([user('1')])
    presenceStore.reset()
    expect(presenceStore.users).toEqual({})
  })
})
