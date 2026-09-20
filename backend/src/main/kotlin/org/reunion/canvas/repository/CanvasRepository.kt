package org.reunion.canvas.repository

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepositoryBase
import jakarta.enterprise.context.ApplicationScoped
import org.reunion.canvas.entity.CanvasEntity
import java.util.UUID

@ApplicationScoped
class CanvasRepository : PanacheRepositoryBase<CanvasEntity, UUID>
