import { I18nDict } from '../locale';

interface SettingItem {
	name: string;
	desc: string;
}

interface SettingsStrings {
	sectionTitle: string;
	thumbnailCount: SettingItem;
	sortOrder: SettingItem;
	sortNumeric: string;
	sortAlpha: string;
}

export const settingsI18n: I18nDict<SettingsStrings> = {
	zh: {
		sectionTitle: '漫画阅读器',
		thumbnailCount: {
			name: '缩略图数量',
			desc: '底部缩略图栏显示的图片数量（默认 9）',
		},
		sortOrder: {
			name: '排序方式',
			desc: '图片文件名排序方式',
		},
		sortNumeric: '数字顺序',
		sortAlpha: '字母顺序',
	},
	en: {
		sectionTitle: 'Comic Reader',
		thumbnailCount: {
			name: 'Thumbnail Count',
			desc: 'Number of thumbnails shown in the bottom bar (default 9)',
		},
		sortOrder: {
			name: 'Sort Order',
			desc: 'How to sort image filenames',
		},
		sortNumeric: 'Numeric',
		sortAlpha: 'Alphabetical',
	},
};
