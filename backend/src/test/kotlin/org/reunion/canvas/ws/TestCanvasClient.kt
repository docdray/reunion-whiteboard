package org.reunion.canvas.ws

import io.quarkus.websockets.next.OnTextMessage
import io.quarkus.websockets.next.WebSocketClient
import io.quarkus.websockets.next.WebSocketClientConnection
import jakarta.enterprise.context.ApplicationScoped
import org.reunion.canvas.ws.protocol.ServerMessage
import java.util.concurrent.BlockingQueue
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.LinkedBlockingQueue

/**
 * Test-Client fuer CanvasWebSocketEndpointTest. Als Singleton-CDI-Bean werden alle Verbindungen,
 * die ueber diesen Client-Typ geoeffnet werden, von DERSELBEN Instanz bedient - eingehende
 * Nachrichten werden daher pro Connection-ID in eine eigene Queue sortiert.
 */
@WebSocketClient(path = "/ws/canvas/{canvasId}?name={displayName}")
@ApplicationScoped
class TestCanvasClient {
    private val queues = ConcurrentHashMap<String, BlockingQueue<ServerMessage>>()

    @OnTextMessage
    fun onMessage(connection: WebSocketClientConnection, message: ServerMessage) {
        queueFor(connection).put(message)
    }

    fun queueFor(connection: WebSocketClientConnection): BlockingQueue<ServerMessage> =
        queues.getOrPut(connection.id()) { LinkedBlockingQueue() }
}
