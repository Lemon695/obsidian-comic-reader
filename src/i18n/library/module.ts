import type { I18nDict } from '../locale';

interface LibraryModuleI18n {
	name: string;
	description: string;
}

export const libraryModuleI18n: I18nDict<LibraryModuleI18n> = {
	zh: {
		name: '漫画库',
		description: '扫描 Vault 中的漫画文件，并提供可排序、可搜索的库视图。',
	},
	en: {
		name: 'Library',
		description: 'Scans comic files in the vault and provides a searchable, sortable library view.',
	},
};
