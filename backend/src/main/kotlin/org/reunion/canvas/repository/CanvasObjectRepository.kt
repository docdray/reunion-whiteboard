package org.reunion.canvas.repository

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepositoryBase
import jakarta.enterprise.context.ApplicationScoped
import org.reunion.canvas.entity.CanvasObjectEntity
import java.util.UUID

@ApplicationScoped
class CanvasObjectRepository : PanacheRepositoryBase<CanvasObjectEntity, UUID> {

    fun listByCanvasOrderedBySequence(canvasId: UUID): List<CanvasObjectEntity> =
        list("canvasId = ?1 order by sequence asc", canvasId)

    fun nextSequence(canvasId: UUID): Long {
        val max = find("canvasId = ?1 order by sequence desc", canvasId).firstResult()
        return (max?.sequence ?: -1) + 1
    }

    fun deleteByIds(canvasId: UUID, ids: List<UUID>): Long =
        delete("canvasId = ?1 and id in ?2", canvasId, ids)
}
