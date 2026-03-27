import { App, PluginSettingTab, Plugin } from 'obsidian';
import { ComicSettings } from './types';
import { ReaderModule } from '../reader/index';

interface ComicPlugin extends Plugin {
	settings: ComicSettings;
	saveSettings(): Promise<void>;
}

export class ComicSettingsTab extends PluginSettingTab {
	constructor(
		app: App,
		plugin: ComicPlugin,
		private readerModule: ReaderModule,
	) {
		super(app, plugin);
	}

	display(): void {
		this.containerEl.empty();
		this.readerModule.renderSettings(this.containerEl);
	}
}
