import { I18nDict } from '../locale';

interface CommandStrings {
	openComic: string;
	ribbonTooltip: string;
	filePickerDesc: string;
}

export const commandsI18n: I18nDict<CommandStrings> = {
	zh: {
		openComic: '打开漫画 ZIP',
		ribbonTooltip: '打开漫画 ZIP',
		filePickerDesc: 'ZIP 文件',
	},
	en: {
		openComic: 'Open Comic ZIP',
		ribbonTooltip: 'Open Comic ZIP',
		filePickerDesc: 'ZIP files',
	},
};
