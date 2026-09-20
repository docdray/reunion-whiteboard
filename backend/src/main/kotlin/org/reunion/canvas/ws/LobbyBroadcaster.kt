package org.reunion.canvas.ws

import io.quarkus.websockets.next.OpenConnections
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import org.reunion.canvas.dto.CanvasSummaryDto
import org.reunion.canvas.ws.protocol.LobbyServerMessage
import java.util.UUID

/**
 * Sendet Lobby-Updates an alle offenen [LobbyWebSocketEndpoint]-Verbindungen, auch wenn der
 * Aufruf (z.B. aus CanvasService oder CanvasWebSocketEndpoint) selbst nicht im Kontext eines
 * Lobby-Handlers laeuft. `OpenConnections` ist die dafuer vorgesehene, framework-bereitgestellte
 * CDI-Bean.
 */
@ApplicationScoped
class LobbyBroadcaster @Inject constructor(
    private val openConnections: OpenConnections,
) {

    fun canvasAdded(canvas: CanvasSummaryDto) = broadcast(LobbyServerMessage.CanvasAdded(canvas))

    fun canvasUpdated(canvas: CanvasSummaryDto) = broadcast(LobbyServerMessage.CanvasUpdated(canvas))

    fun canvasRemoved(id: UUID) = broadcast(LobbyServerMessage.CanvasRemoved(id))

    private fun broadcast(message: LobbyServerMessage) {
        openConnections.findByEndpointId(LobbyWebSocketEndpoint.ENDPOINT_ID).forEach { it.sendTextAndAwait(message) }
    }
}
