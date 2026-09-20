import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { connectLobbySocket } from './lobbyWs'
import type { LobbyServerMessage } from '../protocol/messages'

class MockWebSocket {
  static OPEN = 1
  static instances: MockWebSocket[] = []

  url: string
  readyState = MockWebSocket.OPEN
  private listeners: Record<string, Array<(event: { data: string }) => void>> = {}

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  addEventListener(type: string, listener: (event: { data: string }) => void): void {
    (this.listeners[type] ??= []).push(listener)
  }

  close(): void {
    this.readyState = 3
  }

  emitMessage(data: string): void {
    for (const listener of this.listeners['message'] ?? []) listener({ data })
  }
}

describe('connectLobbySocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('connects to the lobby endpoint', () => {
    connectLobbySocket()
    expect(MockWebSocket.instances).toHaveLength(1)
    expect(MockWebSocket.instances[0].url).toContain('/ws/canvases')
  })

  it('onMessage() receives a parsed LobbyServerMessage', () => {
    const socket = connectLobbySocket()
    const received: LobbyServerMessage[] = []
    socket.onMessage((msg) => received.push(msg))
    const message: LobbyServerMessage = { type: 'canvas-removed', id: 'c1' }
    MockWebSocket.instances[0].emitMessage(JSON.stringify(message))
    expect(received).toEqual([message])
  })

  it('ignores malformed incoming messages instead of throwing', () => {
    const socket = connectLobbySocket()
    const received: LobbyServerMessage[] = []
    socket.onMessage((msg) => received.push(msg))
    expect(() => MockWebSocket.instances[0].emitMessage('not json')).not.toThrow()
    expect(received).toHaveLength(0)
  })

  it('close() closes the underlying socket', () => {
    const socket = connectLobbySocket()
    socket.close()
    expect(MockWebSocket.instances[0].readyState).toBe(3)
  })
})
