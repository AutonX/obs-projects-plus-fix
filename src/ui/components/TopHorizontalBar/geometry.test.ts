import { describe, expect, it } from "@jest/globals";
import { scrollLeftFromDrag, thumbGeometry } from "./geometry";

describe("thumbGeometry", () => {
  it("hides the bar when the content fits", () => {
    expect(thumbGeometry(400, 400, 0, 400).visible).toBe(false);
  });

  it("places the thumb from scrollLeft across the track", () => {
    const start = thumbGeometry(800, 400, 0, 200);
    const end = thumbGeometry(800, 400, 400, 200);
    expect(start.visible).toBe(true);
    expect(start.width).toBe(100);
    expect(start.x).toBe(0);
    expect(end.x).toBe(100);
  });
});

describe("scrollLeftFromDrag", () => {
  it("maps a thumb drag onto scrollLeft and clamps the ends", () => {
    expect(scrollLeftFromDrag(0, 50, 800, 400, 200, 100)).toBe(200);
    expect(scrollLeftFromDrag(0, -20, 800, 400, 200, 100)).toBe(0);
    expect(scrollLeftFromDrag(400, 50, 800, 400, 200, 100)).toBe(400);
  });
});
