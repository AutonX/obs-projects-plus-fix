<script lang="ts">
  /**
   * TableHeader — F2.1/F2.4 (TABLE_V2_CANON §1/§3). Sticky header row:
   * type icon + name + sort indicator; click opens the column menu
   * (canonical contextMenu: sort / calculate / hide), right edge drags to
   * resize, `[+]` adds a property (CreateField) from #166's `1fr` filler track.
   * The tooltip carries the frontmatter key (#060 field transparency).
   */
  import { createEventDispatcher } from "svelte";
  import { Icon } from "obsidian-svelte";
  import { i18n } from "src/lib/stores/i18n";
  import { getFieldIcon } from "src/ui/components/Navigation/SettingsMenu/tabs/filterHelpers";
  import { openContextMenu } from "src/lib/contextMenu";
  import { buildHeaderMenuEntries, startColumnResize, type SortOrder } from "./tableHeaderOps";
  import type { TableColumn } from "./tableCanon";
  import type { ColumnAggregation, DataTableSortCriteria, AggregationConfig } from "../../types";

  export let columns: TableColumn[];
  export let sortCriteria: DataTableSortCriteria[] = [];
  export let aggregations: AggregationConfig = {};
  export let groupByField: string | undefined = undefined;
  export let readonly = false;

  const dispatch = createEventDispatcher<{
    sort: { field: string; order: SortOrder | null };
    hide: string;
    calculate: { field: string; fn: ColumnAggregation | null };
    group: { field: string; group: boolean };
    resizeLive: { field: string; widthRem: number };
    resizeCommit: { field: string; widthRem: number };
    addProperty: void;
    deleteProperty: string;
    reorder: { from: number; to: number };
  }>();

  function sortOf(name: string): SortOrder | null {
    return sortCriteria.find((c) => c.field === name)?.order ?? null;
  }

  // Same native drag as the view tabs: this host does not deliver mouseup
  // to the window, so a pointer tracker cannot finish a move. The header is a
  // button, and a button refuses a drop unless dragover is cancelled on the
  // button itself — cancelling it on the cell underneath never reaches it.
  let draggedIndex: number | null = null;
  let dragOverIndex: number | null = null;
  let suppressClick = false;
  let committed = false;

  function onDragStart(event: DragEvent, index: number) {
    if (readonly || columns[index]?.isPrimary) {
      event.preventDefault();
      return;
    }
    committed = false;
    draggedIndex = index;
    dragOverIndex = null;
    event.stopPropagation();
    const transfer = event.dataTransfer;
    if (!transfer) return;
    transfer.effectAllowed = "move";
    try { transfer.setData("text/plain", String(index)); } catch { /* the move still proceeds */ }
  }

  function onDragOver(event: DragEvent, index: number) {
    if (draggedIndex === null) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    dragOverIndex = index === draggedIndex ? null : index;
  }

  function commitMove(to: number | null) {
    const from = draggedIndex;
    if (committed || from === null || to === null || from === to || from <= 0) return;
    committed = true;
    dispatch("reorder", { from, to });
  }

  function onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    commitMove(index);
  }

  function onDragEnd(event: DragEvent) {
    let to = dragOverIndex;
    if (to === null && (event.clientX !== 0 || event.clientY !== 0)) {
      const hit = event.view?.document.elementFromPoint(event.clientX, event.clientY);
      const cell = hit?.closest?.("[data-col-index]");
      const index = cell ? Number(cell.getAttribute("data-col-index")) : NaN;
      if (Number.isInteger(index)) to = index;
    }
    commitMove(to);
    draggedIndex = null;
    dragOverIndex = null;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
  }

  function openMenu(col: TableColumn, e: MouseEvent) {
    if (readonly || suppressClick) return;
    const t = (k: string, d: string) => $i18n.t(k, { defaultValue: d });
    openContextMenu(
      buildHeaderMenuEntries({
        field: col.field,
        isPrimary: col.isPrimary,
        currentSort: sortOf(col.field.name),
        currentCalc: aggregations[col.field.name],
        groupedBy: groupByField === col.field.name,
        t,
        onSort: (order) => dispatch("sort", { field: col.field.name, order }),
        onHide: () => dispatch("hide", col.field.name),
        onCalculate: (fn) => dispatch("calculate", { field: col.field.name, fn }),
        onGroup: (group) => dispatch("group", { field: col.field.name, group }),
        onDelete: () => dispatch("deleteProperty", col.field.name),
      }),
      e
    );
  }

  function startResize(col: TableColumn, e: PointerEvent) {
    if (readonly) return;
    startColumnResize(
      e,
      col.widthRem,
      (rem) => dispatch("resizeLive", { field: col.field.name, widthRem: rem }),
      (rem) => dispatch("resizeCommit", { field: col.field.name, widthRem: rem })
    );
  }
</script>

<div class="ppp-t2-header" role="row">
  {#each columns as col, i (col.field.name)}
    {@const sort = sortOf(col.field.name)}
    <div
      class="ppp-t2-header-cell"
      class:ppp-t2-header-cell--interactive={!readonly}
      class:ppp-t2-header-cell--dragging={draggedIndex === i}
      class:ppp-t2-header-cell--drag-over={dragOverIndex === i}
      role="columnheader"
      tabindex="-1"
      data-col-index={i}
      draggable={!readonly && !col.isPrimary}
      aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none"}
      title={`${col.field.name} · ${$i18n.t(`data-types.${col.field.type}`, { defaultValue: col.field.type })}`}
      on:dragstart={(e) => onDragStart(e, i)}
      on:dragover={(e) => onDragOver(e, i)}
      on:drop={(e) => onDrop(e, i)}
      on:dragend={onDragEnd}
    >
      <button
        class="ppp-t2-header-btn"
        on:click={(e) => openMenu(col, e)}
        on:dragover={(e) => onDragOver(e, i)}
        on:drop={(e) => onDrop(e, i)}
        disabled={readonly}
      >
        <span class="ppp-t2-header-icon"><Icon name={getFieldIcon(col.field.type)} size="sm" /></span>
        <span class="ppp-t2-header-name">{col.field.name}</span>
        {#if sort}
          <span class="ppp-t2-header-sort"><Icon name={sort === "asc" ? "arrow-up" : "arrow-down"} size="sm" /></span>
        {/if}
      </button>
      {#if !readonly}
        <span
          class="ppp-t2-resize"
          role="separator"
          aria-orientation="vertical"
          on:pointerdown={(e) => startResize(col, e)}
        />
      {/if}
    </div>
  {/each}
  {#if !readonly}
    <button
      class="ppp-t2-header-add"
      on:click={() => dispatch("addProperty")}
      aria-label={$i18n.t("views.dashboard.table-v2.add-property", { defaultValue: "Add property" })}
      title={$i18n.t("views.dashboard.table-v2.add-property", { defaultValue: "Add property — creates a field in every note" })}
    >+</button>
  {/if}
</div>

<style>
  .ppp-t2-header {
    display: grid;
    grid-template-columns: var(--ppp-dt-columns);
    position: sticky;
    top: 0;
    z-index: var(--ppp-z-float, 10);
    background: var(--background-secondary);
    border-bottom: 0.0625rem solid var(--background-modifier-border);
  }

  .ppp-t2-header-cell {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
    height: 2rem;
    user-select: none;
  }

  .ppp-t2-header-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    width: 100%;
    height: 100%;
    min-width: 0;
    padding: 0 0.5rem;
    border: none;
    background: transparent;
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    cursor: default;
    text-align: left;
  }

  .ppp-t2-header-cell--interactive .ppp-t2-header-btn {
    cursor: pointer;
  }

  .ppp-t2-header-cell--interactive .ppp-t2-header-btn:hover {
    background: var(--ppp-db-surface-hover, var(--background-modifier-hover));
  }

  .ppp-t2-header-cell[draggable="true"] .ppp-t2-header-btn {
    cursor: grab;
  }

  .ppp-t2-header-cell--dragging {
    opacity: 0.45;
  }

  .ppp-t2-header-cell--drag-over {
    box-shadow: inset 0.125rem 0 0 var(--interactive-accent);
  }

  .ppp-t2-header-icon {
    flex-shrink: 0;
    display: inline-flex;
    color: var(--text-faint);
  }

  .ppp-t2-header-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ppp-t2-header-sort {
    flex-shrink: 0;
    display: inline-flex;
    color: var(--text-accent);
  }

  .ppp-t2-resize {
    position: absolute;
    top: 0;
    right: -0.1875rem;
    width: 0.375rem;
    height: 100%;
    cursor: col-resize;
    z-index: 1;
  }

  .ppp-t2-resize:hover {
    background: var(--interactive-accent);
    opacity: 0.5;
  }

  .ppp-t2-header-add {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    color: var(--text-faint);
    font-size: 1rem;
    cursor: pointer;
  }

  .ppp-t2-header-add:hover {
    color: var(--text-normal);
    background: var(--ppp-db-surface-hover, var(--background-modifier-hover));
  }
</style>
