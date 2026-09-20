import type { ClientMessage, ServerMessage } from '../protocol/messages'

export interface CanvasSocket {
  send(msg: ClientMessage): void
  onMessage(handler: (msg: ServerMessage) => void): void
  close(): void
}

export function connectCanvasSocket(canvasId: string, displayName: string): CanvasSocket {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${protocol}://${location.host}/ws/canvas/${canvasId}?name=${encodeURIComponent(displayName)}`
  const socket = new WebSocket(url)
  let handler: ((msg: ServerMessage) => void) | null = null

  socket.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') return
    try {
      const msg = JSON.parse(event.data) as ServerMessage
      handler?.(msg)
    } catch {
      // malformed message, ignore
    }
  })

  return {
    send(msg) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg))
      }
    },
    onMessage(h) {
      handler = h
    },
    close() {
      socket.close()
    },
  }
}
