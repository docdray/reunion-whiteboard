package org.reunion.canvas.ws

import io.quarkus.websockets.next.HandshakeRequest
import io.quarkus.websockets.next.OnClose
import io.quarkus.websockets.next.OnOpen
import io.quarkus.websockets.next.OnTextMessage
import io.quarkus.websockets.next.PathParam
import io.quarkus.websockets.next.WebSocket
import io.quarkus.websockets.next.WebSocketConnection
import jakarta.inject.Inject
import org.reunion.canvas.presence.PresenceRegistry
import org.reunion.canvas.service.CanvasObjectService
import org.reunion.canvas.ws.protocol.ClientMessage
import org.reunion.canvas.ws.protocol.ServerMessage
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.UUID

/**
 * Ein Singleton-Bean, geteilt von ALLEN Verbindungen zu diesem Endpoint über alle Canvases hinweg.
 * `connection.broadcast()` adressiert daher standardmaessig ALLE Canvases gleichzeitig - jeder
 * Broadcast MUSS ueber `.filter { it.pathParam("canvasId") == canvasId }` auf den aktuellen Canvas
 * eingeschraenkt werden, sonst lecken Nachrichten zwischen unabhaengigen Canvases.
 */
@WebSocket(path = "/ws/canvas/{canvasId}")
class CanvasWebSocketEndpoint @Inject constructor(
    private val presence: PresenceRegistry,
    private val canvasObjectService: CanvasObjectService,
) {

    @OnOpen
    fun onOpen(
        connection: WebSocketConnection,
        handshake: HandshakeRequest,
        @PathParam canvasId: String,
    ): ServerMessage.InitialState {
        val id = UUID.fromString(canvasId)
        val displayName = parseDisplayName(handshake.query())
        val info = presence.join(id, connection.id(), displayName)
        val objects = canvasObjectService.listForCanvas(id)
        val others = presence.others(id, connection.id())

        connection.broadcast()
            .filter { it.id() != connection.id() && it.pathParam("canvasId") == canvasId }
            .sendTextAndAwait(ServerMessage.UserJoined(info.userId, info.displayName, info.color))

        return ServerMessage.InitialState(
            selfUserId = info.userId,
            selfColor = info.color,
            objects = objects,
            users = others,
        )
    }

    @OnTextMessage
    fun onMessage(connection: WebSocketConnection, @PathParam canvasId: String, message: ClientMessage) {
        val id = UUID.fromString(canvasId)
        when (message) {
            is ClientMessage.CursorMove -> {
                presence.updateCursor(id, connection.id(), message.x, message.y)
                connection.broadcast()
                    .filter { it.id() != connection.id() && it.pathParam("canvasId") == canvasId }
                    .sendTextAndAwait(ServerMessage.PresenceUpdate(connection.id(), message.x, message.y))
            }

            is ClientMessage.DrawPreview -> {
                connection.broadcast()
                    .filter { it.id() != connection.id() && it.pathParam("canvasId") == canvasId }
                    .sendTextAndAwait(ServerMessage.DrawPreviewRelay(connection.id(), message.shapeType, message.data))
            }

            is ClientMessage.ObjectCreate -> {
                val created = canvasObjectService.create(id, message.data)
                connection.broadcast()
                    .filter { it.pathParam("canvasId") == canvasId }
                    .sendTextAndAwait(ServerMessage.ObjectCreated(created))
            }

            is ClientMessage.ObjectUpdate -> {
                val updated = canvasObjectService.update(message.objects.map { it.id to it.data })
                connection.broadcast()
                    .filter { it.pathParam("canvasId") == canvasId }
                    .sendTextAndAwait(ServerMessage.ObjectUpdated(updated))
            }

            is ClientMessage.ObjectDelete -> {
                canvasObjectService.delete(id, message.ids)
                connection.broadcast()
                    .filter { it.pathParam("canvasId") == canvasId }
                    .sendTextAndAwait(ServerMessage.ObjectDeleted(message.ids))
            }
        }
    }

    @OnClose
    fun onClose(connection: WebSocketConnection, @PathParam canvasId: String) {
        val removed = presence.leave(UUID.fromString(canvasId), connection.id()) ?: return
        connection.broadcast()
            .filter { it.id() != connection.id() && it.pathParam("canvasId") == canvasId }
            .sendTextAndAwait(ServerMessage.UserLeft(removed.userId))
    }

    private fun parseDisplayName(query: String?): String {
        if (query.isNullOrBlank()) return "Anonymous"
        return query.split("&")
            .mapNotNull { part ->
                val idx = part.indexOf('=')
                if (idx < 0) null else part.substring(0, idx) to part.substring(idx + 1)
            }
            .firstOrNull { it.first == "name" }
            ?.second
            ?.let { URLDecoder.decode(it, StandardCharsets.UTF_8) }
            ?.takeIf { it.isNotBlank() }
            ?: "Anonymous"
    }
}
