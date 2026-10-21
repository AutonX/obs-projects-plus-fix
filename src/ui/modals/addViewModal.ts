import { App, Modal } from "obsidian";
import type {
  ProjectDefinition,
  ProjectId,
  ViewDefinition,
} from "src/settings/settings";

import AddView from "./components/AddView.svelte";

export class AddViewModal extends Modal {
  component?: AddView;

  constructor(
    app: App,
    readonly project: ProjectDefinition,
    readonly onSave: (projectId: ProjectId, view: ViewDefinition) => void,
    /** Project whose open data frame supplies the group-field list. */
    readonly fieldProjectId: ProjectId
  ) {
    super(app);
    // ios-r1: the plugin root that tokens.css's touch input-size and
    // reduced-motion rules reach. Not `projects-modal`: that class also
    // restyles every native select (styles.css), which would change this
    // modal on desktop.
    this.containerEl.addClass("ppp-add-view-modal");
    // ios-m1: the shared plugin modal root, carried by every plugin modal.
    this.containerEl.addClass("ppp-modal");
  }

  onOpen() {
    this.component = new AddView({
      target: this.contentEl,
      props: {
        project: this.project,
        fieldProjectId: this.fieldProjectId,
        onSave: (projectId: ProjectId, view: ViewDefinition) => {
          this.onSave(projectId, view);
          this.close();
        },
      },
    });
  }

  onClose() {
    if (this.component) {
      this.component.$destroy();
    }
  }
}
