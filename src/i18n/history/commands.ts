import type { I18nDict } from '../locale';

interface HistoryCommandsI18n {
	openHistory: string;
}

export const historyCommandsI18n: I18nDict<HistoryCommandsI18n> = {
	zh: {
		openHistory: '查看阅读历史',
	},
	en: {
		openHistory: 'View Reading History',
	},
};
