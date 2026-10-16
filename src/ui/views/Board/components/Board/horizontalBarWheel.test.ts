import { describe, it, expect } from "@jest/globals";
import { horizontalBarScrollDelta, type HorizontalBarWheelInput } from "./horizontalBarWheel";

function input(overrides: Partial<HorizontalBarWheelInput> = {}): HorizontalBarWheelInput {
  return {
    clientY: 490,
    rectBottom: 500,
    offsetHeight: 400,
    clientHeight: 385,
    deltaX: 0,
    deltaY: 120,
    deltaMode: 0,
    pageSize: 800,
    ...overrides,
  };
}

describe("horizontalBarScrollDelta", () => {
  it("maps a vertical wheel on the bottom bar to that distance", () => {
    expect(horizontalBarScrollDelta(input())).toBe(120);
  });

  it("uses the horizontal delta when a trackpad is already scrolling sideways", () => {
    expect(horizontalBarScrollDelta(input({ deltaX: 40, deltaY: 8 }))).toBe(40);
  });

  it("leaves the wheel alone when the pointer is above the bar", () => {
    expect(horizontalBarScrollDelta(input({ clientY: 400 }))).toBeNull();
  });

  it("leaves the wheel alone when there is no horizontal scrollbar", () => {
    expect(horizontalBarScrollDelta(input({ offsetHeight: 385, clientHeight: 385 }))).toBeNull();
  });

  it("converts line and page deltas into pixels", () => {
    expect(horizontalBarScrollDelta(input({ deltaY: 3, deltaMode: 1 }))).toBe(48);
    expect(horizontalBarScrollDelta(input({ deltaY: 1, deltaMode: 2, pageSize: 800 }))).toBe(800);
  });
});
