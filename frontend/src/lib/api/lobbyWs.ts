import type { LobbyServerMessage } from '../protocol/messages'

export interface LobbySocket {
  onMessage(handler: (msg: LobbyServerMessage) => void): void
  close(): void
}

export function connectLobbySocket(): LobbySocket {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${protocol}://${location.host}/ws/canvases`
  const socket = new WebSocket(url)
  let handler: ((msg: LobbyServerMessage) => void) | null = null

  socket.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') return
    try {
      const msg = JSON.parse(event.data) as LobbyServerMessage
      handler?.(msg)
    } catch {
      // malformed message, ignore
    }
  })

  return {
    onMessage(h) {
      handler = h
    },
    close() {
      socket.close()
    },
  }
}
