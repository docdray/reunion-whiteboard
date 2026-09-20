<script lang="ts">
  import NameEntry from './NameEntry.svelte'
  import CanvasList from './CanvasList.svelte'

  interface Props {
    onOpenCanvas: (id: string, name: string) => void
  }

  let { onOpenCanvas }: Props = $props()
</script>

<div class="start-screen">
  <h1>Reunion</h1>
  <NameEntry />
  <CanvasList {onOpenCanvas} />
</div>
