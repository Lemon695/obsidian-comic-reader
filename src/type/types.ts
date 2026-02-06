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
	fileHandle: FileSystemFileHandle; // 直接存储文件句柄
}

// 漫画文件信息接口
export interface MangaFileInfo {
	name: string;           // 文件名
	path: string;           // 文件路径
	size: number;           // 文件大小(字节)
	mtime: number;          // 修改时间戳
}

// 插件设置接口
export interface MangaReaderSettings {
	history: HistoryItem[];
	maxHistoryItems: number; // 最大历史记录数量
	mangaLibraryFolder: string; // 漫画库文件夹路径
}

// 默认设置
export const DEFAULT_SETTINGS: MangaReaderSettings = {
	history: [],
	maxHistoryItems: 50,
	mangaLibraryFolder: '/' // 默认为 vault 根目录
};

export { };
