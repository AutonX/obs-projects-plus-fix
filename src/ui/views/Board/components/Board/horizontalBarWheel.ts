/** Pixel size of one `DOM_DELTA_LINE` step when the wheel reports lines, not pixels. */
const LINE_PX = 16;

export interface HorizontalBarWheelInput {
  clientY: number;
  /** `getBoundingClientRect().bottom` of the scroll container. */
  rectBottom: number;
  offsetHeight: number;
  clientHeight: number;
  deltaX: number;
  deltaY: number;
  /** `WheelEvent.deltaMode`. 0 pixel, 1 line, 2 page. */
  deltaMode: number;
  /** Used when `deltaMode` is page. */
  pageSize: number;
}

/**
 * Scroll distance to apply when the pointer is on the container's horizontal
 * scrollbar. `null` means this wheel event should keep its normal behaviour
 * (vertical scroll, or Ctrl/Meta zoom handled by the caller).
 *
 * The bar thickness is `offsetHeight - clientHeight` (borders are 0 on the
 * board container). Overlay scrollbars that take no layout space report 0
 * and are left alone.
 */
export function horizontalBarScrollDelta(input: HorizontalBarWheelInput): number | null {
  const bar = input.offsetHeight - input.clientHeight;
  if (bar <= 0) return null;
  if (input.clientY < input.rectBottom - bar) return null;

  const raw = Math.abs(input.deltaX) > Math.abs(input.deltaY) ? input.deltaX : input.deltaY;
  if (input.deltaMode === 1) return raw * LINE_PX;
  if (input.deltaMode === 2) return raw * input.pageSize;
  return raw;
}
