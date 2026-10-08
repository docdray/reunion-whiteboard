package org.reunion.canvas.openapi

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import org.eclipse.microprofile.openapi.OASFactory
import org.eclipse.microprofile.openapi.OASFilter
import org.eclipse.microprofile.openapi.models.OpenAPI
import org.eclipse.microprofile.openapi.models.media.Schema
import org.reunion.canvas.shape.ShapeData
import org.reunion.canvas.ws.protocol.ClientMessage
import org.reunion.canvas.ws.protocol.LobbyServerMessage
import org.reunion.canvas.ws.protocol.ServerMessage
import kotlin.reflect.KClass
import org.eclipse.microprofile.openapi.annotations.media.Schema as SchemaAnnotation

/**
 * SmallRye OpenAPI kennt Jacksons `@JsonTypeInfo`/`@JsonSubTypes` nicht: die sealed Interfaces
 * erscheinen nur als `oneOf` (aus ihrer `@Schema`-Annotation), ohne Diskriminator, und den
 * Subtypen fehlt das von Jackson hinzugefuegte `type`-Feld. Dieser Filter ergaenzt beides direkt
 * aus den Jackson-Annotationen, damit das generierte Frontend-Protokoll (`messages.ts`) echte
 * Discriminated Unions bekommt. Zusaetzlich entsteht das Enum-Schema [SHAPE_TYPE_SCHEMA] aus den
 * Typnamen von [ShapeData].
 */
class PolymorphicSchemaFilter : OASFilter {

    companion object {
        const val SHAPE_TYPE_SCHEMA = "ShapeType"

        private val POLYMORPHIC_ROOTS: List<KClass<*>> = listOf(
            ShapeData::class,
            ClientMessage::class,
            ServerMessage::class,
            LobbyServerMessage::class,
        )

        private fun schemaName(type: Class<*>): String =
            type.getAnnotation(SchemaAnnotation::class.java)?.name?.takeIf { it.isNotEmpty() } ?: type.simpleName

        private fun ref(name: String) = "#/components/schemas/$name"
    }

    override fun filterOpenAPI(openAPI: OpenAPI) {
        val schemas = openAPI.components.schemas
        for (root in POLYMORPHIC_ROOTS) {
            applyDiscriminator(root.java, schemas)
        }
        val shapeType = OASFactory.createSchema()
            .addType(Schema.SchemaType.STRING)
            .enumeration(subTypes(ShapeData::class.java).map { it.name })
        openAPI.components.schemas = (schemas + (SHAPE_TYPE_SCHEMA to shapeType)).toSortedMap()
    }

    private fun subTypes(root: Class<*>): List<JsonSubTypes.Type> =
        requireNotNull(root.getAnnotation(JsonSubTypes::class.java)) { "${root.name} hat keine @JsonSubTypes" }
            .value.toList()

    private fun applyDiscriminator(root: Class<*>, schemas: Map<String, Schema>) {
        val property = requireNotNull(root.getAnnotation(JsonTypeInfo::class.java)) { "${root.name} hat kein @JsonTypeInfo" }
            .property
        val rootName = schemaName(root)
        val rootSchema = requireNotNull(schemas[rootName]) { "Schema $rootName fehlt" }
        val subTypes = subTypes(root)

        val expectedRefs = subTypes.map { ref(schemaName(it.value.java)) }.toSet()
        val actualRefs = rootSchema.oneOf.orEmpty().map { it.ref }.toSet()
        check(expectedRefs == actualRefs) {
            "@Schema(oneOf) von $rootName passt nicht zu @JsonSubTypes: erwartet $expectedRefs, gefunden $actualRefs"
        }

        rootSchema.type = null
        rootSchema.properties = null
        rootSchema.discriminator = OASFactory.createDiscriminator()
            .propertyName(property)
            .mapping(subTypes.associate { it.name to ref(schemaName(it.value.java)) })

        for (subType in subTypes) {
            val name = schemaName(subType.value.java)
            val schema = requireNotNull(schemas[name]) { "Schema $name fehlt" }
            val discriminatorSchema = OASFactory.createSchema()
                .addType(Schema.SchemaType.STRING)
                .enumeration(listOf(subType.name))
            schema.properties = linkedMapOf(property to discriminatorSchema) + schema.properties.orEmpty()
            schema.required = listOf(property) + schema.required.orEmpty().filter { it != property }
        }
    }
}
