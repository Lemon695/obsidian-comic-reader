import type { I18nDict } from '../locale';

interface BookmarkCommandsI18n {
	openBookmarks: string;
}

export const bookmarkCommandsI18n: I18nDict<BookmarkCommandsI18n> = {
	zh: {
		openBookmarks: '查看书签',
	},
	en: {
		openBookmarks: 'View Bookmarks',
	},
};
