import { projectIdForFile, type ProjectFolderCandidate } from "./projectForFile";

function folder(id: string, path: string, recursive: boolean): ProjectFolderCandidate {
  return { id, dataSource: { kind: "folder", config: { path, recursive } } };
}

const projects = [
  folder("xiaokun", "小坤", true),
  folder("general", "通用", false),
  folder("nested", "小坤/版本", true),
  { id: "tagged", dataSource: { kind: "tag", config: { tag: "小坤" } } },
];

describe("projectIdForFile", () => {
  it("picks the recursive folder that contains the note", () => {
    expect(projectIdForFile(projects, "小坤/环境/登录账号.md")).toBe("xiaokun");
  });

  it("prefers the longer nested folder over its parent", () => {
    expect(projectIdForFile(projects, "小坤/版本/v2.3.md")).toBe("nested");
  });

  it("keeps a non-recursive folder to the notes directly inside it", () => {
    expect(projectIdForFile(projects, "通用/备忘.md")).toBe("general");
    expect(projectIdForFile(projects, "通用/子目录/备忘.md")).toBeUndefined();
  });

  it("does not treat a sibling file as inside the folder", () => {
    expect(projectIdForFile(projects, "小坤.md")).toBeUndefined();
  });

  it("returns nothing when no note is open", () => {
    expect(projectIdForFile(projects, undefined)).toBeUndefined();
  });

  it("matches a folder click on that folder, including a nested one", () => {
    expect(projectIdForFile(projects, "通用", "folder")).toBe("general");
    expect(projectIdForFile(projects, "小坤/环境", "folder")).toBe("xiaokun");
    expect(projectIdForFile(projects, "小坤/版本", "folder")).toBe("nested");
    expect(projectIdForFile(projects, "通用/子目录", "folder")).toBeUndefined();
  });
});
