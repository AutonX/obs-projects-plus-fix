<script lang="ts">
  import {
    Button,
    ModalButtonGroup,
    ModalContent,
    ModalLayout,
    Typography,
  } from "obsidian-svelte";

  import { i18n } from "src/lib/stores/i18n";

  export let title: string;
  export let message: string;
  export let cta: string;
  export let checkboxLabel: string | undefined = undefined;
  export let onConfirm: (checked: boolean) => void;
  export let onCancel: () => void;

  let checked = false;
</script>

<ModalLayout {title}>
  <ModalContent>
    <Typography variant="body">{message}</Typography>
    {#if checkboxLabel}
      <label class="confirm-check">
        <input type="checkbox" bind:checked />
        <span>{checkboxLabel}</span>
      </label>
    {/if}
  </ModalContent>
  <ModalButtonGroup>
    <Button
      variant={cta === $i18n.t("modals.confirm.delete")
        ? "destructive"
        : "primary"}
      on:click={() => {
        onConfirm(checkboxLabel ? checked : false);
      }}>{cta}</Button
    >
    <Button
      on:click={() => {
        onCancel();
      }}
    >
      {$i18n.t("modals.confirm.cancel")}
    </Button>
  </ModalButtonGroup>
</ModalLayout>

<style>
  .confirm-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    cursor: pointer;
  }
</style>
