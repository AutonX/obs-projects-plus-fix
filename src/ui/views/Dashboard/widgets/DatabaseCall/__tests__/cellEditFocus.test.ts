import { render, waitFor, fireEvent } from "@testing-library/svelte";
import { DataFieldType, type DataField, type DataFrame, type DataRecord } from "src/lib/dataframe/dataframe";
import type { ViewApi } from "src/lib/viewApi";
import type { TableColumn } from "../tableCanon";
import EditableCell from "../EditableCell.svelte";
import TableRow from "../TableRow.svelte";

const stringField = (name: string, derived = false): DataField => ({
  name,
  type: DataFieldType.String,
  repeated: false,
  identifier: name === "name",
  derived,
});

const frame = { records: [], fields: [] } as unknown as DataFrame;
const api = {} as ViewApi;

describe("a cell editor receives the caret when it opens", () => {
  it("focuses the input that just mounted", async () => {
    const { container, component } = render(EditableCell, {
      props: {
        field: stringField("版本"),
        value: "甲",
        readonly: false,
        editing: false,
        options: [],
        api,
        frame,
      },
    });
    expect(container.querySelector("input")).toBeNull();
    await component.$set({ editing: true });
    await waitFor(() => {
      expect(container.querySelector("input")).toBe(document.activeElement);
    });
  });

  it("keeps what was typed when the cell's value prop changes underneath", async () => {
    const { container, component } = render(EditableCell, {
      props: {
        field: stringField("版本"),
        value: "甲",
        readonly: false,
        editing: true,
        options: [],
        api,
        frame,
      },
    });
    const input = container.querySelector("input")!;
    await fireEvent.input(input, { target: { value: "乙" } });
    await component.$set({ value: "外来" });
    expect(input.value).toBe("乙");
  });
});

describe("the name cell renames by editing the title", () => {
  const name = stringField("name", true);
  const columns: TableColumn[] = [{ field: name, widthRem: 12, isPrimary: true }];
  const record: DataRecord = { id: "小坤/甲.md", values: { name: "[[小坤/甲.md|甲]]" } };

  function row(readonly = false) {
    return render(TableRow, {
      props: { columns, record, readonly, api, frame, editingField: null },
    });
  }

  it("opens a focused editor on the title and commits the typed name", async () => {
    const { container, component } = row();
    const committed: Array<{ field: string; value: string }> = [];
    component.$on("commitEdit", (event) => {
      committed.push({ field: event.detail.field, value: String(event.detail.value) });
    });
    component.$on("startEdit", (event) => {
      void component.$set({ editingField: event.detail.field });
    });
    await fireEvent.click(container.querySelector(".ppp-t2-name")!);
    const input = await waitFor(() => {
      const el = container.querySelector("input");
      expect(el).toBe(document.activeElement);
      return el!;
    });
    await fireEvent.input(input, { target: { value: "乙" } });
    await fireEvent.keyDown(input, { key: "Enter" });
    expect(committed).toEqual([{ field: "name", value: "乙" }]);
  });

  it("does not open an editor on a read-only row", async () => {
    const { container } = row(true);
    await fireEvent.click(container.querySelector(".ppp-t2-name")!);
    expect(container.querySelector("input")).toBeNull();
  });
});
