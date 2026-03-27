import { I18nDict } from '../locale';

interface CommandStrings {
	openComic: string;
	ribbonTooltip: string;
	filePickerDesc: string;
}

export const commandsI18n: I18nDict<CommandStrings> = {
	zh: {
		openComic: '打开漫画文件',
		ribbonTooltip: '打开漫画文件',
		filePickerDesc: '漫画文件',
	},
	en: {
		openComic: 'Open Comic File',
		ribbonTooltip: 'Open Comic File',
		filePickerDesc: 'Comic files',
	},
};
