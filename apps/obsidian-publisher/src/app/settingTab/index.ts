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
    containerEl.createEl('h1', { text: pluginManifest.name });

    containerEl.createEl('hr');
    containerEl.createEl('h3', { text: 'Ghost settings'});

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

    new Setting(containerEl).setName('Ghost Site API URL').addText((text) =>
      text
        .setPlaceholder('https://...')
        .setValue(this.plugin.settings.ghostSettings.apiUrl)
        .onChange(async (value) => {
          // Make sure there is no ending slash and no whitespace at the end
          // Otherwise the Ghost Admin API client will fail
          const newValue = stripTrailingSlash(value.trim());
          log('Ghost site API URL set to: ' + newValue, 'debug');

          this.plugin.settings = produce(this.plugin.settings, (draft) => {
            draft.ghostSettings.apiUrl = newValue;
          });
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl).setName('Ghost Site Base URL').addText((text) =>
      text
        .setPlaceholder('https://...')
        .setValue(this.plugin.settings.ghostSettings.baseUrl)
        .onChange(async (value) => {
          // Make sure there is no ending slash and no whitespace at the end
          // Otherwise the Ghost Admin API client will fail
          const newValue = stripTrailingSlash(value.trim());
          log('Ghost site Base URL set to: ' + newValue, 'debug');

          this.plugin.settings = produce(this.plugin.settings, (draft) => {
            draft.ghostSettings.baseUrl = newValue;
          });
          await this.plugin.saveSettings();
        })
    );

    containerEl.createEl('hr');
    containerEl.createEl('h3', { text: 'Cloudinary settings'});

    new Setting(containerEl).setName('Upload images to Cloudinary').addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.cloudinarySettings.enabled)
        .onChange(async (value) => {
          log('Upload images to Cloudinary set to: ' + value, 'debug');
          this.plugin.settings = produce(this.plugin.settings, (draft) => {
            draft.cloudinarySettings.enabled = value;
          });
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl).setName('Cloudinary Cloud Name').addText((text) =>
      text
        .setPlaceholder('...')
        .setValue(this.plugin.settings.cloudinarySettings.cloudName)
        .onChange(async (value) => {
          // WARNING: do NOT log the token!
          this.plugin.settings = produce(this.plugin.settings, (draft) => {
            draft.cloudinarySettings.cloudName = value;
          });
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl).setName('Cloudinary API Key').addText((text) =>
      text
        .setPlaceholder('...')
        .setValue(this.plugin.settings.cloudinarySettings.apiKey)
        .onChange(async (value) => {
          // Make sure there is no whitespace at the end
          const newValue = value.trim();
          // WARNING: do NOT log the key!
          this.plugin.settings = produce(this.plugin.settings, (draft) => {
            draft.cloudinarySettings.apiKey = newValue;
          });
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl).setName('Cloudinary API Secret').addText((text) =>
      text
        .setPlaceholder('...')
        .setValue(this.plugin.settings.cloudinarySettings.apiSecret)
        .onChange(async (value) => {
          // Make sure there is no whitespace at the end
          const newValue = value.trim();
          // WARNING: do NOT log the key!
          this.plugin.settings = produce(this.plugin.settings, (draft) => {
            draft.cloudinarySettings.apiSecret = newValue;
          });
          await this.plugin.saveSettings();
        })
    );
  }
}
