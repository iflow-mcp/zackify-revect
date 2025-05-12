import { Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  SettingsTab,
  type RevectSettings,
} from "./SettingsTab";
import { StatusBarModal } from "./StatusBarModal";
import { indexToApi } from "./indexToApi";

const revectStatusView = "revect-status-view";
export default class RevectPlugin extends Plugin {
  //@ts-ignore
  settings: RevectSettings;

  async onload() {
    await this.loadSettings();

    // --- Setup Status Bar Item ---
    const statusBarItemEl = this.addStatusBarItem();
    statusBarItemEl.setText("revect.io"); // Keep or change icon
    // Update the click event to open the modal
    statusBarItemEl.onClickEvent(() => {
      new StatusBarModal(this.app, this.settings).open();
    });

    // This adds an editor command that can perform some operation on the current editor instance
    this.addCommand({
      id: "revect-index-page",
      name: "Index current page",
      editorCallback: async (editor, view) => {
        const text = editor.getValue();

        if (!view.file) return;
        await indexToApi({
          apiUrl: this.settings.apiUrl,
          text,
          external_id: view.file?.path,
        });
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SettingsTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
