import { StrictMode } from "react";
import { App, Modal, WorkspaceLeaf } from "obsidian";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { StatusBar } from "./StatusBar";
import type { RevectSettings } from "./SettingsTab";

export class StatusBarModal extends Modal {
  root: Root | null = null;
  settings: RevectSettings;

  constructor(app: App, settings: RevectSettings) {
    super(app);
    this.settings = settings;
  }

  getViewType() {
    return "revect-status-view";
  }

  getDisplayText() {
    return "Example view";
  }

  async onOpen() {
    const { contentEl } = this;
    // Clear any default content or add a title if desired
    contentEl.empty();
    // contentEl.createEl("h2", { text: "Revect Status" }); // Optional title

    // Create a container div for React to render into
    const reactContainer = contentEl.createDiv();
    this.root = createRoot(reactContainer);
    this.root.render(
      <StrictMode>
        {/* Pass any necessary props to StatusBar here */}
        <StatusBar app={this.app} settings={this.settings} />
      </StrictMode>
    );
  }

  async onClose() {
    const { contentEl } = this;
    // Unmount the React component to prevent memory leaks
    this.root?.unmount();
    // Clear the modal's content
    contentEl.empty();
  }
}
