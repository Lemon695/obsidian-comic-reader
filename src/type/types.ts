declare global {
	interface Window {
		showOpenFilePicker(options?: {
			types?: {
				description: string;
				accept: Record<string, string[]>;
			}[];
			excludeAcceptAllOption?: boolean;
			multiple?: boolean;
		}): Promise<FileSystemFileHandle[]>;
	}
}

// 历史记录项的接口定义
export interface HistoryItem {
	path: string;           // 文件路径
	fileName: string;       // 文件名
	lastOpened: number;     // 最后打开时间戳
	fileSystemHandle?: {
		kind: string;
		name: string;
	};
}

// 插件设置接口
export interface MangaReaderSettings {
	history: HistoryItem[];
	maxHistoryItems: number; // 最大历史记录数量
}

// 默认设置
export const DEFAULT_SETTINGS: MangaReaderSettings = {
	history: [],
	maxHistoryItems: 50 // 默认保存50条历史记录
};

export {};

