<script lang="ts">
  import StartScreen from './components/StartScreen.svelte'

  type Route = { screen: 'start' } | { screen: 'canvas'; id: string; name: string }

  let route = $state<Route>({ screen: 'start' })

  function openCanvas(id: string, name: string) {
    route = { screen: 'canvas', id, name }
  }

  function leaveCanvas() {
    route = { screen: 'start' }
  }
</script>

{#if route.screen === 'start'}
  <StartScreen onOpenCanvas={openCanvas} />
{:else}
  <div class="canvas-placeholder">
    <p>Canvas "{route.name}" ({route.id}) würde hier geöffnet (kommt in Milestone 5).</p>
    <button type="button" onclick={leaveCanvas}>Zurück zum Start</button>
  </div>
{/if}
