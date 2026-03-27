import { Setting } from 'obsidian';
import { MANGA_VIEW_TYPE } from '../constants';
import type ComicReaderPlugin from '../main';
import type { PluginModule } from '../core/types';
import { t } from '../i18n/locale';
import { commandsI18n } from '../i18n/reader/commands';
import { settingsI18n } from '../i18n/reader/settings';
import { readerModuleI18n } from '../i18n/reader/module';
import { ImageManager } from './image-manager';
import { MangaReaderView } from './view';
import { ComicSourceService, FileService } from '../services';
import type { Bookmark } from '../types/reader';
import type { ComicSource } from '../types/comic';
import { getComicSourceKey } from '../types/comic';

interface OpenComicOptions {
	source?: ComicSource;
	startPage?: number;
}

export class ReaderModule implements PluginModule {
	readonly id = 'reader';
	private readonly fileService: FileService;
	private readonly sourceService: ComicSourceService;

	constructor(private readonly plugin: ComicReaderPlugin) {
		this.fileService = new FileService(plugin.app);
		this.sourceService = new ComicSourceService(plugin.app);
	}

	get name(): string {
		return t(readerModuleI18n, this.plugin.settings.ui.language).name;
	}

	get description(): string {
		return t(readerModuleI18n, this.plugin.settings.ui.language).description;
	}

	onload(): void {
		const cmdI18n = t(commandsI18n, this.plugin.settings.ui.language);

		this.plugin.registerView(
			MANGA_VIEW_TYPE,
			(leaf) => new MangaReaderView(
				leaf,
				new ImageManager(),
				this.plugin.settings.reader,
				(fileName) => this.plugin.getProgress(fileName),
				(fileName, entry) => this.plugin.saveProgress(fileName, entry),
				(fileName, pageIndex) => this.createBookmark(fileName, pageIndex),
				this.plugin.settings.ui.language,
			)
		);

		this.plugin.addCommand({
			id: 'open-comic-zip',
			name: cmdI18n.openComic,
			callback: () => this.openFileAndLoad(),
		});

		this.plugin.addRibbonIcon('book-open', cmdI18n.ribbonTooltip, () => this.openFileAndLoad());
	}

	onunload(): void {
		this.plugin.app.workspace.detachLeavesOfType(MANGA_VIEW_TYPE);
	}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(settingsI18n, this.plugin.settings.ui.language);

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

	async openFileAndLoad(): Promise<void> {
		const handle = await this.fileService.requestExternalFileAccess();
		if (!handle) return;

		const file = await this.fileService.getFileFromHandle(handle);
		if (!file) return;

		await this.openMangaViewFromFile(file, {
			source: this.sourceService.createExternalSource(file.name),
		});
	}

	async openMangaViewFromFile(file: File, options?: OpenComicOptions): Promise<void> {
		const source = options?.source;
		const entryKey = source ? getComicSourceKey(source) : file.name;

		// 记录打开时间（保留已有页码）
		const existing = this.plugin.getProgress(entryKey);
		await this.plugin.saveProgress(entryKey, {
			page: existing?.page ?? 0,
			total: existing?.total ?? 0,
			openedAt: Date.now(),
			fileName: file.name,
			source,
		});

		const workspace = this.plugin.app.workspace;
		const leaf = workspace.getLeaf(true);

		await leaf.setViewState({ type: MANGA_VIEW_TYPE });

		const view = leaf.view as MangaReaderView;
		if (view) {
			await view.setState({
				file,
				entryKey,
				source,
				startPage: options?.startPage,
			});
		}

		workspace.revealLeaf(leaf);
	}

	private async createBookmark(fileName: string, pageIndex: number, source?: ComicSource): Promise<void> {
		const bookmark: Bookmark = {
			id: `bookmark_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
			comicPath: fileName,
			comicName: fileName,
			pageIndex,
			createdAt: Date.now(),
			source,
		};
		await this.plugin.addBookmark(bookmark);
	}
}
