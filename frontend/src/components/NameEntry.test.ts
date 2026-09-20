import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it } from 'vitest'
import NameEntry from './NameEntry.svelte'
import { userStore } from '../lib/stores/userStore.svelte'

describe('NameEntry', () => {
  beforeEach(() => {
    localStorage.clear()
    userStore.setDisplayName('')
  })

  it('prefills the input with the stored name', () => {
    userStore.setDisplayName('Alice')
    render(NameEntry)
    const input = screen.getByLabelText('Dein Name') as HTMLInputElement
    expect(input.value).toBe('Alice')
  })

  it('persists the name on blur', async () => {
    render(NameEntry)
    const input = screen.getByLabelText('Dein Name') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Bob' } })
    await fireEvent.blur(input)
    expect(userStore.displayName).toBe('Bob')
  })

  it('does not persist a blank name', async () => {
    userStore.setDisplayName('Carol')
    render(NameEntry)
    const input = screen.getByLabelText('Dein Name') as HTMLInputElement
    await fireEvent.input(input, { target: { value: '   ' } })
    await fireEvent.blur(input)
    expect(userStore.displayName).toBe('Carol')
  })
})
