export interface ReaderSettings {
	thumbnailCount: number;
	sortOrder: 'numeric' | 'alpha';
}

export interface ProgressEntry {
	page: number;      // 0-based 页面索引
	total: number;     // 总页数
	openedAt: number;  // Unix timestamp（毫秒）
}

export type HistoryMap = Record<string, ProgressEntry>;

export interface ComicSettings {
	reader: ReaderSettings;
	history: HistoryMap;
}

export const DEFAULT_SETTINGS: ComicSettings = {
	reader: {
		thumbnailCount: 9,
		sortOrder: 'numeric',
	},
	history: {},
};
