<script lang="ts">
  import { onDestroy } from "svelte";
  import { i18n } from "src/lib/stores/i18n";
  import { scrollLeftFromDrag, thumbGeometry } from "./geometry";

  /** The element whose horizontal scroll this bar drives. */
  export let scroller: HTMLElement | null | undefined = undefined;

  let track: HTMLElement | undefined;
  let visible = false;
  let thumbW = 0;
  let thumbX = 0;
  let valueNow = 0;
  let valueMax = 0;
  let controlsId = "";
  const targetId = `ppp-hbar-${Math.random().toString(36).slice(2)}`;
  let detach = () => {};

  function paint() {
    if (!scroller) {
      visible = false;
      return;
    }
    if (!scroller.id) scroller.id = targetId;
    controlsId = scroller.id;
    const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    valueNow = Math.round(scroller.scrollLeft);
    valueMax = Math.round(max);
    const overflow = max > 1;
    visible = overflow;
    if (!overflow) return;
    requestAnimationFrame(() => {
      if (!scroller || !track) return;
      const next = thumbGeometry(
        scroller.scrollWidth,
        scroller.clientWidth,
        scroller.scrollLeft,
        track.clientWidth
      );
      visible = next.visible;
      thumbW = next.width;
      thumbX = next.x;
    });
  }

  function attach(node: HTMLElement) {
    node.classList.add("ppp-hide-native-hbar");
    const onScroll = () => paint();
    node.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => paint());
    ro.observe(node);
    const content = node.firstElementChild;
    if (content) ro.observe(content);
    paint();
    return () => {
      node.removeEventListener("scroll", onScroll);
      ro.disconnect();
      node.classList.remove("ppp-hide-native-hbar");
    };
  }

  let current: HTMLElement | undefined;
  $: if (scroller !== current) {
    detach();
    current = scroller;
    detach = scroller ? attach(scroller) : () => {};
  }

  onDestroy(() => detach());

  function onWheel(node: HTMLElement) {
    const handler = (e: WheelEvent) => {
      if (!scroller || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? scroller.clientWidth : 1;
      scroller.scrollLeft += raw * scale;
    };
    node.addEventListener("wheel", handler, { passive: false });
    return { destroy: () => node.removeEventListener("wheel", handler) };
  }

  function onPointerDown(e: PointerEvent) {
    if (!scroller || !track || e.button !== 0) return;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const travel = Math.max(1, track.clientWidth - thumbW);
    const local = e.clientX - track.getBoundingClientRect().left;
    const onThumb = local >= thumbX && local <= thumbX + thumbW;
    if (!onThumb) {
      const x = Math.min(Math.max(local - thumbW / 2, 0), travel);
      scroller.scrollLeft = (x / travel) * max;
    }
    const startX = e.clientX;
    const startLeft = scroller.scrollLeft;
    const move = (ev: PointerEvent) => {
      if (!scroller) return;
      scroller.scrollLeft = scrollLeftFromDrag(
        startLeft,
        ev.clientX - startX,
        scroller.scrollWidth,
        scroller.clientWidth,
        track?.clientWidth ?? 0,
        thumbW
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
</script>

{#if visible}
  <div
    class="ppp-top-hbar"
    bind:this={track}
    use:onWheel
    role="scrollbar"
    aria-orientation="horizontal"
    aria-label={$i18n.t("components.top-hbar.label")}
    aria-controls={controlsId}
    aria-valuemin={0}
    aria-valuemax={valueMax}
    aria-valuenow={valueNow}
    on:pointerdown={onPointerDown}
  >
    <div class="ppp-top-hbar__thumb" style:width="{thumbW}px" style:transform="translateX({thumbX}px)"></div>
  </div>
{/if}

<style>
  .ppp-top-hbar {
    flex: 0 0 auto;
    height: 0.625rem;
    margin: 0 0.25rem 0.25rem;
    border-radius: 999px;
    background: var(--background-modifier-border);
    position: relative;
    cursor: pointer;
    touch-action: none;
  }

  .ppp-top-hbar__thumb {
    position: absolute;
    top: 0.0625rem;
    height: calc(100% - 0.125rem);
    border-radius: 999px;
    background: var(--scrollbar-thumb-bg, var(--text-faint));
  }

  /* The native horizontal bar stays at the bottom of the scroller. Hide that
     axis only; the vertical bar on the right is unchanged. Chromium (Obsidian
     desktop) supports the :horizontal scrollbar pseudo. */
  :global(.ppp-hide-native-hbar)::-webkit-scrollbar:horizontal {
    height: 0;
  }
</style>
