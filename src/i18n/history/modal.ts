import type { I18nDict } from '../locale';

interface HistoryModalI18n {
	modalTitle: string;
	empty: string;
	openEntry: string;
	copyFileName: string;
	deleteEntry: string;
	percentLabel: string;
	openedAtLabel: string;
	fileNameCopied: string;
}

export const historyModalI18n: I18nDict<HistoryModalI18n> = {
	zh: {
		modalTitle: '阅读历史',
		empty: '暂无阅读记录',
		openEntry: '打开',
		copyFileName: '复制文件名',
		deleteEntry: '删除',
		percentLabel: '进度 {percent}%',
		openedAtLabel: '上次打开',
		fileNameCopied: '文件名已复制',
	},
	en: {
		modalTitle: 'Reading History',
		empty: 'No reading history yet',
		openEntry: 'Open',
		copyFileName: 'Copy filename',
		deleteEntry: 'Delete',
		percentLabel: '{percent}% read',
		openedAtLabel: 'Last opened',
		fileNameCopied: 'Filename copied',
	},
};
