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

    /** Eine JVM-Monitor-Sperre pro canvasId, geteilt von [join] und [withCanvasLock]. */
    private val canvasLocks = ConcurrentHashMap<UUID, Any>()

    private fun lockFor(canvasId: UUID): Any = canvasLocks.computeIfAbsent(canvasId) { Any() }

    /**
     * Fuehrt [block] unter derselben Sperre aus wie [join] fuer diese canvasId. Damit kann z.B.
     * eine "sind noch Nutzer da?"-Pruefung gefolgt von einer Loesch-Aktion atomar gegenueber
     * einem gleichzeitig beitretenden Nutzer gemacht werden (verhindert eine TOCTOU-Race beim
     * Canvas-Loeschen). Fuer eine Einzelinstanz-App ohne Clusterung reicht eine einfache
     * In-Process-Sperre.
     */
    fun <T> withCanvasLock(canvasId: UUID, block: () -> T): T =
        synchronized(lockFor(canvasId)) { block() }

    fun join(canvasId: UUID, connectionId: String, displayName: String): PresenceInfo =
        synchronized(lockFor(canvasId)) {
            val info = PresenceInfo(userId = connectionId, displayName = displayName, color = PresenceColors.next())
            byCanvas.computeIfAbsent(canvasId) { ConcurrentHashMap() }[connectionId] = info
            info
        }

    fun leave(canvasId: UUID, connectionId: String): PresenceInfo? =
        synchronized(lockFor(canvasId)) {
            val connections = byCanvas[canvasId] ?: return@synchronized null
            val removed = connections.remove(connectionId)
            // Nur den (jetzt leeren) Praesenz-Eintrag entfernen, NICHT das Lock-Objekt selbst -
            // ein zwischenzeitlich entferntes Lock-Objekt koennte dazu fuehren, dass ein
            // gleichzeitiger Aufrufer ueber lockFor() ein ANDERES Lock-Objekt fuer dieselbe
            // canvasId erhaelt und die gegenseitige Ausschliessung mit withCanvasLock/join
            // umgeht. Ein Lock-Objekt pro jemals genutzter canvasId ist vernachlaessigbar klein.
            if (connections.isEmpty()) {
                byCanvas.remove(canvasId)
            }
            removed
        }

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
