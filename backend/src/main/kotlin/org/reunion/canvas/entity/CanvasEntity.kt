package org.reunion.canvas.entity

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "canvases")
class CanvasEntity : PanacheEntityBase {
    @Id
    var id: UUID = UUID.randomUUID()

    lateinit var name: String

    @Column(name = "created_at")
    lateinit var createdAt: Instant
}
