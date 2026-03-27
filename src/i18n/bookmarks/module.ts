import type { I18nDict } from '../locale';

interface BookmarkModuleI18n {
	name: string;
	description: string;
}

export const bookmarkModuleI18n: I18nDict<BookmarkModuleI18n> = {
	zh: {
		name: '书签',
		description: '管理阅读位置书签，并提供后续扩展用的书签视图入口。',
	},
	en: {
		name: 'Bookmarks',
		description: 'Stores reading-position bookmarks and provides an entry point for future bookmark features.',
	},
};
