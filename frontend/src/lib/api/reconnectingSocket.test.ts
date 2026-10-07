import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReconnectingSocket, nextBackoff, INITIAL_BACKOFF_MS, MAX_BACKOFF_MS } from './reconnectingSocket'

class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3
  static instances: MockWebSocket[] = []

  url: string
  readyState = MockWebSocket.OPEN
  sent: string[] = []
  private listeners: Record<string, Array<(event?: unknown) => void>> = {}

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  addEventListener(type: string, listener: (event?: unknown) => void): void {
    ;(this.listeners[type] ??= []).push(listener)
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED
    this.emit('close')
  }

  emitOpen(): void {
    this.readyState = MockWebSocket.OPEN
    this.emit('open')
  }

  emitMessage(data: string): void {
    this.emit('message', { data })
  }

  /** Simuliert einen Server-/Netzwerk-seitigen Abbruch (nicht durch die App ausgelöst). */
  emitServerClose(): void {
    this.readyState = MockWebSocket.CLOSED
    this.emit('close')
  }

  private emit(type: string, event?: unknown): void {
    for (const listener of this.listeners[type] ?? []) listener(event)
  }
}

describe('nextBackoff', () => {
  it('verdoppelt bis zur Obergrenze', () => {
    expect(nextBackoff(INITIAL_BACKOFF_MS)).toBe(1000)
    expect(nextBackoff(1000)).toBe(2000)
    expect(nextBackoff(8000)).toBe(MAX_BACKOFF_MS)
    expect(nextBackoff(MAX_BACKOFF_MS)).toBe(MAX_BACKOFF_MS)
  })
})

describe('createReconnectingSocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('connects immediately and reports "connecting" then "connected" on open', () => {
    const statuses: string[] = []
    createReconnectingSocket({ url: () => 'ws://x', onMessage: () => {}, onStatusChange: (s) => statuses.push(s) })
    expect(MockWebSocket.instances).toHaveLength(1)
    expect(statuses).toEqual(['connecting'])
    ;(MockWebSocket.instances[0] as MockWebSocket).emitOpen()
    expect(statuses).toEqual(['connecting', 'connected'])
  })

  it('reconnects with increasing backoff after an unexpected close, resets backoff on success', () => {
    const statuses: string[] = []
    createReconnectingSocket({ url: () => 'ws://x', onMessage: () => {}, onStatusChange: (s) => statuses.push(s) })
    const first = MockWebSocket.instances[0]
    first.emitOpen()

    first.emitServerClose()
    expect(statuses.at(-1)).toBe('disconnected')
    expect(MockWebSocket.instances).toHaveLength(1)

    vi.advanceTimersByTime(INITIAL_BACKOFF_MS - 1)
    expect(MockWebSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(MockWebSocket.instances).toHaveLength(2)
    expect(statuses.at(-1)).toBe('connecting')

    // Zweiter Versuch schlaegt ebenfalls fehl -> naechster Delay ist verdoppelt (1000ms), nicht wieder 500ms.
    const second = MockWebSocket.instances[1]
    second.emitServerClose()
    vi.advanceTimersByTime(1000 - 1)
    expect(MockWebSocket.instances).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(MockWebSocket.instances).toHaveLength(3)

    // Erfolgreicher Connect setzt den Backoff zurueck.
    MockWebSocket.instances[2].emitOpen()
    MockWebSocket.instances[2].emitServerClose()
    vi.advanceTimersByTime(INITIAL_BACKOFF_MS - 1)
    expect(MockWebSocket.instances).toHaveLength(3)
    vi.advanceTimersByTime(1)
    expect(MockWebSocket.instances).toHaveLength(4)
  })

  it('does not reconnect after an app-initiated close()', () => {
    const statuses: string[] = []
    const handle = createReconnectingSocket({
      url: () => 'ws://x',
      onMessage: () => {},
      onStatusChange: (s) => statuses.push(s),
    })
    MockWebSocket.instances[0].emitOpen()
    handle.close()
    vi.advanceTimersByTime(MAX_BACKOFF_MS * 2)
    expect(MockWebSocket.instances).toHaveLength(1)
  })

  it('send() warns and drops the message when the socket is not open', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const handle = createReconnectingSocket({ url: () => 'ws://x', onMessage: () => {}, onStatusChange: () => {} })
    MockWebSocket.instances[0].readyState = 0
    handle.send('hello')
    expect(MockWebSocket.instances[0].sent).toHaveLength(0)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('delivers messages received after a reconnect through the same onMessage handler', () => {
    const received: string[] = []
    createReconnectingSocket({ url: () => 'ws://x', onMessage: (d) => received.push(d), onStatusChange: () => {} })
    MockWebSocket.instances[0].emitOpen()
    MockWebSocket.instances[0].emitServerClose()
    vi.advanceTimersByTime(INITIAL_BACKOFF_MS)
    MockWebSocket.instances[1].emitMessage('after-reconnect')
    expect(received).toEqual(['after-reconnect'])
  })
})
