import {
  Plugin,
  ItemView,
  WorkspaceLeaf,
  Menu,
  type ViewStateResult,
} from "obsidian";
import { get, type Unsubscriber } from "svelte/store";

import App from "src/ui/app/App.svelte";
import { i18n } from "./lib/stores/i18n";
import { settings } from "src/lib/stores/settings";
import { customViews } from "src/lib/stores/customViews";
import { BoardView } from "src/ui/views/Board";
import { CalendarView } from "src/ui/views/Calendar";
import { DashboardView } from "src/ui/views/Dashboard";
import { GalleryView } from "src/ui/views/Gallery";
// NOTE: YamlVisualizer is no longer registered as a top-level view per user
// directive 2026-05-01 — it must be a widget inside Database, not a separate
// tab. Files retained under src/ui/views/YamlVisualizer/ for upcoming widget
// conversion (Stage A revision pass).

import type { ProjectView } from "./customViewApi";
import type ProjectsPlugin from "./main";
import type { ProjectId, ViewId } from "./settings/settings";

import { VIEW_TYPE_PROJECTS } from "./viewType";

export { VIEW_TYPE_PROJECTS };

export type ProjectsViewState = {
  projectId: ProjectId;
  viewId: ViewId;
};

/**
 * ProjectsView is the main projects view. The view is primarily a Svelte
 * application, so this class mainly instantiates and mounts the Svelte app.
 */
export class ProjectsView extends ItemView {
  component?: App;
  /**
   * What Back restores, and what the workspace saves for this leaf.
   * Obsidian snapshots it with `getState` when a note replaces this view.
   */
  private navigationState: ProjectsViewState = { projectId: "", viewId: "" };

  constructor(leaf: WorkspaceLeaf, readonly plugin: ProjectsPlugin) {
    super(leaf);

    // Whether this view can be used to navigate to other Obsidian views.
    this.navigation = true;
  }

  getViewType() {
    return VIEW_TYPE_PROJECTS;
  }

  private titleUnsub?: Unsubscriber;

  getDisplayText() {
    const name = get(settings).projects.find((project) => project.id === this.navigationState.projectId)?.name;
    return name || "Projects";
  }

  /** Tab title and the inline heading both read getDisplayText. */
  private refreshTitle(): void {
    const leaf = this.leaf as WorkspaceLeaf & { updateHeader?: () => void };
    leaf.updateHeader?.();
    const root = this.containerEl.parentElement ?? this.containerEl;
    root.querySelectorAll(".inline-title, .view-header-title").forEach((el) => {
      el.textContent = this.getDisplayText();
    });
  }

  getIcon() {
    return "projects-icon";
  }

  onPaneMenu(menu: Menu, source: string) {
    if (source == "more-options" || source == "tab-header") {
      super.onPaneMenu(menu, source);
      menu.addItem((item) => {
        item
          .setTitle(get(i18n).t("menus.tab-header.new-window.title"))
          .setIcon("picture-in-picture-2")
          .onClick(() => {
            const existingLeaves =
              this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECTS);
            if (existingLeaves[0]) {
              this.app.workspace.moveLeafToPopout(existingLeaves[0]);
            }
          })
          .setSection("open");
      });
      return;
    }

    // In other cases, keep the original behavior
    super.onPaneMenu(menu, source);
  }

  getState(): Record<string, unknown> {
    return { ...this.navigationState };
  }

  async setState(
    state: unknown,
    result: ViewStateResult
  ): Promise<void> {
    const next = (state ?? {}) as Partial<ProjectsViewState>;
    this.navigationState = {
      projectId: typeof next.projectId === "string" ? next.projectId : "",
      viewId: typeof next.viewId === "string" ? next.viewId : "",
    };
    this.component?.$set({
      projectId: this.navigationState.projectId || undefined,
      viewId: this.navigationState.viewId || undefined,
    });
    this.refreshTitle();

    await super.setState(state, result);
  }

   
  async onOpen(): Promise<void> {
    customViews.set(this.getProjectViews());

    // setState has already copied the restored leaf into navigationState.
    const { projectId, viewId } = this.navigationState;

    this.component = new App({
      target: this.contentEl,
      props: {
        projectId: projectId || undefined,
        viewId: viewId || undefined,
      }
    });

    // history: false keeps a tab click from becoming its own Back step.
    // The updated state is what getState reports when a note is opened.
    const remember = (patch: Partial<ProjectsViewState>) => {
      const next: ProjectsViewState = {
        projectId: patch.projectId ?? this.navigationState.projectId,
        viewId: patch.viewId ?? this.navigationState.viewId,
      };
      if (
        next.projectId === this.navigationState.projectId &&
        next.viewId === this.navigationState.viewId
      ) return;
      void this.setState(next, { history: false });
      this.app.workspace.requestSaveLayout();
    };

    this.component.$on("projectIdChange", (event: CustomEvent<string>) => {
      remember({ projectId: event.detail });
    });
    this.component.$on("viewIdChange", (event: CustomEvent<string>) => {
      remember({ viewId: event.detail });
    });
    this.titleUnsub = settings.subscribe(() => this.refreshTitle());
    this.refreshTitle();
  }

   
  async onClose(): Promise<void> {
    this.titleUnsub?.();
    this.titleUnsub = undefined;
    if (this.component) {
      this.component.$destroy();
    }
  }

  /**
   * getProjectViews returns a map of instances for each supported Projects view.
   */
  getProjectViews() {
    const views: Record<string, ProjectView<never>> = {};

    // Allow other Obsidian plugins to register custom views.
    this.getEnabledPlugins().forEach((plugin) => {
      // Other Obsidian plugins can add an onRegisterProjectView to register a
      // Projects view.
      const registerView = plugin.onRegisterProjectView;

      if (registerView) {
        const create = registerView.bind(plugin);
        const instance = create();

        views[instance.getViewType()] = instance;
      }
    });

    // Register built-in views.
    views["board"] = new BoardView();
    views["calendar"] = new CalendarView();
    views["gallery"] = new GalleryView();
    // Dashboard view (renamed from "Database" in v4.0). Both keys point at
    // the same instance so v3 saves with `view.type === "database"` keep
    // working until the settings migrator rewrites them.
    const dashboardView = new DashboardView();
    views["dashboard"] = dashboardView;
    views["database"] = dashboardView;

    return views;
  }

  /**
   * getEnabledPlugins returns a list of the enabled Obsidian plugins.
   */
  getEnabledPlugins(): Plugin[] {
    const res: Plugin[] = [];

    for (const pluginId in this.app.plugins.plugins) {
      const plugin = this.app.plugins.getPlugin(pluginId);

      if (plugin) {
        res.push(plugin);
      }
    }

    return res;
  }
}
