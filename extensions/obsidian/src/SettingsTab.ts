import { App, PluginSettingTab, Setting } from "obsidian";
import RevectPlugin from "./main";

export interface RevectSettings {
  apiUrl: string;
}

export const DEFAULT_SETTINGS: RevectSettings = {
  apiUrl: "default",
};

export class SettingsTab extends PluginSettingTab {
  plugin: RevectPlugin;

  constructor(app: App, plugin: RevectPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    //@ts-ignore
    new Setting(containerEl)
      .setName("Setting #1")
      .setDesc("It's a secret")
      .addText((text) =>
        text
          .setPlaceholder("Enter your api url")
          .setValue(this.plugin.settings.apiUrl)
          .onChange(async (value) => {
            this.plugin.settings.apiUrl = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
