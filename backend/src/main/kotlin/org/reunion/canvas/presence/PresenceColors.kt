package org.reunion.canvas.presence

import java.util.concurrent.atomic.AtomicInteger

/** 10 gut unterscheidbare Farben zur Round-Robin-Zuweisung an neu verbundene Nutzer. */
object PresenceColors {
    val PALETTE: List<String> = listOf(
        "#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4",
        "#46f0f0", "#f032e6", "#bcf60c", "#fabebe", "#008080",
    )

    private val counter = AtomicInteger(0)

    fun next(): String = PALETTE[counter.getAndIncrement().mod(PALETTE.size)]
}
