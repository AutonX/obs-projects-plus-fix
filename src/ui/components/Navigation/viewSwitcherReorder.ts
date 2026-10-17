/** How far above or below a tab the pointer may drift and still hit that row. */
export const DRAG_ROW_SLOP = 96;

/** Which tab the pointer is over, including the gap between two tabs. */
export function tabIndexAtPoint(
  tabs: ReadonlyArray<{ getBoundingClientRect(): { left: number; right: number; top: number; bottom: number } } | null | undefined>,
  x: number,
  y: number,
  slop = 12,
): number | null {
  let nearest: number | null = null;
  let nearestDist = Infinity;
  for (let i = 0; i < tabs.length; i++) {
    const rect = tabs[i]?.getBoundingClientRect();
    if (!rect) continue;
    if (y < rect.top - slop || y > rect.bottom + slop) continue;
    if (x >= rect.left && x <= rect.right) return i;
    const dist = x < rect.left ? rect.left - x : x - rect.right;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = i;
    }
  }
  return nearest;
}
