import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, OPublisherSettings } from './types';
import { publishPosts } from './methods/publish-posts';
import { OPublisherSettingTab } from './settingTab';
import produce from 'immer';
import { log } from './utils/log';

const publishActionText = 'Publish or update posts';

export class OPublisherPlugin extends Plugin {
  /**
   * The plugin settings are immutable
   */
  settings: OPublisherSettings = produce(
    DEFAULT_SETTINGS,
    () => DEFAULT_SETTINGS
  );

  /**
   * Executed as soon as the plugin loads
   */
  async onload() {
    log('Initializing', 'debug');
    await this.loadSettings();

    this.addRibbonIcon('box-glyph', publishActionText, () => {
      publishPosts(this.app.vault, this.app.metadataCache, this.settings);
    });

    this.addCommand({
      id: 'publish',
      name: publishActionText,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      editorCallback: (_editor, _view) => {
        publishPosts(this.app.vault, this.app.metadataCache, this.settings);
      },
    });

    // Add a settings screen for the plugin
    this.addSettingTab(new OPublisherSettingTab(this.app, this));
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onunload() {}

  /**
   * Load the plugin settings
   */
  async loadSettings() {
    log('Loading settings', 'debug');
    let loadedSettings = (await this.loadData()) as OPublisherSettings;

    if (!loadedSettings) {
      log('Using default settings', 'debug');
      loadedSettings = DEFAULT_SETTINGS;
    }

    this.settings = produce(this.settings, (draft) => {
      draft.automaticPublication = loadedSettings.automaticPublication;
      draft.ghostSettings = loadedSettings.ghostSettings;
      draft.cloudinarySettings = loadedSettings.cloudinarySettings;
    });
    log(`Settings loaded`, 'debug', loadedSettings);
  }

  /**
   * Save the plugin settings
   */
  async saveSettings() {
    log('Saving settings', 'debug');
    await this.saveData(this.settings);
  }
}
