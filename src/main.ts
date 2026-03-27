import { Plugin } from 'obsidian';
import { ComicSettings, DEFAULT_SETTINGS, ProgressEntry } from './core/types';
import { ComicSettingsTab } from './core/settings-tab';
import { ModuleManager } from './core/module-manager';
import { ReaderModule } from './reader/index';
import { LibraryModule } from './library/index';
import { HistoryModule } from './history/index';
import { BookmarkModule } from './bookmarks/index';
import { pruneHistory } from './reader/parser';
import { ComicSourceService } from './services';
import type { HistoryItem } from './types/history';
import type { Settings } from './types/settings';
import type { Bookmark } from './types/reader';
import type { ComicSource } from './types/comic';
import { getComicSourceKey } from './types/comic';
import './types';

interface OpenComicOptions {
	source?: ComicSource;
	startPage?: number;
}

export default class ComicReaderPlugin extends Plugin {
	settings!: ComicSettings;
	moduleManager!: ModuleManager;
	private readerModule!: ReaderModule;
	private libraryModule!: LibraryModule;
	private historyModule!: HistoryModule;
	private bookmarkModule!: BookmarkModule;
	private sourceService!: ComicSourceService;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.moduleManager = new ModuleManager(this);
		this.sourceService = new ComicSourceService(this.app);

		this.readerModule = new ReaderModule(this);
		this.libraryModule = new LibraryModule(this);
		this.historyModule = new HistoryModule(this);
		this.bookmarkModule = new BookmarkModule(this);

		this.moduleManager.register(this.readerModule);
		this.moduleManager.register(this.libraryModule);
		this.moduleManager.register(this.historyModule);
		this.moduleManager.register(this.bookmarkModule);
		await this.moduleManager.loadAll();

		this.addSettingTab(new ComicSettingsTab(this.app, this));
	}

	onunload(): void {
		this.moduleManager.unloadAll();
	}

	async loadSettings(): Promise<void> {
		const saved = await this.loadData() as Partial<ComicSettings> & Record<string, unknown> | null;
		const raw = (saved ?? {}) as Record<string, unknown>;
		const savedLibrary = saved?.library;
		const savedHistoryConfig = saved?.historyConfig;
		const savedUi = saved?.ui;
		const savedPerformance = saved?.performance;
		const savedBookmarks = saved?.bookmarks;
		const savedLibraryFolders = savedLibrary?.libraryFolders;
		const normalizedSavedLibraryFolders = Array.isArray(savedLibraryFolders)
			? savedLibraryFolders
			: undefined;
		const legacyLibraryFolders = Array.isArray(raw.libraryFolders)
			? raw.libraryFolders as string[]
			: undefined;
		const legacyScanSubfolders = typeof raw.scanSubfolders === 'boolean'
			? raw.scanSubfolders as boolean
			: undefined;
		const legacyShowHiddenFiles = typeof raw.showHiddenFiles === 'boolean'
			? raw.showHiddenFiles as boolean
			: undefined;
		const legacyMaxHistoryItems = typeof raw.maxHistoryItems === 'number'
			? raw.maxHistoryItems as number
			: undefined;
		const legacyLanguage = typeof raw.language === 'string'
			? raw.language as ComicSettings['ui']['language']
			: undefined;
		const legacyMaxCacheSize = typeof raw.maxCacheSize === 'number'
			? raw.maxCacheSize as number
			: undefined;

		this.settings = {
			moduleEnabled: {
				...DEFAULT_SETTINGS.moduleEnabled,
				...(saved?.moduleEnabled ?? {}),
			},
			reader: {
				...DEFAULT_SETTINGS.reader,
				...(saved?.reader ?? {}),
			},
			library: {
				...DEFAULT_SETTINGS.library,
				...(savedLibrary ?? {}),
				libraryFolders: normalizedSavedLibraryFolders
					? normalizedSavedLibraryFolders
					: legacyLibraryFolders
						? legacyLibraryFolders
						: DEFAULT_SETTINGS.library.libraryFolders,
				scanSubfolders: typeof savedLibrary?.scanSubfolders === 'boolean'
					? savedLibrary.scanSubfolders
					: typeof legacyScanSubfolders === 'boolean'
						? legacyScanSubfolders
						: DEFAULT_SETTINGS.library.scanSubfolders,
				showHiddenFiles: typeof savedLibrary?.showHiddenFiles === 'boolean'
					? savedLibrary.showHiddenFiles
					: typeof legacyShowHiddenFiles === 'boolean'
						? legacyShowHiddenFiles
						: DEFAULT_SETTINGS.library.showHiddenFiles,
			},
			history: saved?.history ?? {},
			bookmarks: Array.isArray(savedBookmarks)
				? savedBookmarks as Bookmark[]
				: Array.isArray(raw.bookmarks)
					? raw.bookmarks as Bookmark[]
					: DEFAULT_SETTINGS.bookmarks,
			historyConfig: {
				...DEFAULT_SETTINGS.historyConfig,
				...(savedHistoryConfig ?? {}),
				maxItems: typeof savedHistoryConfig?.maxItems === 'number'
					? savedHistoryConfig.maxItems
					: typeof legacyMaxHistoryItems === 'number'
						? legacyMaxHistoryItems
						: DEFAULT_SETTINGS.historyConfig.maxItems,
			},
			ui: {
				...DEFAULT_SETTINGS.ui,
				...(savedUi ?? {}),
				language: typeof savedUi?.language === 'string'
					? savedUi.language
					: legacyLanguage
						? legacyLanguage
						: DEFAULT_SETTINGS.ui.language,
			},
			performance: {
				...DEFAULT_SETTINGS.performance,
				...(savedPerformance ?? {}),
				maxCacheSize: typeof savedPerformance?.maxCacheSize === 'number'
					? savedPerformance.maxCacheSize
					: typeof legacyMaxCacheSize === 'number'
						? legacyMaxCacheSize
						: DEFAULT_SETTINGS.performance.maxCacheSize,
			},
		};

		this.settings.history = this.pruneHistoryEntries(this.settings.history);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	getProgress(fileName: string): ProgressEntry | undefined {
		return this.settings.history[fileName];
	}

	async saveProgress(fileName: string, entry: ProgressEntry): Promise<void> {
		const previous = this.settings.history[fileName];
		this.settings.history[fileName] = { ...previous, ...entry };
		this.settings.history = this.pruneHistoryEntries(this.settings.history);
		await this.saveSettings();
	}

	async deleteProgress(fileName: string): Promise<void> {
		delete this.settings.history[fileName];
		await this.saveSettings();
	}

	pruneHistoryEntries(history: ComicSettings['history']): ComicSettings['history'] {
		return pruneHistory(history, this.settings.historyConfig.maxItems);
	}

	getHistory(): HistoryItem[] {
		return Object.entries(this.settings.history)
			.map(([entryKey, entry]) => ({
				id: `history_${entryKey}`,
				path: entry.source?.kind === 'vault' ? entry.source.path : entryKey,
				fileName: entry.fileName ?? entryKey,
				lastOpened: entry.openedAt,
				lastPage: entry.page,
				totalPages: entry.total,
				sourceType: entry.source?.kind === 'vault' ? 'vault' as const : 'external' as const,
			}))
			.sort((a, b) => b.lastOpened - a.lastOpened);
	}

	async clearHistory(): Promise<void> {
		this.settings.history = {};
		await this.saveSettings();
	}

	getBookmarks(): Bookmark[] {
		return [...this.settings.bookmarks].sort((a, b) => b.createdAt - a.createdAt);
	}

	async addBookmark(bookmark: Bookmark): Promise<void> {
		const existingIndex = this.settings.bookmarks.findIndex(
			(item) =>
				(item.source && bookmark.source
					? getComicSourceKey(item.source) === getComicSourceKey(bookmark.source)
					: item.comicPath === bookmark.comicPath) &&
				item.pageIndex === bookmark.pageIndex,
		);

		if (existingIndex >= 0) {
			this.settings.bookmarks[existingIndex] = bookmark;
		} else {
			this.settings.bookmarks.unshift(bookmark);
		}

		await this.saveSettings();
	}

	async deleteBookmark(bookmarkId: string): Promise<void> {
		this.settings.bookmarks = this.settings.bookmarks.filter((item) => item.id !== bookmarkId);
		await this.saveSettings();
	}

	async clearBookmarks(): Promise<void> {
		this.settings.bookmarks = [];
		await this.saveSettings();
	}

	getSettings(): Settings {
		return {
			defaultMode: 'single',
			defaultDirection: 'ltr',
			defaultZoom: 100,
			autoSaveProgress: true,
			preloadPages: 3,
			rememberModePerComic: false,
			libraryFolders: this.settings.library.libraryFolders,
			scanSubfolders: this.settings.library.scanSubfolders,
			showHiddenFiles: this.settings.library.showHiddenFiles,
			maxHistoryItems: this.settings.historyConfig.maxItems,
			clearHistoryOnExit: false,
			showThumbnailBar: true,
			thumbnailSize: 'medium',
			showPageNumber: true,
			showToolbar: true,
			language: this.settings.ui.language,
			maxCacheSize: this.settings.performance.maxCacheSize,
			enableHardwareAcceleration: true,
		};
	}

	async updateSettings(partial: Partial<Settings>): Promise<void> {
		if (partial.libraryFolders) {
			this.settings.library.libraryFolders = partial.libraryFolders.length > 0
				? partial.libraryFolders
				: DEFAULT_SETTINGS.library.libraryFolders;
		}
		if (typeof partial.scanSubfolders === 'boolean') {
			this.settings.library.scanSubfolders = partial.scanSubfolders;
		}
		if (typeof partial.showHiddenFiles === 'boolean') {
			this.settings.library.showHiddenFiles = partial.showHiddenFiles;
		}
		if (typeof partial.maxHistoryItems === 'number') {
			this.settings.historyConfig.maxItems = partial.maxHistoryItems;
			this.settings.history = this.pruneHistoryEntries(this.settings.history);
		}
		if (partial.language) {
			this.settings.ui.language = partial.language;
		}
		if (typeof partial.maxCacheSize === 'number') {
			this.settings.performance.maxCacheSize = partial.maxCacheSize;
		}

		await this.saveSettings();
	}

	async openMangaViewFromFile(file: File, options?: OpenComicOptions): Promise<void> {
		await this.readerModule.openMangaViewFromFile(file, options);
	}

	async openComicFromSource(source: ComicSource, options?: { startPage?: number }): Promise<boolean> {
		const file = await this.sourceService.resolveFile(source);
		if (!file) return false;
		await this.openMangaViewFromFile(file, {
			source,
			startPage: options?.startPage,
		});
		return true;
	}

	async openHistoryEntry(entryKey: string): Promise<boolean> {
		const entry = this.settings.history[entryKey];
		if (!entry?.source) return false;
		return this.openComicFromSource(entry.source, { startPage: entry.page });
	}

	async openBookmark(bookmarkId: string): Promise<boolean> {
		const bookmark = this.settings.bookmarks.find((item) => item.id === bookmarkId);
		if (!bookmark?.source) return false;
		return this.openComicFromSource(bookmark.source, { startPage: bookmark.pageIndex });
	}
}
