import type { Language } from '../types/settings';
import type { Bookmark } from '../types/reader';
import type { ComicSource } from '../types/comic';

export interface PluginModule {
	readonly id: string;
	readonly name: string;
	readonly description: string;
	onload(): Promise<void> | void;
	onunload(): void;
	renderSettings?(containerEl: HTMLElement): void;
}

export interface ReaderSettings {
	thumbnailCount: number;
	sortOrder: 'numeric' | 'alpha';
}

export interface LibrarySettings {
	libraryFolders: string[];
	scanSubfolders: boolean;
	showHiddenFiles: boolean;
}

export interface HistoryConfig {
	maxItems: number;
}

export interface UISettings {
	language: Language;
}

export interface PerformanceSettings {
	maxCacheSize: number;
}

export interface ProgressEntry {
	page: number;
	total: number;
	openedAt: number;
	fileName?: string;
	source?: ComicSource;
}

export type HistoryMap = Record<string, ProgressEntry>;

export interface ComicSettings {
	moduleEnabled: Record<string, boolean>;
	reader: ReaderSettings;
	library: LibrarySettings;
	history: HistoryMap;
	bookmarks: Bookmark[];
	historyConfig: HistoryConfig;
	ui: UISettings;
	performance: PerformanceSettings;
}

export const DEFAULT_SETTINGS: ComicSettings = {
	moduleEnabled: {
		reader: true,
		library: true,
		history: true,
		bookmarks: true,
	},
	reader: {
		thumbnailCount: 9,
		sortOrder: 'numeric',
	},
	library: {
		libraryFolders: ['/'],
		scanSubfolders: true,
		showHiddenFiles: false,
	},
	history: {},
	bookmarks: [],
	historyConfig: {
		maxItems: 20,
	},
	ui: {
		language: 'auto',
	},
	performance: {
		maxCacheSize: 100,
	},
};
