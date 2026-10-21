<script lang="ts">
  /**
   * The folders that already have a database. Lives inside the projects
   * pane, so the vault's own file list stays put.
   */
  import { createEventDispatcher } from "svelte";
  import { i18n } from "src/lib/stores/i18n";
  import type { ProjectDefinition, ProjectId } from "src/settings/settings";

  export let projects: ProjectDefinition[] = [];
  export let projectId: ProjectId | undefined;

  const dispatch = createEventDispatcher<{ select: ProjectId }>();
</script>

<div class="ppp-folder-rail" role="tablist" aria-label={$i18n.t("common.select-project")}>
  {#each projects as item (item.id)}
    <button
      type="button"
      class="ppp-folder-rail__item"
      class:active={item.id === projectId}
      role="tab"
      aria-selected={item.id === projectId}
      title={item.name}
      on:click={() => dispatch("select", item.id)}
    >{item.name}</button>
  {/each}
</div>

<style>
  .ppp-folder-rail {
    flex: 0 0 9.5rem;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.5rem 0.375rem;
    overflow-x: hidden;
    overflow-y: auto;
    background: var(--background-secondary);
    border-right: var(--ppp-border-width, 1px) solid var(--background-modifier-border);
  }

  .ppp-folder-rail__item {
    flex: 0 0 auto;
    width: 100%;
    border: none;
    border-radius: 0.375rem;
    padding: 0.375rem 0.5rem;
    background: transparent;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  .ppp-folder-rail__item:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .ppp-folder-rail__item.active {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
    font-weight: 600;
  }

  .ppp-folder-rail__item:focus-visible {
    outline: 0.125rem solid var(--interactive-accent);
    outline-offset: 0.125rem;
  }
</style>
