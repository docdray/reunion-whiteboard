import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { connectCanvasSocket } from './ws'
import type { ServerMessage } from '../protocol/messages'

class MockWebSocket {
  static OPEN = 1
  static instances: MockWebSocket[] = []

  url: string
  readyState = MockWebSocket.OPEN
  sent: string[] = []
  private listeners: Record<string, Array<(event: { data: string }) => void>> = {}

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  addEventListener(type: string, listener: (event: { data: string }) => void): void {
    (this.listeners[type] ??= []).push(listener)
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.readyState = 3
  }

  emitMessage(data: string): void {
    for (const listener of this.listeners['message'] ?? []) listener({ data })
  }
}

describe('connectCanvasSocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('connects to the canvas endpoint with an encoded display name', () => {
    connectCanvasSocket('abc-123', 'Alice Ö')
    expect(MockWebSocket.instances).toHaveLength(1)
    const url = MockWebSocket.instances[0].url
    expect(url).toContain('/ws/canvas/abc-123')
    expect(url).toContain(`name=${encodeURIComponent('Alice Ö')}`)
  })

  it('send() serializes a ClientMessage as JSON when the socket is open', () => {
    const socket = connectCanvasSocket('abc', 'Bob')
    socket.send({ type: 'cursor-move', x: 1, y: 2 })
    const raw = MockWebSocket.instances[0].sent[0]
    expect(JSON.parse(raw)).toEqual({ type: 'cursor-move', x: 1, y: 2 })
  })

  it('send() does nothing when the socket is not open', () => {
    const socket = connectCanvasSocket('abc', 'Bob')
    MockWebSocket.instances[0].readyState = 0
    socket.send({ type: 'cursor-move', x: 1, y: 2 })
    expect(MockWebSocket.instances[0].sent).toHaveLength(0)
  })

  it('onMessage() receives a parsed ServerMessage', () => {
    const socket = connectCanvasSocket('abc', 'Bob')
    const received: ServerMessage[] = []
    socket.onMessage((msg) => received.push(msg))
    const message: ServerMessage = { type: 'user-left', userId: 'u1' }
    MockWebSocket.instances[0].emitMessage(JSON.stringify(message))
    expect(received).toEqual([message])
  })

  it('ignores malformed incoming messages instead of throwing', () => {
    const socket = connectCanvasSocket('abc', 'Bob')
    const received: ServerMessage[] = []
    socket.onMessage((msg) => received.push(msg))
    expect(() => MockWebSocket.instances[0].emitMessage('not json')).not.toThrow()
    expect(received).toHaveLength(0)
  })

  it('close() closes the underlying socket', () => {
    const socket = connectCanvasSocket('abc', 'Bob')
    socket.close()
    expect(MockWebSocket.instances[0].readyState).toBe(3)
  })

  it('onStatusChange() reports connecting immediately', () => {
    const socket = connectCanvasSocket('abc', 'Bob')
    const statuses: string[] = []
    socket.onStatusChange((s) => statuses.push(s))
    expect(statuses).toEqual(['connecting'])
  })
})
