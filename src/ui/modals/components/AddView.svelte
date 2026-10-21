<script lang="ts">
  import {
    Button,
    ModalButtonGroup,
    ModalContent,
    ModalLayout,
    Select,
    SettingItem,
    TextInput,
  } from "obsidian-svelte";
  import { v4 as uuidv4 } from "uuid";

  import { nextUniqueViewName } from "src/lib/helpers";
  import { dataFrame } from "src/lib/stores/dataframe";
  import { customViews } from "src/lib/stores/customViews";
  import { i18n } from "src/lib/stores/i18n";
  import { settings } from "src/lib/stores/settings";
  import {
    DEFAULT_VIEW,
    type ProjectDefinition,
    type ProjectId,
    type ViewDefinition,
    type ViewType,
  } from "src/settings/settings";
  import FieldComboInput from "src/ui/components/Navigation/SettingsMenu/tabs/FieldComboInput.svelte";
  import {
    boardConfigForCreate,
    boardGroupFields,
    groupFieldPreset,
  } from "./addViewConfig";

  export let onSave: (projectId: ProjectId, view: ViewDefinition) => void;
  export let project: ProjectDefinition;
  /** The open frame belongs to this project. Another project has no field list here. */
  export let fieldProjectId: ProjectId;

  let name: string = "";
  let type: ViewType = "dashboard";
  let groupByField = "";

  // Deduplicate by viewType: view.ts registers both "dashboard" and "database"
  // keys pointing at the same DashboardView instance for v3-save compat.
  // Object.values() returns the same instance twice → two "Dashboard" entries.
  // Fix: collect unique viewTypes first, then map to options.
  const BUILT_IN_VIEW_TYPES = ["table", "board", "calendar", "gallery", "database", "dashboard"];
  const seenTypes = new Set<string>();
  const options = Object.values($customViews)
    .filter((view) => {
      const t = view.getViewType();
      if (seenTypes.has(t)) return false;
      seenTypes.add(t);
      return true;
    })
    .map((view) => {
      const t = view.getViewType();
      // Normalize legacy "database" key to canonical "dashboard"
      const canonical = t === "database" ? "dashboard" : t;
      if (BUILT_IN_VIEW_TYPES.includes(t)) {
        return {
          label: $i18n.t(["views", canonical, "name"].join(".")),
          value: canonical,
        };
      } else {
        return {
          label: view.getDisplayName(),
          value: canonical,
        };
      }
    });

  $: selectedOption = options.find((option) => option.value === type);

  $: nameError = validateName(name);

  // Explicit reactive statement for project options to ensure Select component
  // properly detects changes when projects are updated or added
  $: projectOptions = $settings.projects.map((proj) => ({
    label: proj.name,
    value: proj.id,
  }));

  function validateName(name: string) {
    if (project.views.find((view) => view.name === name)) {
      return $i18n.t("modals.view.create.existing-name-error");
    }
    return "";
  }

  $: fieldsApply = project.id === fieldProjectId;
  $: groupNames = fieldsApply ? boardGroupFields($dataFrame.fields) : [];
  $: groupFields = groupNames.map((fieldName) => ({ name: fieldName, type: "string" }));

  $: if (type === "board" && fieldsApply) {
    const preset = groupFieldPreset(name, groupNames);
    if (preset !== undefined && preset !== groupByField) groupByField = preset;
  }

  $: boardNeedsGroup = type === "board" && fieldsApply && !groupByField.trim();
</script>

<ModalLayout title={$i18n.t("modals.view.create.title")}>
  <ModalContent>
    <SettingItem
      name={$i18n.t("modals.view.create.type.name")}
      description={$i18n.t("modals.view.create.type.description") ?? ""}
    >
      <Select
        value={type}
        {options}
        on:change={({ detail: value }) => {
          type = value;
        }}
      />
    </SettingItem>

    <SettingItem
      name={$i18n.t("modals.view.create.name.name")}
      description={$i18n.t("modals.view.create.name.description") ?? ""}
    >
      <TextInput
        value={name}
        on:input={({ detail: value }) => (name = value)}
        placeholder={$i18n.t("modals.view.create.optional") ?? ""}
        error={!!nameError}
        helperText={nameError}
      />
    </SettingItem>

    <SettingItem
      name={$i18n.t("modals.note.create.project.name")}
      description={$i18n.t("modals.note.create.project.description") ?? ""}
    >
      <Select
        value={project.id}
        on:change={({ detail: id }) => {
          const res = $settings.projects.find((w) => w.id === id);
          if (res) {
            project = res;
          }
        }}
        options={projectOptions}
      />
    </SettingItem>

    {#if type === "board" && fieldsApply}
      <SettingItem
        name={$i18n.t("settings-menu.view-config.board.group-by-field")}
        description={$i18n.t("settings-menu.view-config.board.hints.group-by-field") ?? ""}
      >
        <FieldComboInput
          fields={groupFields}
          id="add-view-group-by"
          value={groupByField}
          placeholder={$i18n.t("settings-menu.view-config.calendar.field-mapping.placeholder")}
          on:change={(e) => (groupByField = e.detail)}
        />
      </SettingItem>
    {/if}
  </ModalContent>
  <ModalButtonGroup>
    <Button
      variant="primary"
      disabled={!!nameError || boardNeedsGroup}
      on:click={() => {
        if (nameError || boardNeedsGroup) return;
        const normalizedType = type === "table" ? "database" : type;
        const boardConfig = normalizedType === "board" && fieldsApply
          ? boardConfigForCreate(groupByField)
          : undefined;
        onSave(
          project.id,
          Object.assign({}, DEFAULT_VIEW, {
            id: uuidv4(),
            name:
              name ||
              nextUniqueViewName(project.views, selectedOption?.label ?? normalizedType),
            type: normalizedType,
            ...(boardConfig ? { config: boardConfig } : {}),
          })
        );
      }}>{$i18n.t("modals.view.create.cta")}</Button
    >
  </ModalButtonGroup>
</ModalLayout>
