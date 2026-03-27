import type { I18nDict } from '../locale';

interface LibraryCommandsI18n {
	openLibrary: string;
	ribbonTooltip: string;
}

export const libraryCommandsI18n: I18nDict<LibraryCommandsI18n> = {
	zh: {
		openLibrary: '打开漫画库',
		ribbonTooltip: '打开漫画库',
	},
	en: {
		openLibrary: 'Open Comic Library',
		ribbonTooltip: 'Open Comic Library',
	},
};
