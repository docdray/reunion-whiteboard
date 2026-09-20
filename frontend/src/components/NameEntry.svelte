<script lang="ts">
  import { userStore } from '../lib/stores/userStore.svelte'

  let draft = $state(userStore.displayName)

  function commit() {
    const trimmed = draft.trim()
    if (!trimmed) {
      draft = userStore.displayName
      return
    }
    userStore.setDisplayName(trimmed)
    draft = trimmed
  }
</script>

<div class="name-entry">
  <label for="display-name">Dein Name</label>
  <input
    id="display-name"
    type="text"
    placeholder="Wie sollen dich andere sehen?"
    bind:value={draft}
    onblur={commit}
    onkeydown={(e) => e.key === 'Enter' && commit()}
  />
</div>
