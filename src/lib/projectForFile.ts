/**
 * Which folder-project owns a note.
 *
 * A project is one folder. Recursive projects own every note under that
 * folder; the others own only the notes sitting directly in it. The longest
 * matching folder wins, so a nested project beats its parent.
 */

export type ProjectFolderCandidate = {
  readonly id: string;
  readonly dataSource: {
    readonly kind: string;
    readonly config: object;
  };
};

export function projectIdForFile(
  projects: readonly ProjectFolderCandidate[],
  filePath: string | undefined,
  kind: "file" | "folder" = "file"
): string | undefined {
  const file = normalize(filePath);
  if (!file) return undefined;

  let best: { id: string; length: number } | undefined;
  for (const project of projects) {
    const scope = folderScope(project);
    if (!scope) continue;
    const inside = file === scope.path || file.startsWith(`${scope.path}/`);
    const owns = scope.recursive
      ? inside
      : kind === "folder"
        ? file === scope.path
        : parentOf(file) === scope.path;
    if (!owns) continue;
    if (!best || scope.path.length > best.length) {
      best = { id: project.id, length: scope.path.length };
    }
  }
  return best?.id;
}

function folderScope(
  project: ProjectFolderCandidate
): { path: string; recursive: boolean } | undefined {
  if (project.dataSource.kind !== "folder") return undefined;
  const config = project.dataSource.config as { path?: unknown; recursive?: unknown };
  const path = normalize(typeof config.path === "string" ? config.path : undefined);
  if (!path) return undefined;
  return { path, recursive: config.recursive === true };
}

function parentOf(file: string): string {
  const slash = file.lastIndexOf("/");
  return slash === -1 ? "" : file.slice(0, slash);
}

function normalize(path: string | undefined): string {
  if (!path) return "";
  return path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}
