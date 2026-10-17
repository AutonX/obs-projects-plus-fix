import { fireEvent, render } from "@testing-library/svelte";
import type { ViewDefinition } from "src/settings/settings";
import { DRAG_ROW_SLOP, tabIndexAtPoint } from "../viewSwitcherReorder";
import ViewSwitcher from "../ViewSwitcher.svelte";

(globalThis as unknown as { activeDocument: Document }).activeDocument = document;

const empty = { conditions: [] };

function view(id: string, name: string): ViewDefinition {
  return {
    id,
    name,
    type: "board",
    config: {},
    filter: empty,
    colors: empty,
    sort: { criteria: [] },
  };
}

const views = [view("a", "按分类"), view("b", "版本记录"), view("c", "跑测方案")];

function box(left: number, right: number) {
  return { left, right, top: 0, bottom: 40, getBoundingClientRect() { return this; } };
}

describe("tabIndexAtPoint", () => {
  const tabs = [box(0, 40), box(48, 88), box(96, 136)];

  it("hits the tab the pointer is inside", () => {
    expect(tabIndexAtPoint(tabs, 20, 10)).toBe(0);
    expect(tabIndexAtPoint(tabs, 120, 10)).toBe(2);
  });

  it("uses the nearest tab when the pointer is in the gap", () => {
    expect(tabIndexAtPoint(tabs, 46, 10)).toBe(1);
  });

  it("hits the row when the pointer has drifted below the tabs", () => {
    expect(tabIndexAtPoint(tabs, 120, 80)).toBe(null);
    expect(tabIndexAtPoint(tabs, 120, 80, DRAG_ROW_SLOP)).toBe(2);
  });
});

describe("the view strip reorders by drag", () => {
  it("reports the move and does not switch views on the click that follows", async () => {
    const moves: Array<[number, number]> = [];
    const selected: string[] = [];
    const { getAllByRole } = render(ViewSwitcher, {
      props: {
        views,
        activeViewId: "a",
        onSelect: (id: string) => selected.push(id),
        onReorder: (from: number, to: number) => moves.push([from, to]),
      },
    });
    const tabs = getAllByRole("tab");

    await fireEvent.dragStart(tabs[0]!);
    await fireEvent.dragOver(tabs[2]!);
    await fireEvent.drop(tabs[2]!);
    await fireEvent.dragEnd(tabs[0]!);
    await fireEvent.click(tabs[2]!);

    expect(moves).toEqual([[0, 2]]);
    expect(selected).toEqual([]);
  });

  it("leaves the order alone when a tab is dropped on itself", async () => {
    const moves: Array<[number, number]> = [];
    const { getAllByRole } = render(ViewSwitcher, {
      props: {
        views,
        activeViewId: "a",
        onSelect: () => {},
        onReorder: (from: number, to: number) => moves.push([from, to]),
      },
    });
    const tabs = getAllByRole("tab");

    await fireEvent.dragStart(tabs[1]!);
    await fireEvent.dragOver(tabs[1]!);
    await fireEvent.drop(tabs[1]!);
    expect(moves).toEqual([]);
  });
});
