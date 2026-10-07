import type { LobbyServerMessage } from '../protocol/messages'
import { createReconnectingSocket, type ConnectionStatus } from './reconnectingSocket'

export type { ConnectionStatus }

export interface LobbySocket {
  onMessage(handler: (msg: LobbyServerMessage) => void): void
  onStatusChange(handler: (status: ConnectionStatus) => void): void
  close(): void
}

export function connectLobbySocket(): LobbySocket {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const url = () => `${protocol}://${location.host}/ws/canvases`

  let messageHandler: ((msg: LobbyServerMessage) => void) | null = null
  let statusHandler: ((status: ConnectionStatus) => void) | null = null
  let currentStatus: ConnectionStatus = 'connecting'

  const socket = createReconnectingSocket({
    url,
    onMessage: (data) => {
      try {
        const msg = JSON.parse(data) as LobbyServerMessage
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
