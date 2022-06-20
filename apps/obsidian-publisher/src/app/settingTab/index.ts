import { App, PluginSettingTab, Setting } from 'obsidian';
import { OPublisherPlugin } from '../plugin';
import * as pluginManifest from '../../assets/manifest.json';
import produce from 'immer';
import { log } from '../utils/log';
import { stripTrailingSlash } from '../utils/strip-trailing-slash';

export class OPublisherSettingTab extends PluginSettingTab {
  plugin: OPublisherPlugin;

  constructor(app: App, plugin: OPublisherPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: pluginManifest.name });

    new Setting(containerEl).setName('Publish to Ghost').addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.ghostSettings.enabled)
        .onChange(async (value) => {
          log('Publish to Ghost set to: ' + value, 'debug');
          this.plugin.settings = produce(this.plugin.settings, (draft) => {
            draft.ghostSettings.enabled = value;
          });
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl).setName('Ghost Admin Token').addText((text) =>
      text
        .setDisabled(!this.plugin.settings.ghostSettings.enabled)
        .setPlaceholder('...')
        .setValue(this.plugin.settings.ghostSettings.adminToken)
        .onChange(async (value) => {
          // WARNING: do NOT log the token!
          this.plugin.settings = produce(this.plugin.settings, (draft) => {
            draft.ghostSettings.adminToken = value;
          });
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl).setName('Ghost Site Base URL').addText((text) =>
      text
        .setDisabled(!this.plugin.settings.ghostSettings.enabled)
        .setPlaceholder('https://...')
        .setValue(this.plugin.settings.ghostSettings.baseUrl)
        .onChange(async (value) => {
          // Make sure there is no ending slash and no whitespace at the end
          const newValue = stripTrailingSlash(value.trim());
          log('Ghost site base URL set to: ' + newValue, 'debug');

          this.plugin.settings = produce(this.plugin.settings, (draft) => {
            draft.ghostSettings.baseUrl = newValue;
          });
          await this.plugin.saveSettings();
        })
    );
  }
}
