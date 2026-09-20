package org.reunion.canvas.presence

data class PresenceInfo(
    val userId: String,
    val displayName: String,
    val color: String,
    val cursorX: Double? = null,
    val cursorY: Double? = null,
)
