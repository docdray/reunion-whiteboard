const STORAGE_KEY = 'reunion.displayName'

function readStoredName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

class UserStore {
  displayName = $state(readStoredName())

  setDisplayName(name: string): void {
    const trimmed = name.trim()
    this.displayName = trimmed
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // localStorage unavailable (e.g. privacy mode) - name still works for this session
    }
  }
}

export const userStore = new UserStore()
