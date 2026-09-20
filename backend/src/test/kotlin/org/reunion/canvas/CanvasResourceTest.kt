package org.reunion.canvas

import io.quarkus.test.junit.QuarkusTest
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import jakarta.inject.Inject
import org.hamcrest.Matchers.equalTo
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.reunion.canvas.dto.CanvasSummaryDto
import org.reunion.canvas.presence.PresenceRegistry
import java.util.UUID

@QuarkusTest
class CanvasResourceTest {

    @Inject
    lateinit var presenceRegistry: PresenceRegistry

    @Test
    fun `create then list then delete happy path`() {
        val created = given()
            .contentType(ContentType.JSON)
            .body("""{"name":"Testcanvas"}""")
            .`when`().post("/api/canvases")
            .then().statusCode(201)
            .extract().`as`(CanvasSummaryDto::class.java)

        assertEquals("Testcanvas", created.name)
        assertEquals(0, created.activeUsers)

        given()
            .`when`().get("/api/canvases")
            .then().statusCode(200)
            .body("id", org.hamcrest.Matchers.hasItem(created.id.toString()))

        given()
            .`when`().delete("/api/canvases/${created.id}")
            .then().statusCode(204)
    }

    @Test
    fun `delete with active users returns conflict`() {
        val created = given()
            .contentType(ContentType.JSON)
            .body("""{"name":"Aktives Canvas"}""")
            .`when`().post("/api/canvases")
            .then().statusCode(201)
            .extract().`as`(CanvasSummaryDto::class.java)

        presenceRegistry.join(created.id, "connection-1", "Alice")

        given()
            .`when`().delete("/api/canvases/${created.id}")
            .then().statusCode(409)

        presenceRegistry.leave(created.id, "connection-1")

        given()
            .`when`().delete("/api/canvases/${created.id}")
            .then().statusCode(204)
    }

    @Test
    fun `delete unknown id returns not found`() {
        given()
            .`when`().delete("/api/canvases/${UUID.randomUUID()}")
            .then().statusCode(404)
    }

    @Test
    fun `list reports active user count`() {
        val created = given()
            .contentType(ContentType.JSON)
            .body("""{"name":"Canvas mit Nutzern"}""")
            .`when`().post("/api/canvases")
            .then().statusCode(201)
            .extract().`as`(CanvasSummaryDto::class.java)

        presenceRegistry.join(created.id, "connection-a", "Alice")
        presenceRegistry.join(created.id, "connection-b", "Bob")

        given()
            .`when`().get("/api/canvases")
            .then().statusCode(200)
            .body("find { it.id == '${created.id}' }.activeUsers", equalTo(2))

        presenceRegistry.leave(created.id, "connection-a")
        presenceRegistry.leave(created.id, "connection-b")
        given().`when`().delete("/api/canvases/${created.id}").then().statusCode(204)
    }
}
