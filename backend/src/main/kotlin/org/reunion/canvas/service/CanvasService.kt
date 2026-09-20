package org.reunion.canvas.service

import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import org.reunion.canvas.dto.CanvasSummaryDto
import org.reunion.canvas.entity.CanvasEntity
import org.reunion.canvas.presence.PresenceRegistry
import org.reunion.canvas.repository.CanvasRepository
import org.reunion.canvas.ws.LobbyBroadcaster
import java.time.Instant
import java.util.UUID

class CanvasHasActiveUsersException(val canvasId: UUID) : RuntimeException("Canvas $canvasId has active users")
class CanvasNotFoundException(val canvasId: UUID) : RuntimeException("Canvas $canvasId not found")

@ApplicationScoped
class CanvasService @Inject constructor(
    private val canvasRepository: CanvasRepository,
    private val presenceRegistry: PresenceRegistry,
    private val lobbyBroadcaster: LobbyBroadcaster,
) {

    @Transactional
    fun list(): List<CanvasSummaryDto> =
        canvasRepository.listAll().map { it.toDto() }

    @Transactional
    fun getSummary(id: UUID): CanvasSummaryDto? =
        canvasRepository.findById(id)?.toDto()

    @Transactional
    fun create(name: String): CanvasSummaryDto {
        val entity = CanvasEntity().apply {
            this.name = name
            this.createdAt = Instant.now()
        }
        canvasRepository.persist(entity)
        val dto = entity.toDto()
        lobbyBroadcaster.canvasAdded(dto)
        return dto
    }

    @Transactional
    fun delete(id: UUID) {
        if (presenceRegistry.activeUserCount(id) > 0) {
            throw CanvasHasActiveUsersException(id)
        }
        val deleted = canvasRepository.deleteById(id)
        if (!deleted) {
            throw CanvasNotFoundException(id)
        }
        lobbyBroadcaster.canvasRemoved(id)
    }

    private fun CanvasEntity.toDto() = CanvasSummaryDto(
        id = id,
        name = name,
        createdAt = createdAt,
        activeUsers = presenceRegistry.activeUserCount(id),
    )
}
