<script lang="ts">
  import NameEntry from './NameEntry.svelte'
  import CanvasList from './CanvasList.svelte'

  interface Props {
    onOpenCanvas: (id: string, name: string) => void
  }

  let { onOpenCanvas }: Props = $props()
</script>

<div class="start-screen">
  <div class="container">
    <header>
      <h1>Reunion</h1>
      <p class="subtitle">Gemeinsam zeichnen, in Echtzeit.</p>
    </header>

    <section class="card">
      <NameEntry />
    </section>

    <section class="card">
      <h2>Canvases</h2>
      <CanvasList {onOpenCanvas} />
    </section>
  </div>
</div>

<style>
  .start-screen {
    min-height: 100vh;
    background: linear-gradient(180deg, #f5f6fb 0%, #eef0f7 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1f2430;
    padding: 3rem 1.5rem;
    box-sizing: border-box;
  }

  .container {
    max-width: 780px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  header {
    text-align: center;
    margin-bottom: 0.5rem;
  }

  h1 {
    font-size: 2.25rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin: 0.35rem 0 0;
    color: #6b7280;
    font-size: 1rem;
  }

  .card {
    background: white;
    border-radius: 16px;
    border: 1px solid #eef0f3;
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
    padding: 1.5rem;
  }

  .card h2 {
    margin: 0 0 1rem;
    font-size: 1.1rem;
    font-weight: 700;
  }
</style>
