import type { I18nDict } from '../locale';

interface SettingItem {
	name: string;
	desc: string;
}

interface ButtonItem extends SettingItem {
	button: string;
}

interface HistorySettingsI18n {
	historyLimit: SettingItem;
	clearHistory: ButtonItem;
}

export const historySettingsI18n: I18nDict<HistorySettingsI18n> = {
	zh: {
		historyLimit: {
			name: '最大历史记录数',
			desc: '保留最近打开的漫画记录数量。',
		},
		clearHistory: {
			name: '清除历史记录',
			desc: '删除所有阅读历史记录。',
			button: '清除',
		},
	},
	en: {
		historyLimit: {
			name: 'History Limit',
			desc: 'Number of recently opened comics to retain.',
		},
		clearHistory: {
			name: 'Clear History',
			desc: 'Delete all reading history entries.',
			button: 'Clear',
		},
	},
};
