import { renamedNotePath, renameTableNote } from "../noteRename";
import type { App } from "obsidian";

function appWith(renameFile: (file: unknown, path: string) => Promise<void>, file: unknown = { path: "小坤/甲.md" }) {
  return {
    vault: { getAbstractFileByPath: () => file },
    fileManager: { renameFile },
  } as unknown as App;
}

describe("renamedNotePath", () => {
  it("keeps the note in its folder and appends .md", () => {
    expect(renamedNotePath("小坤/甲.md", "乙")).toBe("小坤/乙.md");
  });

  it("strips a typed extension and surrounding space", () => {
    expect(renamedNotePath("小坤/甲.md", "  乙.md  ")).toBe("小坤/乙.md");
  });

  it("renames a note that sits at the vault root", () => {
    expect(renamedNotePath("甲.md", "乙")).toBe("乙.md");
  });

  it("returns null for an empty or unchanged name", () => {
    expect(renamedNotePath("小坤/甲.md", "   ")).toBeNull();
    expect(renamedNotePath("小坤/甲.md", "甲")).toBeNull();
    expect(renamedNotePath("小坤/甲.md", "甲.md")).toBeNull();
  });

  it("returns null when the name cannot be a file", () => {
    expect(renamedNotePath("小坤/甲.md", "乙/丙")).toBeNull();
    expect(renamedNotePath("小坤/甲.md", "乙:丙")).toBeNull();
  });
});

describe("renameTableNote", () => {
  it("renames the file the row points at", async () => {
    const renameFile = jest.fn(async () => undefined);
    await renameTableNote(appWith(renameFile), "小坤/甲.md", "乙");
    expect(renameFile).toHaveBeenCalledWith(expect.anything(), "小坤/乙.md");
  });

  it("does nothing when the name did not change", async () => {
    const renameFile = jest.fn(async () => undefined);
    await renameTableNote(appWith(renameFile), "小坤/甲.md", "甲");
    expect(renameFile).not.toHaveBeenCalled();
  });

  it("does not rename when the typed name is illegal", async () => {
    const renameFile = jest.fn(async () => undefined);
    await renameTableNote(appWith(renameFile), "小坤/甲.md", "乙/丙");
    expect(renameFile).not.toHaveBeenCalled();
  });

  it("stays quiet when the file is already gone", async () => {
    const renameFile = jest.fn(async () => undefined);
    await expect(renameTableNote(appWith(renameFile, null), "小坤/甲.md", "乙")).resolves.toBeUndefined();
    expect(renameFile).not.toHaveBeenCalled();
  });

  it("swallows a rename that the vault rejects", async () => {
    const renameFile = jest.fn(async () => {
      throw new Error("File already exists");
    });
    await expect(renameTableNote(appWith(renameFile), "小坤/甲.md", "乙")).resolves.toBeUndefined();
  });
});
