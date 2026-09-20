package org.reunion.canvas.ws

import io.quarkus.test.common.http.TestHTTPResource
import io.quarkus.test.junit.QuarkusTest
import io.quarkus.websockets.next.WebSocketClientConnection
import io.quarkus.websockets.next.WebSocketConnector
import jakarta.enterprise.inject.Instance
import jakarta.inject.Inject
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.reunion.canvas.service.CanvasObjectService
import org.reunion.canvas.service.CanvasService
import org.reunion.canvas.shape.LineShapeData
import org.reunion.canvas.shape.RectShapeData
import org.reunion.canvas.ws.protocol.ClientMessage
import org.reunion.canvas.ws.protocol.ServerMessage
import java.net.URI
import java.util.UUID
import java.util.concurrent.TimeUnit

@QuarkusTest
class CanvasWebSocketEndpointTest {

    @Inject
    lateinit var canvasService: CanvasService

    @Inject
    lateinit var canvasObjectService: CanvasObjectService

    @Inject
    lateinit var testClient: TestCanvasClient

    @Inject
    lateinit var connectorInstance: Instance<WebSocketConnector<TestCanvasClient>>

    @TestHTTPResource
    lateinit var testUri: URI

    private fun connect(canvasId: UUID, name: String): WebSocketClientConnection {
        val baseUri = URI("http", null, testUri.host, testUri.port, null, null, null)
        return connectorInstance.get()
            .baseUri(baseUri)
            .pathParam("canvasId", canvasId.toString())
            .pathParam("displayName", name)
            .connectAndAwait()
    }

    private fun nextMessage(connection: WebSocketClientConnection): ServerMessage {
        val message = testClient.queueFor(connection).poll(5, TimeUnit.SECONDS)
        return checkNotNull(message) { "Keine Nachricht innerhalb von 5s empfangen" }
    }

    private fun assertNoMessage(connection: WebSocketClientConnection) {
        assertNull(testClient.queueFor(connection).poll(1, TimeUnit.SECONDS))
    }

    @Test
    fun `connect receives initial state with empty object list`() {
        val canvasId = canvasService.create("WS Test Canvas 1").id
        val connection = connect(canvasId, "Alice")

        val initial = nextMessage(connection) as ServerMessage.InitialState
        assertEquals(emptyList<Any>(), initial.objects)
        assertEquals(emptyList<Any>(), initial.users)

        connection.closeAndAwait()
    }

    @Test
    fun `second client join notifies first client`() {
        val canvasId = canvasService.create("WS Test Canvas 2").id
        val connectionA = connect(canvasId, "Alice")
        nextMessage(connectionA)

        val connectionB = connect(canvasId, "Bob")
        nextMessage(connectionB)

        val joined = nextMessage(connectionA) as ServerMessage.UserJoined
        assertEquals("Bob", joined.displayName)

        connectionA.closeAndAwait()
        connectionB.closeAndAwait()
    }

    @Test
    fun `object create is persisted and broadcast to both clients`() {
        val canvasId = canvasService.create("WS Test Canvas 3").id
        val connectionA = connect(canvasId, "Alice")
        nextMessage(connectionA)
        val connectionB = connect(canvasId, "Bob")
        nextMessage(connectionB)
        nextMessage(connectionA) as ServerMessage.UserJoined

        val shape = RectShapeData(color = "#123456", strokeWidth = 2.0, filled = true, x = 1.0, y = 1.0, width = 10.0, height = 10.0)
        connectionA.sendTextAndAwait(ClientMessage.ObjectCreate(shapeType = "rect", data = shape))

        val createdOnA = nextMessage(connectionA) as ServerMessage.ObjectCreated
        val createdOnB = nextMessage(connectionB) as ServerMessage.ObjectCreated
        assertEquals(shape, createdOnA.obj.data)
        assertEquals(createdOnA.obj.id, createdOnB.obj.id)
        assertEquals(1, canvasObjectService.listForCanvas(canvasId).size)

        connectionA.closeAndAwait()
        connectionB.closeAndAwait()
    }

    @Test
    fun `draw preview is relayed to others but not persisted and not echoed back`() {
        val canvasId = canvasService.create("WS Test Canvas 4").id
        val connectionA = connect(canvasId, "Alice")
        nextMessage(connectionA)
        val connectionB = connect(canvasId, "Bob")
        nextMessage(connectionB)
        nextMessage(connectionA) as ServerMessage.UserJoined

        val previewShape = LineShapeData(color = "#654321", strokeWidth = 1.0, x1 = 0.0, y1 = 0.0, x2 = 5.0, y2 = 5.0)
        connectionA.sendTextAndAwait(ClientMessage.DrawPreview(shapeType = "line", data = previewShape))

        val relayed = nextMessage(connectionB) as ServerMessage.DrawPreviewRelay
        assertEquals(previewShape, relayed.data)
        assertNoMessage(connectionA)
        assertEquals(0, canvasObjectService.listForCanvas(canvasId).size)

        connectionA.closeAndAwait()
        connectionB.closeAndAwait()
    }

    @Test
    fun `disconnect notifies remaining client`() {
        val canvasId = canvasService.create("WS Test Canvas 5").id
        val connectionA = connect(canvasId, "Alice")
        nextMessage(connectionA)
        val connectionB = connect(canvasId, "Bob")
        nextMessage(connectionB)
        nextMessage(connectionA) as ServerMessage.UserJoined

        connectionB.closeAndAwait()

        val left = nextMessage(connectionA) as ServerMessage.UserLeft
        assertNotEquals("", left.userId)

        connectionA.closeAndAwait()
    }

    @Test
    fun `broadcasts are isolated per canvas`() {
        val canvasId1 = canvasService.create("WS Test Canvas Isolation 1").id
        val canvasId2 = canvasService.create("WS Test Canvas Isolation 2").id

        val connection1 = connect(canvasId1, "Alice")
        nextMessage(connection1)
        val connection2 = connect(canvasId2, "Bob")
        nextMessage(connection2)

        val shape = LineShapeData(color = "#000001", strokeWidth = 1.0, x1 = 0.0, y1 = 0.0, x2 = 1.0, y2 = 1.0)
        connection1.sendTextAndAwait(ClientMessage.ObjectCreate(shapeType = "line", data = shape))
        nextMessage(connection1) as ServerMessage.ObjectCreated

        assertNoMessage(connection2)
        assertEquals(1, canvasObjectService.listForCanvas(canvasId1).size)
        assertEquals(0, canvasObjectService.listForCanvas(canvasId2).size)

        connection1.closeAndAwait()
        connection2.closeAndAwait()
    }
}
