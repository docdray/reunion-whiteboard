package org.reunion.canvas

import io.quarkus.test.junit.QuarkusTest
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.reunion.canvas.entity.CanvasEntity
import org.reunion.canvas.repository.CanvasRepository
import org.reunion.canvas.service.CanvasObjectService
import org.reunion.canvas.shape.ArrowShapeData
import org.reunion.canvas.shape.CircleShapeData
import org.reunion.canvas.shape.EllipseShapeData
import org.reunion.canvas.shape.FreehandShapeData
import org.reunion.canvas.shape.LineShapeData
import org.reunion.canvas.shape.PointDto
import org.reunion.canvas.shape.RectShapeData
import org.reunion.canvas.shape.ShapeData
import org.reunion.canvas.shape.TextShapeData
import java.time.Instant
import java.util.UUID
import java.util.stream.Stream

@QuarkusTest
class CanvasObjectServiceTest {

    @Inject
    lateinit var canvasObjectService: CanvasObjectService

    @Inject
    lateinit var canvasRepository: CanvasRepository

    @Transactional
    fun createCanvas(): UUID {
        val entity = CanvasEntity().apply {
            name = "Testcanvas ${UUID.randomUUID()}"
            createdAt = Instant.now()
        }
        canvasRepository.persist(entity)
        return entity.id
    }

    companion object {
        @JvmStatic
        fun shapeSamples(): Stream<ShapeData> = Stream.of(
            FreehandShapeData(color = "#ff0000", strokeWidth = 2.0, points = listOf(PointDto(1.0, 2.0), PointDto(3.0, 4.0))),
            LineShapeData(color = "#00ff00", strokeWidth = 1.5, x1 = 0.0, y1 = 0.0, x2 = 10.0, y2 = 10.0),
            RectShapeData(color = "#0000ff", strokeWidth = 3.0, filled = true, x = 5.0, y = 5.0, width = 20.0, height = 30.0),
            CircleShapeData(color = "#ffff00", strokeWidth = 1.0, filled = false, x = 1.0, y = 1.0, radius = 15.0),
            EllipseShapeData(color = "#ff00ff", strokeWidth = 2.5, filled = true, x = 2.0, y = 2.0, radiusX = 12.0, radiusY = 8.0),
            TextShapeData(
                color = "#000000", x = 3.0, y = 3.0, content = "Hallo Welt",
                fontFamily = "Arial", fontSize = 16.0,
                bold = true, italic = false, underline = true, strikethrough = false,
            ),
            ArrowShapeData(color = "#123456", strokeWidth = 2.0, filled = true, x1 = 0.0, y1 = 0.0, x2 = 40.0, y2 = 20.0, doubleHeaded = false),
            ArrowShapeData(color = "#654321", strokeWidth = 3.0, filled = false, x1 = 5.0, y1 = 5.0, x2 = -10.0, y2 = 15.0, doubleHeaded = true),
        )
    }

    @ParameterizedTest
    @MethodSource("shapeSamples")
    fun `json roundtrip preserves all fields for each shape type`(shape: ShapeData) {
        val canvasId = createCanvas()

        val created = canvasObjectService.create(canvasId, shape)
        assertEquals(shape, created.data)

        val loaded = canvasObjectService.listForCanvas(canvasId)
        assertEquals(1, loaded.size)
        assertEquals(shape, loaded.first().data)
    }

    @Test
    fun `sequence is ordered by insertion order per canvas`() {
        val canvasId = createCanvas()

        val first = canvasObjectService.create(canvasId, LineShapeData("#111111", 1.0, 0.0, 0.0, 1.0, 1.0))
        val second = canvasObjectService.create(canvasId, LineShapeData("#222222", 1.0, 0.0, 0.0, 2.0, 2.0))
        val third = canvasObjectService.create(canvasId, LineShapeData("#333333", 1.0, 0.0, 0.0, 3.0, 3.0))

        val ordered = canvasObjectService.listForCanvas(canvasId)
        assertEquals(listOf(first.id, second.id, third.id), ordered.map { it.id })
        assertEquals(listOf(0L, 1L, 2L), ordered.map { it.sequence })
    }

    @Test
    fun `update changes geometry and delete removes objects`() {
        val canvasId = createCanvas()
        val created = canvasObjectService.create(canvasId, RectShapeData("#abcabc", 1.0, false, 0.0, 0.0, 10.0, 10.0))

        val moved = RectShapeData("#abcabc", 1.0, false, 50.0, 50.0, 10.0, 10.0)
        val updated = canvasObjectService.update(listOf(created.id to moved))
        assertEquals(moved, updated.first().data)
        assertEquals(moved, canvasObjectService.listForCanvas(canvasId).first().data)

        canvasObjectService.delete(canvasId, listOf(created.id))
        assertEquals(0, canvasObjectService.listForCanvas(canvasId).size)
    }
}
