import type { ClientMessage, ServerMessage } from '../protocol/messages'
import { createReconnectingSocket, type ConnectionStatus } from './reconnectingSocket'

export type { ConnectionStatus }

export interface CanvasSocket {
  send(msg: ClientMessage): void
  onMessage(handler: (msg: ServerMessage) => void): void
  onStatusChange(handler: (status: ConnectionStatus) => void): void
  close(): void
}

export function connectCanvasSocket(canvasId: string, displayName: string): CanvasSocket {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const url = () => `${protocol}://${location.host}/ws/canvas/${canvasId}?name=${encodeURIComponent(displayName)}`

  let messageHandler: ((msg: ServerMessage) => void) | null = null
  let statusHandler: ((status: ConnectionStatus) => void) | null = null
  let currentStatus: ConnectionStatus = 'connecting'

  const socket = createReconnectingSocket({
    url,
    onMessage: (data) => {
      try {
        const msg = JSON.parse(data) as ServerMessage
        messageHandler?.(msg)
      } catch {
        // malformed message, ignore
      }
    },
    onStatusChange: (status) => {
      currentStatus = status
      statusHandler?.(status)
    },
  })

  return {
    send(msg) {
      socket.send(JSON.stringify(msg))
    },
    onMessage(h) {
      messageHandler = h
    },
    onStatusChange(h) {
      statusHandler = h
      h(currentStatus)
    },
    close() {
      socket.close()
    },
  }
}
