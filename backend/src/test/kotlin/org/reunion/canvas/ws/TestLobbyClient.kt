package org.reunion.canvas.ws

import io.quarkus.websockets.next.OnTextMessage
import io.quarkus.websockets.next.WebSocketClient
import io.quarkus.websockets.next.WebSocketClientConnection
import jakarta.enterprise.context.ApplicationScoped
import org.reunion.canvas.ws.protocol.LobbyServerMessage
import java.util.concurrent.BlockingQueue
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.LinkedBlockingQueue

/**
 * Test-Client fuer LobbyWebSocketEndpointTest, analog zu [TestCanvasClient].
 */
@WebSocketClient(path = "/ws/canvases")
@ApplicationScoped
class TestLobbyClient {
    private val queues = ConcurrentHashMap<String, BlockingQueue<LobbyServerMessage>>()

    @OnTextMessage
    fun onMessage(connection: WebSocketClientConnection, message: LobbyServerMessage) {
        queueFor(connection).put(message)
    }

    fun queueFor(connection: WebSocketClientConnection): BlockingQueue<LobbyServerMessage> =
        queues.getOrPut(connection.id()) { LinkedBlockingQueue() }
}
