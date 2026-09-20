import type { PresenceInfo } from '../protocol/messages'

class PresenceStore {
  users = $state<Record<string, PresenceInfo>>({})

  setInitial(users: PresenceInfo[]): void {
    const map: Record<string, PresenceInfo> = {}
    for (const u of users) map[u.userId] = u
    this.users = map
  }

  upsert(info: Partial<PresenceInfo> & { userId: string }): void {
    const existing = this.users[info.userId]
    this.users = { ...this.users, [info.userId]: { ...existing, ...info } as PresenceInfo }
  }

  updateCursor(userId: string, x: number, y: number): void {
    const existing = this.users[userId]
    if (!existing) return
    this.users = { ...this.users, [userId]: { ...existing, cursorX: x, cursorY: y } }
  }

  remove(userId: string): void {
    if (!(userId in this.users)) return
    const next = { ...this.users }
    delete next[userId]
    this.users = next
  }

  reset(): void {
    this.users = {}
  }
}

export const presenceStore = new PresenceStore()
