import type { I18nDict } from '../locale';

interface BookmarkModalI18n {
	modalTitle: string;
	empty: string;
	pageLabel: string;
	createdAtLabel: string;
	openEntry: string;
	copyFileName: string;
	deleteEntry: string;
	fileNameCopied: string;
}

export const bookmarkModalI18n: I18nDict<BookmarkModalI18n> = {
	zh: {
		modalTitle: '书签列表',
		empty: '暂无书签',
		pageLabel: '第 {page} 页',
		createdAtLabel: '创建于',
		openEntry: '打开',
		copyFileName: '复制文件名',
		deleteEntry: '删除',
		fileNameCopied: '文件名已复制',
	},
	en: {
		modalTitle: 'Bookmarks',
		empty: 'No bookmarks yet',
		pageLabel: 'Page {page}',
		createdAtLabel: 'Created',
		openEntry: 'Open',
		copyFileName: 'Copy filename',
		deleteEntry: 'Delete',
		fileNameCopied: 'Filename copied',
	},
};
