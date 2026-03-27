import { I18nDict } from '../locale';

interface ContextMenuStrings {
	copyImage: string;
	addBookmark: string;
}

export const contextMenuI18n: I18nDict<ContextMenuStrings> = {
	zh: {
		copyImage: '复制图片',
		addBookmark: '添加书签',
	},
	en: {
		copyImage: 'Copy Image',
		addBookmark: 'Add Bookmark',
	},
};
