package org.reunion.canvas.shape

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

data class PointDto(val x: Double, val y: Double)

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes(
    JsonSubTypes.Type(FreehandShapeData::class, name = "freehand"),
    JsonSubTypes.Type(LineShapeData::class, name = "line"),
    JsonSubTypes.Type(RectShapeData::class, name = "rect"),
    JsonSubTypes.Type(CircleShapeData::class, name = "circle"),
    JsonSubTypes.Type(EllipseShapeData::class, name = "ellipse"),
    JsonSubTypes.Type(TextShapeData::class, name = "text"),
)
sealed interface ShapeData {
    val color: String
}

data class FreehandShapeData(
    override val color: String,
    val strokeWidth: Double,
    val points: List<PointDto>,
) : ShapeData

data class LineShapeData(
    override val color: String,
    val strokeWidth: Double,
    val x1: Double,
    val y1: Double,
    val x2: Double,
    val y2: Double,
) : ShapeData

data class RectShapeData(
    override val color: String,
    val strokeWidth: Double,
    val filled: Boolean,
    val x: Double,
    val y: Double,
    val width: Double,
    val height: Double,
) : ShapeData

data class CircleShapeData(
    override val color: String,
    val strokeWidth: Double,
    val filled: Boolean,
    val x: Double,
    val y: Double,
    val radius: Double,
) : ShapeData

data class EllipseShapeData(
    override val color: String,
    val strokeWidth: Double,
    val filled: Boolean,
    val x: Double,
    val y: Double,
    val radiusX: Double,
    val radiusY: Double,
) : ShapeData

data class TextShapeData(
    override val color: String,
    val x: Double,
    val y: Double,
    val content: String,
    val fontFamily: String,
    val fontSize: Double,
    val bold: Boolean,
    val italic: Boolean,
    val underline: Boolean,
    val strikethrough: Boolean,
) : ShapeData

/** Discriminator value used both as the JSON "type" and as CanvasObjectEntity.type. */
val ShapeData.typeName: String
    get() = when (this) {
        is FreehandShapeData -> "freehand"
        is LineShapeData -> "line"
        is RectShapeData -> "rect"
        is CircleShapeData -> "circle"
        is EllipseShapeData -> "ellipse"
        is TextShapeData -> "text"
    }
