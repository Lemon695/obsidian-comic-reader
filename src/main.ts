import { Plugin } from 'obsidian';
import { ComicSettings, DEFAULT_SETTINGS, ProgressEntry } from './core/types';
import { ComicSettingsTab } from './core/settings-tab';
import { ReaderModule } from './reader/index';
import { pruneHistory } from './reader/parser';
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
		const saved = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
		this.settings.reader = Object.assign({}, DEFAULT_SETTINGS.reader, saved?.reader);
		this.settings.history = saved?.history ?? {};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	getProgress(fileName: string): ProgressEntry | undefined {
		return this.settings.history[fileName];
	}

	async saveProgress(fileName: string, entry: ProgressEntry): Promise<void> {
		this.settings.history[fileName] = entry;
		this.settings.history = pruneHistory(this.settings.history);
		await this.saveData(this.settings);
	}

	async deleteProgress(fileName: string): Promise<void> {
		delete this.settings.history[fileName];
		await this.saveData(this.settings);
	}
}
