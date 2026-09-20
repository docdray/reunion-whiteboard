package org.reunion.canvas.ws

import io.quarkus.test.common.http.TestHTTPResource
import io.quarkus.test.junit.QuarkusTest
import io.quarkus.websockets.next.WebSocketClientConnection
import io.quarkus.websockets.next.WebSocketConnector
import jakarta.enterprise.inject.Instance
import jakarta.inject.Inject
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.reunion.canvas.service.CanvasService
import org.reunion.canvas.ws.protocol.LobbyServerMessage
import java.net.URI
import java.util.UUID
import java.util.concurrent.TimeUnit

@QuarkusTest
class LobbyWebSocketEndpointTest {

    @Inject
    lateinit var canvasService: CanvasService

    @Inject
    lateinit var lobbyTestClient: TestLobbyClient

    @Inject
    lateinit var lobbyConnectorInstance: Instance<WebSocketConnector<TestLobbyClient>>

    @Inject
    lateinit var canvasTestClient: TestCanvasClient

    @Inject
    lateinit var canvasConnectorInstance: Instance<WebSocketConnector<TestCanvasClient>>

    @TestHTTPResource
    lateinit var testUri: URI

    private fun baseUri() = URI("http", null, testUri.host, testUri.port, null, null, null)

    private fun connectLobby(): WebSocketClientConnection =
        lobbyConnectorInstance.get().baseUri(baseUri()).connectAndAwait()

    private fun connectCanvas(canvasId: UUID, name: String): WebSocketClientConnection =
        canvasConnectorInstance.get()
            .baseUri(baseUri())
            .pathParam("canvasId", canvasId.toString())
            .pathParam("displayName", name)
            .connectAndAwait()

    private fun nextLobbyMessage(connection: WebSocketClientConnection): LobbyServerMessage {
        val message = lobbyTestClient.queueFor(connection).poll(5, TimeUnit.SECONDS)
        return checkNotNull(message) { "Keine Lobby-Nachricht innerhalb von 5s empfangen" }
    }

    private fun assertNoLobbyMessage(connection: WebSocketClientConnection) {
        assertNull(lobbyTestClient.queueFor(connection).poll(1, TimeUnit.SECONDS))
    }

    @Test
    fun `connect receives current canvas list as initial state`() {
        val canvasId = canvasService.create("Lobby Test Canvas 1").id
        val connection = connectLobby()

        val initial = nextLobbyMessage(connection) as LobbyServerMessage.LobbyInitialState
        assertEquals(true, initial.canvases.any { it.id == canvasId })

        connection.closeAndAwait()
    }

    @Test
    fun `creating a canvas notifies connected lobby clients`() {
        val connection = connectLobby()
        nextLobbyMessage(connection) as LobbyServerMessage.LobbyInitialState

        val canvasId = canvasService.create("Lobby Test Canvas 2").id

        val added = nextLobbyMessage(connection) as LobbyServerMessage.CanvasAdded
        assertEquals(canvasId, added.canvas.id)
        assertEquals("Lobby Test Canvas 2", added.canvas.name)

        connection.closeAndAwait()
    }

    @Test
    fun `deleting a canvas notifies connected lobby clients`() {
        val canvasId = canvasService.create("Lobby Test Canvas 3").id
        val connection = connectLobby()
        nextLobbyMessage(connection) as LobbyServerMessage.LobbyInitialState

        canvasService.delete(canvasId)

        val removed = nextLobbyMessage(connection) as LobbyServerMessage.CanvasRemoved
        assertEquals(canvasId, removed.id)

        connection.closeAndAwait()
    }

    @Test
    fun `joining and leaving a canvas updates active user count for lobby clients`() {
        val canvasId = canvasService.create("Lobby Test Canvas 4").id
        val lobbyConnection = connectLobby()
        nextLobbyMessage(lobbyConnection) as LobbyServerMessage.LobbyInitialState

        val canvasConnection = connectCanvas(canvasId, "Alice")
        canvasTestClient.queueFor(canvasConnection).poll(5, TimeUnit.SECONDS) // eigenes initial-state der Canvas-Verbindung abholen

        val updatedOnJoin = nextLobbyMessage(lobbyConnection) as LobbyServerMessage.CanvasUpdated
        assertEquals(canvasId, updatedOnJoin.canvas.id)
        assertEquals(1, updatedOnJoin.canvas.activeUsers)

        canvasConnection.closeAndAwait()

        val updatedOnLeave = nextLobbyMessage(lobbyConnection) as LobbyServerMessage.CanvasUpdated
        assertEquals(canvasId, updatedOnLeave.canvas.id)
        assertEquals(0, updatedOnLeave.canvas.activeUsers)

        lobbyConnection.closeAndAwait()
    }
}
