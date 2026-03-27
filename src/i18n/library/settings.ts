import type { I18nDict } from '../locale';

interface SettingItem {
	name: string;
	desc: string;
}

interface LibrarySettingsI18n {
	libraryFolders: SettingItem;
	scanSubfolders: SettingItem;
	showHiddenFiles: SettingItem;
}

export const librarySettingsI18n: I18nDict<LibrarySettingsI18n> = {
	zh: {
		libraryFolders: {
			name: '漫画库文件夹',
			desc: '扫描漫画文件的 Vault 路径，多个路径用逗号分隔。',
		},
		scanSubfolders: {
			name: '扫描子文件夹',
			desc: '递归扫描子文件夹中的漫画文件。',
		},
		showHiddenFiles: {
			name: '显示隐藏文件',
			desc: '为后续隐藏文件支持保留设置位。',
		},
	},
	en: {
		libraryFolders: {
			name: 'Library Folders',
			desc: 'Vault paths to scan for comics. Separate multiple paths with commas.',
		},
		scanSubfolders: {
			name: 'Scan Subfolders',
			desc: 'Recursively scan comic files in nested folders.',
		},
		showHiddenFiles: {
			name: 'Show Hidden Files',
			desc: 'Reserved for future hidden-file support in the library scanner.',
		},
	},
};
