package org.reunion.canvas.presence

import jakarta.enterprise.context.ApplicationScoped
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Wer ist aktuell mit welchem Canvas verbunden. Rein transiente Laufzeit-Information,
 * wird nicht persistiert.
 */
@ApplicationScoped
class PresenceRegistry {
    private val byCanvas = ConcurrentHashMap<UUID, ConcurrentHashMap<String, PresenceInfo>>()

    fun join(canvasId: UUID, connectionId: String, displayName: String): PresenceInfo {
        val info = PresenceInfo(userId = connectionId, displayName = displayName, color = PresenceColors.next())
        byCanvas.computeIfAbsent(canvasId) { ConcurrentHashMap() }[connectionId] = info
        return info
    }

    fun leave(canvasId: UUID, connectionId: String): PresenceInfo? =
        byCanvas[canvasId]?.remove(connectionId)

    fun updateCursor(canvasId: UUID, connectionId: String, x: Double, y: Double): PresenceInfo? {
        val connections = byCanvas[canvasId] ?: return null
        val current = connections[connectionId] ?: return null
        val updated = current.copy(cursorX = x, cursorY = y)
        connections[connectionId] = updated
        return updated
    }

    fun others(canvasId: UUID, excludingConnectionId: String): List<PresenceInfo> =
        byCanvas[canvasId]?.filterKeys { it != excludingConnectionId }?.values?.toList() ?: emptyList()

    fun activeUserCount(canvasId: UUID): Int = byCanvas[canvasId]?.size ?: 0
}
