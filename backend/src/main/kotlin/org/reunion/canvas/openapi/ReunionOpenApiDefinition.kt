package org.reunion.canvas.openapi

import jakarta.ws.rs.core.Application
import org.eclipse.microprofile.openapi.annotations.Components
import org.eclipse.microprofile.openapi.annotations.OpenAPIDefinition
import org.eclipse.microprofile.openapi.annotations.info.Info
import org.eclipse.microprofile.openapi.annotations.media.Schema
import org.reunion.canvas.ws.protocol.ClientMessage
import org.reunion.canvas.ws.protocol.LobbyServerMessage
import org.reunion.canvas.ws.protocol.ServerMessage

@OpenAPIDefinition(
    info = Info(title = "Reunion", version = "1.0"),
    components = Components(
        schemas = [
            Schema(name = "ClientMessage", implementation = ClientMessage::class),
            Schema(name = "ServerMessage", implementation = ServerMessage::class),
            Schema(name = "LobbyServerMessage", implementation = LobbyServerMessage::class),
        ],
    ),
)
class ReunionOpenApiDefinition : Application()
