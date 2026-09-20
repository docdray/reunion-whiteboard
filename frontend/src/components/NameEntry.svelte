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

<style>
  .name-entry {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #6b7280;
  }

  input {
    padding: 0.65rem 0.9rem;
    border: 1px solid #d8dbe1;
    border-radius: 10px;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #4f5df6;
    box-shadow: 0 0 0 3px rgba(79, 93, 246, 0.15);
  }
</style>
