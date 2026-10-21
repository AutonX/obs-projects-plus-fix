import { describe, expect, test } from "@jest/globals";
import { DataFieldType } from "src/lib/dataframe/dataframe";
import {
  boardConfigForCreate,
  boardGroupFields,
  groupFieldPreset,
} from "./addViewConfig";

describe("boardGroupFields", () => {
  test("keeps stored string fields and drops derived, dates and numbers", () => {
    expect(
      boardGroupFields([
        { name: "分类", type: DataFieldType.String, derived: false },
        { name: "状态", type: DataFieldType.String, derived: false },
        { name: "计数", type: DataFieldType.Number, derived: false },
        { name: "日期", type: DataFieldType.Date, derived: false },
        { name: "公式", type: DataFieldType.String, derived: true },
      ])
    ).toEqual(["分类", "状态"]);
  });
});

describe("groupFieldPreset", () => {
  const names = ["分类", "状态", "版本"];

  test("uses the view name when it is a group field", () => {
    expect(groupFieldPreset("版本", names)).toBe("版本");
    expect(groupFieldPreset("  状态  ", names)).toBe("状态");
  });

  test("does not invent a field from an ordinary view name", () => {
    expect(groupFieldPreset("我的看板", names)).toBeUndefined();
    expect(groupFieldPreset("", names)).toBeUndefined();
  });
});

describe("boardConfigForCreate", () => {
  test("writes the grouping and skips a blank choice", () => {
    expect(boardConfigForCreate(" 版本 ")).toEqual({ groupByField: "版本" });
    expect(boardConfigForCreate("  ")).toBeUndefined();
  });
});
