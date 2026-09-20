package org.reunion.canvas.dto

import org.reunion.canvas.shape.ShapeData
import java.util.UUID

data class CanvasObjectDto(
    val id: UUID,
    val type: String,
    val sequence: Long,
    val data: ShapeData,
)
