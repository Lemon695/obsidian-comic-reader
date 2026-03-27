import type { I18nDict } from '../locale';

interface HistoryModuleI18n {
	name: string;
	description: string;
}

export const historyModuleI18n: I18nDict<HistoryModuleI18n> = {
	zh: {
		name: '阅读历史',
		description: '管理最近打开记录、历史弹窗和历史清理策略。',
	},
	en: {
		name: 'Reading History',
		description: 'Manages recent entries, the history modal, and history cleanup rules.',
	},
};
