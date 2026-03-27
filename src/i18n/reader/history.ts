import { I18nDict } from '../locale';

interface HistoryStrings {
	commandName: string;
	modalTitle: string;
	empty: string;
	copyFileName: string;
	deleteEntry: string;
	percentLabel: string;
	openedAtLabel: string;
	fileNameCopied: string;
}

export const historyI18n: I18nDict<HistoryStrings> = {
	zh: {
		commandName: '查看阅读历史',
		modalTitle: '阅读历史',
		empty: '暂无阅读记录',
		copyFileName: '复制文件名',
		deleteEntry: '删除',
		percentLabel: '进度 {percent}%',
		openedAtLabel: '上次打开',
		fileNameCopied: '文件名已复制',
	},
	en: {
		commandName: 'View Reading History',
		modalTitle: 'Reading History',
		empty: 'No reading history yet',
		copyFileName: 'Copy filename',
		deleteEntry: 'Delete',
		percentLabel: '{percent}% read',
		openedAtLabel: 'Last opened',
		fileNameCopied: 'Filename copied',
	},
};
