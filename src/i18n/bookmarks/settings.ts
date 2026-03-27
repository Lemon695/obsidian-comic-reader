import type { I18nDict } from '../locale';

interface SettingItem {
	name: string;
	desc: string;
}

interface ButtonItem extends SettingItem {
	button: string;
}

interface BookmarkSettingsI18n {
	total: SettingItem;
	clearBookmarks: ButtonItem;
}

export const bookmarkSettingsI18n: I18nDict<BookmarkSettingsI18n> = {
	zh: {
		total: {
			name: '当前书签数',
			desc: '当前已保存 {count} 个书签。',
		},
		clearBookmarks: {
			name: '清除全部书签',
			desc: '删除所有已保存的书签。',
			button: '清除',
		},
	},
	en: {
		total: {
			name: 'Bookmark Count',
			desc: '{count} bookmarks are currently saved.',
		},
		clearBookmarks: {
			name: 'Clear All Bookmarks',
			desc: 'Delete all saved bookmarks.',
			button: 'Clear',
		},
	},
};
