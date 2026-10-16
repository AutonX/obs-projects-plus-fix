<script lang="ts">
  /**
   * TableRow — F2.2/F2.3 (TABLE_V2_CANON §1/§3). Grid row: primary Name cell
   * (identity, hover ↗ OPEN + ⋯ row menu), every other cell is an
   * EditableCell. The row knows nothing about persistence — edits and row
   * operations bubble to the orchestrator as semantic events.
   */
  import { createEventDispatcher } from "svelte";
  import { Icon } from "obsidian-svelte";
  import { i18n } from "src/lib/stores/i18n";
  import type { DataFrame, DataRecord, DataField, DataValue, Optional } from "src/lib/dataframe/dataframe";
  import type { ViewApi } from "src/lib/viewApi";
  import { cellDisplay, type TableColumn } from "./tableCanon";
  import EditableCell from "./EditableCell.svelte";
  import { focusEditor } from "./noteRename";

  export let columns: TableColumn[];
  export let record: DataRecord;
  export let readonly: boolean;
  export let api: ViewApi;
  export let frame: DataFrame;
  /** R3 — this row currently drives the canvas Selection Bus. */
  export let driving = false;
  /** Field name currently edited in THIS record (single editor per table). */
  export let editingField: string | null = null;
  /** Unique value lists for Select/Status dropdowns, keyed by field name. */
  export let optionsByField: ReadonlyMap<string, string[]> = new Map();

  const dispatch = createEventDispatcher<{
    // #189: the originating event travels with the record, or the modifier the
    // peek now lives on cannot be read by the one place allowed to read it.
    openRecord: { record: DataRecord; event: MouseEvent };
    rowMenu: { record: DataRecord; event: MouseEvent };
    startEdit: { recordId: string; field: string };
    commitEdit: { record: DataRecord; field: string; value: Optional<DataValue> };
    cancelEdit: void;
    setupRelation: DataField;
  }>();

  // R3: never surface the full vault path — identity falls back to the
  // note's basename, like Notion shows the page title.
  function baseName(id: string): string {
    return (id.split("/").pop() ?? id).replace(/\.md$/, "");
  }

  function nameText(): string {
    const col = columns.find((c) => c.isPrimary);
    if (!col) return baseName(record.id);
    const cell = cellDisplay(col.field, record.values[col.field.name]);
    if (cell.kind !== "text") return baseName(record.id);
    // Identifier fields often store the full path/wikilink — normalize.
    return baseName(cell.text.replace(/^\[\[|\]\]$/g, ""));
  }

  $: primaryField = columns.find((c) => c.isPrimary)?.field.name ?? null;
  $: titleEditable = !readonly && primaryField === "name";
  $: naming = titleEditable && editingField === primaryField;
  let nameDraft = "";
  let nameCommitted = false;

  function beginNameEdit() {
    if (!titleEditable || naming || primaryField === null) return;
    nameDraft = nameText();
    nameCommitted = false;
    dispatch("startEdit", { recordId: record.id, field: primaryField });
  }

  function commitName() {
    if (nameCommitted || !naming || !primaryField) return;
    nameCommitted = true;
    dispatch("commitEdit", { record, field: primaryField, value: nameDraft });
  }

  function onNameKey(e: KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); commitName(); }
    else if (e.key === "Escape") { e.preventDefault(); nameCommitted = true; dispatch("cancelEdit"); }
  }
</script>

<div class="ppp-t2-row" class:ppp-t2-row--driving={driving} role="row">
  {#each columns as col (col.field.name)}
    {#if col.isPrimary}
    <div class="ppp-t2-cell ppp-t2-cell--primary" class:ppp-t2-cell--editing={naming} role="gridcell" tabindex={titleEditable ? 0 : -1}
      on:click={beginNameEdit} on:keydown={(e) => { if (e.key === "Enter" && !naming) { e.preventDefault(); beginNameEdit(); } }}>
      {#if naming}
        <input class="ppp-t2-editor" use:focusEditor={true} bind:value={nameDraft} on:click|stopPropagation on:keydown|stopPropagation={onNameKey} on:blur={commitName} />
      {:else}
        <span class="ppp-t2-name">{nameText()}</span>
      {/if}
        <button
          class="ppp-t2-rowbtn clickable-icon"
          on:click|stopPropagation={(e) => dispatch("openRecord", { record, event: e })}
          aria-label={$i18n.t("views.dashboard.table-v2.open", { defaultValue: "Open note" })}
          title={$i18n.t("views.dashboard.table-v2.open", { defaultValue: "Open note" })}
        ><Icon name="arrow-up-right" size="sm" /></button>
        <!-- #189 follow-up: shown on a READ-ONLY row too. The menu is where
             "Show fields" is discoverable, and a borrowed source is exactly
             where reading fields matters most. `buildRowMenuEntries` drops the
             writing entries; hiding the whole button hid the reading ones. -->
        <button
          class="ppp-t2-rowbtn clickable-icon"
          on:click|stopPropagation={(e) => dispatch("rowMenu", { record, event: e })}
          aria-label={$i18n.t("views.dashboard.table-v2.row-menu", { defaultValue: "Row actions" })}
          title={$i18n.t("views.dashboard.table-v2.row-menu", { defaultValue: "Row actions" })}
        ><Icon name="more-horizontal" size="sm" /></button>
      </div>
    {:else}
      <EditableCell
        field={col.field}
        value={record.values[col.field.name]}
        {readonly}
        {api}
        {frame}
        editing={editingField === col.field.name}
        options={optionsByField.get(col.field.name) ?? []}
        on:startEdit={() => dispatch("startEdit", { recordId: record.id, field: col.field.name })}
        on:commit={(e) => dispatch("commitEdit", { record, field: col.field.name, value: e.detail })}
        on:cancel={() => dispatch("cancelEdit")}
        on:setupRelation={(e) => dispatch("setupRelation", e.detail)}
      />
    {/if}
  {/each}
</div>

<style>
  .ppp-t2-row {
    display: grid;
    grid-template-columns: var(--ppp-dt-columns);
    min-height: var(--ppp-t2-row-height, 2.25rem);
    border-bottom: 0.0625rem solid var(--background-modifier-border);
  }

  /* Selection Bus driver row — the source of the canvas-wide filter */
  .ppp-t2-row--driving {
    background: var(--ppp-db-surface-selected, var(--background-modifier-hover));
    box-shadow: inset 0.1875rem 0 0 var(--interactive-accent);
  }

  .ppp-t2-cell {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    padding: 0 0.5rem;
    font-size: var(--font-ui-small);
    color: var(--text-normal);
  }

  .ppp-t2-name {
    flex: 1;
    min-width: 0;
    font-weight: var(--font-medium, 500);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ppp-t2-cell--primary:not([tabindex="-1"]) { cursor: text; }
  .ppp-t2-cell--editing { box-shadow: inset 0 0 0 var(--border-width) var(--interactive-accent); }
  .ppp-t2-editor {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    color: var(--text-normal);
    font: inherit;
    font-weight: var(--font-medium, 500);
    outline: none;
    padding: 0;
  }

  .ppp-t2-rowbtn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border: none;
    background: transparent;
    color: var(--text-faint);
    border-radius: var(--radius-s, 0.25rem);
    cursor: pointer;
    transition: opacity 120ms ease;
  }

  /* ios-t1: the row actions are revealed by hover only where hover exists.
     The row tint sits in the gate too, or a tap would leave it stuck. */
  @media (hover: hover) and (pointer: fine) {
    .ppp-t2-row:hover {
      background: var(--ppp-db-surface-hover, var(--background-modifier-hover));
    }

    .ppp-t2-rowbtn {
      opacity: 0;
    }

    .ppp-t2-row:hover .ppp-t2-rowbtn {
      opacity: 1;
    }

    .ppp-t2-rowbtn:hover {
      color: var(--text-normal);
      background: var(--background-modifier-hover);
    }
  }

  /* A finger has no hover to find them: both actions stay shown, each in its
     own finger-sized box side by side, so the two targets never overlap. The
     row grows to fit them; the name keeps its ellipsis. */
  @media (pointer: coarse) {
    .ppp-t2-rowbtn {
      opacity: 1;
      width: var(--ppp-touch-target-min);
      height: var(--ppp-touch-target-min);
    }

    .ppp-t2-cell--primary {
      gap: 0;
    }
  }
</style>
