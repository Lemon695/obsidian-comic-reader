import { Plugin } from 'obsidian';
import { ComicSettings, DEFAULT_SETTINGS } from './core/types';
import { ComicSettingsTab } from './core/settings-tab';
import { ReaderModule } from './reader/index';
import './types';

export default class ComicReaderPlugin extends Plugin {
	settings: ComicSettings;
	private readerModule: ReaderModule;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.readerModule = new ReaderModule(this);
		this.readerModule.onload();
		this.addSettingTab(new ComicSettingsTab(this.app, this, this.readerModule));
	}

	onunload(): void {
		this.readerModule.onunload();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		// Deep merge reader settings to preserve defaults for new keys
		this.settings.reader = Object.assign({}, DEFAULT_SETTINGS.reader, this.settings.reader);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
