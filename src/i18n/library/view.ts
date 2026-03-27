import type { I18nDict } from '../locale';

interface LibraryViewI18n {
	displayText: string;
	searchPlaceholder: string;
	refresh: string;
	headers: {
		name: string;
		size: string;
		mtime: string;
		lastRead: string;
	};
	noFiles: string;
	noResults: string;
	unread: string;
	fileMissing: string;
}

export const libraryViewI18n: I18nDict<LibraryViewI18n> = {
	zh: {
		displayText: '漫画库',
		searchPlaceholder: '搜索漫画...',
		refresh: '刷新',
		headers: {
			name: '文件名',
			size: '大小',
			mtime: '最近添加',
			lastRead: '最近阅读',
		},
		noFiles: '未找到漫画文件',
		noResults: '没有匹配的结果',
		unread: '未阅读',
		fileMissing: '文件不存在',
	},
	en: {
		displayText: 'Comic Library',
		searchPlaceholder: 'Search comics...',
		refresh: 'Refresh',
		headers: {
			name: 'Filename',
			size: 'Size',
			mtime: 'Recently Added',
			lastRead: 'Last Read',
		},
		noFiles: 'No comic files found',
		noResults: 'No matching results',
		unread: 'Unread',
		fileMissing: 'File not found',
	},
};
