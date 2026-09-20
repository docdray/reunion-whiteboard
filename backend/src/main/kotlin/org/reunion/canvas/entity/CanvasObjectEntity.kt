package org.reunion.canvas.entity

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "objects")
class CanvasObjectEntity : PanacheEntityBase {
    @Id
    var id: UUID = UUID.randomUUID()

    @Column(name = "canvas_id")
    lateinit var canvasId: UUID

    lateinit var type: String

    var sequence: Long = 0

    @Column(name = "created_at")
    lateinit var createdAt: Instant

    @Column(columnDefinition = "TEXT")
    lateinit var data: String
}
