package org.reunion.canvas.ws.protocol

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import org.reunion.canvas.shape.ShapeData
import java.util.UUID

data class ObjectUpdateEntry(val id: UUID, val data: ShapeData)

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes(
    JsonSubTypes.Type(ClientMessage.CursorMove::class, name = "cursor-move"),
    JsonSubTypes.Type(ClientMessage.DrawPreview::class, name = "draw-preview"),
    JsonSubTypes.Type(ClientMessage.ObjectCreate::class, name = "object-create"),
    JsonSubTypes.Type(ClientMessage.ObjectUpdate::class, name = "object-update"),
    JsonSubTypes.Type(ClientMessage.ObjectDelete::class, name = "object-delete"),
)
sealed interface ClientMessage {

    data class CursorMove(val x: Double, val y: Double) : ClientMessage

    /** Nur relayed, nie persistiert. */
    data class DrawPreview(val shapeType: String, val data: ShapeData) : ClientMessage

    data class ObjectCreate(val shapeType: String, val data: ShapeData) : ClientMessage

    data class ObjectUpdate(val objects: List<ObjectUpdateEntry>) : ClientMessage

    data class ObjectDelete(val ids: List<UUID>) : ClientMessage
}
