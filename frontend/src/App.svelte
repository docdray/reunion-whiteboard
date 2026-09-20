<script lang="ts">
  import StartScreen from './components/StartScreen.svelte'
  import CanvasView from './components/CanvasView.svelte'
  import { userStore } from './lib/stores/userStore.svelte'

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
  <CanvasView
    canvasId={route.id}
    canvasName={route.name}
    displayName={userStore.displayName}
    onLeave={leaveCanvas}
  />
{/if}
