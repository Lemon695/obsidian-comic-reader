import type { I18nDict } from '../locale';

interface ReaderModuleI18n {
	name: string;
	description: string;
}

export const readerModuleI18n: I18nDict<ReaderModuleI18n> = {
	zh: {
		name: '阅读器',
		description: '管理漫画文件打开、阅读视图、阅读历史和基础阅读偏好。',
	},
	en: {
		name: 'Reader',
		description: 'Handles comic opening, reading views, reading history, and reader-specific preferences.',
	},
};
