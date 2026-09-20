package org.reunion.canvas.ws.protocol

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import org.reunion.canvas.dto.CanvasObjectDto
import org.reunion.canvas.presence.PresenceInfo
import org.reunion.canvas.shape.ShapeData
import java.util.UUID

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes(
    JsonSubTypes.Type(ServerMessage.InitialState::class, name = "initial-state"),
    JsonSubTypes.Type(ServerMessage.UserJoined::class, name = "user-joined"),
    JsonSubTypes.Type(ServerMessage.UserLeft::class, name = "user-left"),
    JsonSubTypes.Type(ServerMessage.PresenceUpdate::class, name = "presence-update"),
    JsonSubTypes.Type(ServerMessage.DrawPreviewRelay::class, name = "draw-preview-relay"),
    JsonSubTypes.Type(ServerMessage.ObjectCreated::class, name = "object-created"),
    JsonSubTypes.Type(ServerMessage.ObjectUpdated::class, name = "object-updated"),
    JsonSubTypes.Type(ServerMessage.ObjectDeleted::class, name = "object-deleted"),
)
sealed interface ServerMessage {

    data class InitialState(
        val selfUserId: String,
        val selfColor: String,
        val objects: List<CanvasObjectDto>,
        val users: List<PresenceInfo>,
    ) : ServerMessage

    data class UserJoined(val userId: String, val displayName: String, val color: String) : ServerMessage

    data class UserLeft(val userId: String) : ServerMessage

    data class PresenceUpdate(val userId: String, val x: Double, val y: Double) : ServerMessage

    data class DrawPreviewRelay(val userId: String, val shapeType: String, val data: ShapeData) : ServerMessage

    data class ObjectCreated(val obj: CanvasObjectDto) : ServerMessage

    data class ObjectUpdated(val objects: List<CanvasObjectDto>) : ServerMessage

    data class ObjectDeleted(val ids: List<UUID>) : ServerMessage
}
