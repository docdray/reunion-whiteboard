package org.reunion.canvas.dto

import java.time.Instant
import java.util.UUID

data class CanvasSummaryDto(
    val id: UUID,
    val name: String,
    val createdAt: Instant,
    val activeUsers: Int,
)
