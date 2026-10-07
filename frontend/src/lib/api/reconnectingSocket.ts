export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export const INITIAL_BACKOFF_MS = 500
export const MAX_BACKOFF_MS = 10_000

/** Verdoppelt den Backoff bis zur Obergrenze — als reine Funktion isoliert testbar. */
export function nextBackoff(current: number): number {
  return Math.min(current * 2, MAX_BACKOFF_MS)
}

export interface ReconnectingSocketHandle {
  send(data: string): void
  close(): void
}

interface ReconnectingSocketOptions {
  url: () => string
  onMessage: (data: string) => void
  onStatusChange: (status: ConnectionStatus) => void
}

/**
 * WebSocket-Wrapper mit automatischer Wiederverbindung (exponentieller Backoff) bei
 * unerwartetem Verbindungsabbruch. Beim erneuten Verbinden schickt der Server (sowohl
 * Canvas- als auch Lobby-Endpoint) beim @OnOpen erneut den vollen initial-state, der
 * ueber den unveraendert registrierten onMessage-Handler normal verarbeitet wird.
 */
export function createReconnectingSocket(options: ReconnectingSocketOptions): ReconnectingSocketHandle {
  let socket: WebSocket | null = null
  let backoff = INITIAL_BACKOFF_MS
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let closedByApp = false

  function connect(): void {
    options.onStatusChange('connecting')
    const ws = new WebSocket(options.url())
    socket = ws

    ws.addEventListener('open', () => {
      backoff = INITIAL_BACKOFF_MS
      options.onStatusChange('connected')
    })

    ws.addEventListener('message', (event) => {
      if (typeof event.data === 'string') options.onMessage(event.data)
    })

    ws.addEventListener('close', () => {
      if (closedByApp) return
      options.onStatusChange('disconnected')
      scheduleReconnect()
    })
  }

  function scheduleReconnect(): void {
    if (reconnectTimer) return
    const delay = backoff
    backoff = nextBackoff(backoff)
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, delay)
  }

  connect()

  return {
    send(data: string): void {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(data)
      } else {
        console.warn('[ws] Verbindung nicht offen, Nachricht verworfen:', data)
      }
    },
    close(): void {
      closedByApp = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      socket?.close()
    },
  }
}
