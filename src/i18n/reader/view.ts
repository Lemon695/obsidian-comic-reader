import type { I18nDict } from '../locale';

interface ReaderViewI18n {
	displayText: string;
}

export const readerViewI18n: I18nDict<ReaderViewI18n> = {
	zh: {
		displayText: '漫画阅读器',
	},
	en: {
		displayText: 'Comic Reader',
	},
};
