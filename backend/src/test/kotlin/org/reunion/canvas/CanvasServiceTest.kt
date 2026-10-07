package org.reunion.canvas

import io.quarkus.test.junit.QuarkusTest
import jakarta.inject.Inject
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.reunion.canvas.presence.PresenceRegistry
import org.reunion.canvas.service.CanvasObjectService
import org.reunion.canvas.service.CanvasService
import org.reunion.canvas.shape.RectShapeData
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@QuarkusTest
class CanvasServiceTest {

    @Inject
    lateinit var canvasService: CanvasService

    @Inject
    lateinit var canvasObjectService: CanvasObjectService

    @Inject
    lateinit var presenceRegistry: PresenceRegistry

    @Test
    fun `deleting a canvas also deletes its objects`() {
        val created = canvasService.create("Zum Loeschen")
        canvasObjectService.create(created.id, RectShapeData("#111111", 1.0, false, 0.0, 0.0, 10.0, 10.0))
        canvasObjectService.create(created.id, RectShapeData("#222222", 1.0, false, 0.0, 0.0, 10.0, 10.0))
        assertEquals(2, canvasObjectService.listForCanvas(created.id).size)

        canvasService.delete(created.id)

        assertEquals(0, canvasObjectService.listForCanvas(created.id).size, "Objekte muessen mit dem Canvas verschwinden")
    }

    @Test
    fun `withCanvasLock serializes delete against a concurrent join`() {
        val canvasId = UUID.randomUUID()
        val joinAttempted = CountDownLatch(1)
        val joinFinished = CountDownLatch(1)

        val joiner = Thread {
            joinAttempted.countDown()
            presenceRegistry.join(canvasId, "late-joiner", "Bob")
            joinFinished.countDown()
        }

        presenceRegistry.withCanvasLock(canvasId) {
            joiner.start()
            assertTrue(joinAttempted.await(1, TimeUnit.SECONDS))
            // Der Beitritt muss blockieren, solange wir die Sperre fuer diese canvasId halten.
            assertFalse(joinFinished.await(200, TimeUnit.MILLISECONDS))
            assertEquals(0, presenceRegistry.activeUserCount(canvasId), "waehrend der Sperre darf niemand beigetreten sein")
        }

        assertTrue(joinFinished.await(1, TimeUnit.SECONDS), "nach Freigabe der Sperre muss der Beitritt durchlaufen")
        assertEquals(1, presenceRegistry.activeUserCount(canvasId))

        presenceRegistry.leave(canvasId, "late-joiner")
    }
}
