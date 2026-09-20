package org.reunion.canvas.ws

import io.quarkus.websockets.next.OnOpen
import io.quarkus.websockets.next.WebSocket
import jakarta.inject.Inject
import org.reunion.canvas.service.CanvasService
import org.reunion.canvas.ws.protocol.LobbyServerMessage

/**
 * Reiner Server-Push-Kanal fuer den Startbildschirm: kein Client->Server-Nachrichtentyp noetig,
 * Updates entstehen ausschliesslich durch [LobbyBroadcaster] (Canvas angelegt/geloescht/Praesenz
 * geaendert).
 */
@WebSocket(path = "/ws/canvases", endpointId = LobbyWebSocketEndpoint.ENDPOINT_ID)
class LobbyWebSocketEndpoint @Inject constructor(
    private val canvasService: CanvasService,
) {

    companion object {
        const val ENDPOINT_ID = "lobby"
    }

    @OnOpen
    fun onOpen(): LobbyServerMessage.LobbyInitialState =
        LobbyServerMessage.LobbyInitialState(canvasService.list())
}
