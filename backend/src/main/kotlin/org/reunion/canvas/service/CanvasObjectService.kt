package org.reunion.canvas.service

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import org.reunion.canvas.dto.CanvasObjectDto
import org.reunion.canvas.entity.CanvasObjectEntity
import org.reunion.canvas.repository.CanvasObjectRepository
import org.reunion.canvas.shape.ShapeData
import org.reunion.canvas.shape.typeName
import java.time.Instant
import java.util.UUID

@ApplicationScoped
class CanvasObjectService @Inject constructor(
    private val repository: CanvasObjectRepository,
    private val objectMapper: ObjectMapper,
) {

    @Transactional
    fun listForCanvas(canvasId: UUID): List<CanvasObjectDto> =
        repository.listByCanvasOrderedBySequence(canvasId).map { it.toDto() }

    @Transactional
    fun create(canvasId: UUID, data: ShapeData): CanvasObjectDto {
        val entity = CanvasObjectEntity().apply {
            this.canvasId = canvasId
            this.type = data.typeName
            this.sequence = repository.nextSequence(canvasId)
            this.createdAt = Instant.now()
            this.data = objectMapper.writeValueAsString(data)
        }
        repository.persist(entity)
        return entity.toDto()
    }

    /**
     * Aktualisiert nur Objekte, die TATSAECHLICH zu [canvasId] gehoeren - IDs, die nicht
     * existieren oder zu einem anderen Canvas gehoeren, werden still uebersprungen (kein
     * Fehler), analog zum bestehenden Verhalten bei nicht-existenten IDs. Verhindert, dass ein
     * Client in Canvas A ueber eine veraltete/fremde ID ein Objekt in Canvas B veraendert.
     */
    @Transactional
    fun update(canvasId: UUID, updates: List<Pair<UUID, ShapeData>>): List<CanvasObjectDto> =
        updates.mapNotNull { (id, data) ->
            val entity = repository.findById(id)?.takeIf { it.canvasId == canvasId } ?: return@mapNotNull null
            entity.type = data.typeName
            entity.data = objectMapper.writeValueAsString(data)
            entity.toDto()
        }

    @Transactional
    fun delete(canvasId: UUID, ids: List<UUID>) {
        repository.deleteByIds(canvasId, ids)
    }

    private fun CanvasObjectEntity.toDto() = CanvasObjectDto(
        id = id,
        type = type,
        sequence = sequence,
        data = objectMapper.readValue(data, ShapeData::class.java),
    )
}
