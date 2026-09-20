package org.reunion.canvas.rest

import jakarta.inject.Inject
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.DELETE
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import org.reunion.canvas.dto.CreateCanvasRequest
import org.reunion.canvas.service.CanvasHasActiveUsersException
import org.reunion.canvas.service.CanvasNotFoundException
import org.reunion.canvas.service.CanvasService
import java.util.UUID

@Path("/api/canvases")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class CanvasResource @Inject constructor(
    private val canvasService: CanvasService,
) {

    @GET
    fun list() = canvasService.list()

    @POST
    fun create(request: CreateCanvasRequest): Response =
        Response.status(Response.Status.CREATED).entity(canvasService.create(request.name)).build()

    @DELETE
    @Path("/{id}")
    fun delete(@PathParam("id") id: UUID): Response =
        try {
            canvasService.delete(id)
            Response.noContent().build()
        } catch (e: CanvasHasActiveUsersException) {
            Response.status(Response.Status.CONFLICT).build()
        } catch (e: CanvasNotFoundException) {
            Response.status(Response.Status.NOT_FOUND).build()
        }
}
