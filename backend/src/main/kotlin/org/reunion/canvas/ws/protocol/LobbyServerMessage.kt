package org.reunion.canvas.ws.protocol

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import org.eclipse.microprofile.openapi.annotations.media.Schema
import org.reunion.canvas.dto.CanvasSummaryDto
import java.util.UUID

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes(
    JsonSubTypes.Type(LobbyServerMessage.LobbyInitialState::class, name = "lobby-initial-state"),
    JsonSubTypes.Type(LobbyServerMessage.CanvasAdded::class, name = "canvas-added"),
    JsonSubTypes.Type(LobbyServerMessage.CanvasUpdated::class, name = "canvas-updated"),
    JsonSubTypes.Type(LobbyServerMessage.CanvasRemoved::class, name = "canvas-removed"),
)
@Schema(
    name = "LobbyServerMessage",
    oneOf = [
        LobbyServerMessage.LobbyInitialState::class,
        LobbyServerMessage.CanvasAdded::class,
        LobbyServerMessage.CanvasUpdated::class,
        LobbyServerMessage.CanvasRemoved::class,
    ],
)
sealed interface LobbyServerMessage {

    data class LobbyInitialState(val canvases: List<CanvasSummaryDto>) : LobbyServerMessage

    data class CanvasAdded(val canvas: CanvasSummaryDto) : LobbyServerMessage

    data class CanvasUpdated(val canvas: CanvasSummaryDto) : LobbyServerMessage

    data class CanvasRemoved(val id: UUID) : LobbyServerMessage
}
