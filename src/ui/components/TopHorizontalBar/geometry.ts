const MIN_THUMB = 24;

/** Thumb size and position for a bar that sits above a horizontal scroller. */
export function thumbGeometry(
  scrollWidth: number,
  clientWidth: number,
  scrollLeft: number,
  trackWidth: number
): { visible: boolean; width: number; x: number } {
  const max = scrollWidth - clientWidth;
  if (max <= 1 || trackWidth <= 0 || scrollWidth <= 0) {
    return { visible: false, width: 0, x: 0 };
  }
  const width = Math.min(trackWidth, Math.max(MIN_THUMB, (clientWidth / scrollWidth) * trackWidth));
  const travel = Math.max(0, trackWidth - width);
  const left = Math.min(Math.max(scrollLeft, 0), max);
  const x = travel === 0 ? 0 : (left / max) * travel;
  return { visible: true, width, x };
}

/** scrollLeft after the thumb moves `dx` pixels from `startLeft`. */
export function scrollLeftFromDrag(
  startLeft: number,
  dx: number,
  scrollWidth: number,
  clientWidth: number,
  trackWidth: number,
  thumbWidth: number
): number {
  const max = Math.max(0, scrollWidth - clientWidth);
  const travel = Math.max(1, trackWidth - thumbWidth);
  return Math.min(Math.max(startLeft + (dx / travel) * max, 0), max);
}
