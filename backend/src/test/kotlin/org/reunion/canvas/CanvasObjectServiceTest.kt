package org.reunion.canvas

import com.fasterxml.jackson.databind.ObjectMapper
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
import org.reunion.canvas.shape.StickyNoteShapeData
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

    @Inject
    lateinit var objectMapper: ObjectMapper

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
            StickyNoteShapeData(
                color = "#fff59d", x = 4.0, y = 4.0, width = 160.0, height = 120.0, content = "Notiz",
                fontFamily = "Arial", fontSize = 14.0,
                bold = false, italic = true, underline = false, strikethrough = true,
                textColor = "#003366",
            ),
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
    fun `sticky-note json without textColor deserializes with default text color for backward compatibility`() {
        val legacyJson = """
            {"type":"sticky-note","color":"#fff59d","x":1.0,"y":2.0,"width":160.0,"height":120.0,
             "content":"Alte Notiz","fontFamily":"Arial","fontSize":14.0,
             "bold":false,"italic":false,"underline":false,"strikethrough":false}
        """.trimIndent()

        val deserialized = objectMapper.readValue(legacyJson, ShapeData::class.java)

        assertEquals(StickyNoteShapeData::class.java, deserialized.javaClass)
        assertEquals("#1a1a1a", (deserialized as StickyNoteShapeData).textColor)
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
        val updated = canvasObjectService.update(canvasId, listOf(created.id to moved))
        assertEquals(moved, updated.first().data)
        assertEquals(moved, canvasObjectService.listForCanvas(canvasId).first().data)

        canvasObjectService.delete(canvasId, listOf(created.id))
        assertEquals(0, canvasObjectService.listForCanvas(canvasId).size)
    }

    @Test
    fun `update ignores ids that belong to a different canvas`() {
        val canvasA = createCanvas()
        val canvasB = createCanvas()
        val objectInA = canvasObjectService.create(canvasA, RectShapeData("#111111", 1.0, false, 0.0, 0.0, 10.0, 10.0))
        val objectInB = canvasObjectService.create(canvasB, RectShapeData("#222222", 1.0, false, 0.0, 0.0, 10.0, 10.0))

        // Ein Client in canvasB versucht, ein Objekt aus canvasA zu aendern (z.B. veraltete ID
        // aus einem zweiten Tab) - das darf nicht wirken.
        val attackPayload = RectShapeData("#ffffff", 1.0, false, 99.0, 99.0, 1.0, 1.0)
        val result = canvasObjectService.update(canvasB, listOf(objectInA.id to attackPayload))

        assertEquals(0, result.size, "fremde ID darf nicht aktualisiert werden")
        assertEquals(
            objectInA.data,
            canvasObjectService.listForCanvas(canvasA).first().data,
            "Objekt in canvasA darf unveraendert bleiben",
        )
        assertEquals(objectInB.data, canvasObjectService.listForCanvas(canvasB).first().data)
    }

    @Test
    fun `update ignores ids that no longer exist`() {
        val canvasId = createCanvas()
        val result = canvasObjectService.update(canvasId, listOf(UUID.randomUUID() to RectShapeData("#000000", 1.0, false, 0.0, 0.0, 1.0, 1.0)))
        assertEquals(0, result.size)
    }
}
