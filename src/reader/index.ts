import { Plugin, Setting } from 'obsidian';
import { MANGA_VIEW_TYPE } from '../constants';
import { ComicSettings, ProgressEntry } from '../core/types';
import { t } from '../i18n/locale';
import { commandsI18n } from '../i18n/reader/commands';
import { settingsI18n } from '../i18n/reader/settings';
import { historyI18n } from '../i18n/reader/history';
import { ImageManager } from './image-manager';
import { MangaReaderView } from './view';
import { HistoryModal } from './history-modal';
import { getRecentHistory } from './parser';

// Minimal interface to avoid circular dependency with main.ts
interface ComicPlugin extends Plugin {
	settings: ComicSettings;
	saveSettings(): Promise<void>;
	getProgress(fileName: string): ProgressEntry | undefined;
	saveProgress(fileName: string, entry: ProgressEntry): Promise<void>;
	deleteProgress(fileName: string): Promise<void>;
}

export class ReaderModule {
	constructor(private plugin: ComicPlugin) {}

	onload(): void {
		const cmdI18n = t(commandsI18n);
		const histI18n = t(historyI18n);

		this.plugin.registerView(
			MANGA_VIEW_TYPE,
			(leaf) => new MangaReaderView(
				leaf,
				new ImageManager(),
				this.plugin.settings.reader,
				(fileName) => this.plugin.getProgress(fileName),
				(fileName, entry) => this.plugin.saveProgress(fileName, entry),
			)
		);

		this.plugin.addCommand({
			id: 'open-comic-zip',
			name: cmdI18n.openComic,
			callback: () => this.openFileAndLoad(),
		});

		this.plugin.addRibbonIcon('book-open', cmdI18n.ribbonTooltip, () => this.openFileAndLoad());

		this.plugin.addCommand({
			id: 'view-reading-history',
			name: histI18n.commandName,
			callback: () => this.openHistoryModal(),
		});
	}

	onunload(): void {
		this.plugin.app.workspace.detachLeavesOfType(MANGA_VIEW_TYPE);
	}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(settingsI18n);

		containerEl.createEl('h2', { text: i18n.sectionTitle });

		new Setting(containerEl)
			.setName(i18n.thumbnailCount.name)
			.setDesc(i18n.thumbnailCount.desc)
			.addText(text => text
				.setValue(String(this.plugin.settings.reader.thumbnailCount))
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num) && num > 0) {
						this.plugin.settings.reader.thumbnailCount = num;
						await this.plugin.saveSettings();
					}
				})
			);

		new Setting(containerEl)
			.setName(i18n.sortOrder.name)
			.setDesc(i18n.sortOrder.desc)
			.addDropdown(drop => drop
				.addOption('numeric', i18n.sortNumeric)
				.addOption('alpha', i18n.sortAlpha)
				.setValue(this.plugin.settings.reader.sortOrder)
				.onChange(async (value: string) => {
					this.plugin.settings.reader.sortOrder = value as 'numeric' | 'alpha';
					await this.plugin.saveSettings();
				})
			);
	}

	private openHistoryModal(): void {
		const entries = getRecentHistory(this.plugin.settings.history);
		new HistoryModal(
			this.plugin.app,
			entries,
			(fileName) => this.plugin.deleteProgress(fileName),
		).open();
	}

	private async openFileAndLoad(): Promise<void> {
		try {
			const i18n = t(commandsI18n);
			const fileHandle = await window.showOpenFilePicker({
				types: [{
					description: i18n.filePickerDesc,
					accept: { 'application/zip': ['.zip'] },
				}],
			});

			if (fileHandle?.[0]) {
				const file = await fileHandle[0].getFile();
				await this.openMangaView(file);
			}
		} catch (error) {
			// User cancelled the file picker — no action needed
		}
	}

	private async openMangaView(file: File): Promise<void> {
		// 记录打开时间（保留已有页码）
		const existing = this.plugin.getProgress(file.name);
		await this.plugin.saveProgress(file.name, {
			page: existing?.page ?? 0,
			total: existing?.total ?? 0,
			openedAt: Date.now(),
		});

		const workspace = this.plugin.app.workspace;
		const leaf = workspace.getLeaf('split', 'vertical');

		await leaf.setViewState({ type: MANGA_VIEW_TYPE });

		const view = leaf.view as MangaReaderView;
		if (view) {
			await view.setState({ file });
		}

		workspace.revealLeaf(leaf);
	}
}
