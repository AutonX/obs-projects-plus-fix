import { Notice, type App, type TAbstractFile } from "obsidian";
import { logError } from "src/lib/errors/errorLog";
import { noticeFor } from "src/lib/errors/errorText";

const RENAME_FAILED = "PPP-301";
const ILLEGAL_NAME = /[\\/:*?"<>|]/;

/** Focus an editor once it has mounted. A tick() from the parent runs too early. */
export function focusEditor(node: HTMLElement, select = false): void {
  node.focus();
  if (select && node instanceof HTMLInputElement) node.select();
}

/**
 * Path of the renamed note in the same folder, or null when the name is
 * empty, unchanged, or contains a character a file name cannot hold.
 * Callers treat null as a silent cancel except when the typed name itself
 * is illegal.
 */
export function renamedNotePath(currentPath: string, nextName: string): string | null {
  const trimmed = nextName.trim().replace(/\.md$/i, "");
  if (!trimmed || ILLEGAL_NAME.test(trimmed)) return null;
  const slash = currentPath.lastIndexOf("/");
  const current = (slash >= 0 ? currentPath.slice(slash + 1) : currentPath).replace(/\.md$/i, "");
  if (trimmed === current) return null;
  const parent = slash >= 0 ? currentPath.slice(0, slash) : "";
  return parent ? `${parent}/${trimmed}.md` : `${trimmed}.md`;
}

export async function renameTableNote(app: App, currentPath: string, nextName: string): Promise<void> {
  const nextPath = renamedNotePath(currentPath, nextName);
  if (!nextPath) {
    const trimmed = nextName.trim().replace(/\.md$/i, "");
    if (trimmed && ILLEGAL_NAME.test(trimmed)) new Notice(noticeFor(RENAME_FAILED));
    return;
  }
  const file = app.vault.getAbstractFileByPath(currentPath);
  if (!file) {
    new Notice(noticeFor(RENAME_FAILED));
    return;
  }
  try {
    await app.fileManager.renameFile(file as TAbstractFile, nextPath);
  } catch (error) {
    logError(RENAME_FAILED, currentPath, error);
    new Notice(noticeFor(RENAME_FAILED));
  }
}
