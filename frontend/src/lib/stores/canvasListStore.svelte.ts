import { createCanvas, deleteCanvas } from '../api/canvasApi'
import { connectLobbySocket, type LobbySocket } from '../api/lobbyWs'
import type { ConnectionStatus } from '../api/reconnectingSocket'
import type { CanvasSummaryDto } from '../protocol/messages'

class CanvasListStore {
  canvases = $state<CanvasSummaryDto[]>([])
  loading = $state(false)
  error = $state<string | null>(null)
  status = $state<ConnectionStatus>('connecting')
  private socket: LobbySocket | null = null

  /** Neueste zuerst. */
  get sorted(): CanvasSummaryDto[] {
    return [...this.canvases].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  /**
   * Verbindet mit der Lobby (Server-Push-Kanal fuer Live-Updates der Canvas-Liste). Die Liste
   * ist danach ausschliesslich ueber diesen Kanal aktuell - `create()`/`remove()` loesen ihre
   * eigene Listenaktualisierung ueber die vom Server an alle Lobby-Clients gebroadcastete
   * `canvas-added`/`canvas-removed`-Nachricht aus, kein lokales Doppel-Update noetig.
   */
  connect(): void {
    if (this.socket) return
    this.loading = true
    this.error = null
    this.socket = connectLobbySocket()
    this.socket.onStatusChange((status) => {
      this.status = status
    })
    this.socket.onMessage((msg) => {
      switch (msg.type) {
        case 'lobby-initial-state':
          this.canvases = msg.canvases
          this.loading = false
          break
        case 'canvas-added':
          this.canvases = [...this.canvases.filter((c) => c.id !== msg.canvas.id), msg.canvas]
          break
        case 'canvas-updated':
          this.canvases = this.canvases.map((c) => (c.id === msg.canvas.id ? msg.canvas : c))
          break
        case 'canvas-removed':
          this.canvases = this.canvases.filter((c) => c.id !== msg.id)
          break
      }
    })
  }

  disconnect(): void {
    this.socket?.close()
    this.socket = null
  }

  async create(name: string): Promise<CanvasSummaryDto> {
    try {
      return await createCanvas(name)
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e)
      throw e
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await deleteCanvas(id)
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e)
      throw e
    }
  }
}

export const canvasListStore = new CanvasListStore()
