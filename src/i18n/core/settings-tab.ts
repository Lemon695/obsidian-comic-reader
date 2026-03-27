import type { I18nDict } from '../locale';

interface SettingItemI18n {
	name: string;
	desc: string;
}

export interface SettingsTabI18n {
	heading: string;
	intro: string;
	generalHeading: string;
	language: SettingItemI18n;
	languageAuto: string;
	languageZhCn: string;
	languageEn: string;
}

export const settingsTabI18n: I18nDict<SettingsTabI18n> = {
	zh: {
		heading: 'Comic Reader',
		intro: '按模块管理阅读器能力。启用后显示对应模块设置，便于后续继续扩展和拆分。',
		generalHeading: '通用设置',
		language: {
			name: '界面语言',
			desc: '插件界面语言。未指定时跟随 Obsidian 语言。',
		},
		languageAuto: '跟随系统',
		languageZhCn: '简体中文',
		languageEn: 'English',
	},
	en: {
		heading: 'Comic Reader',
		intro: 'Manage plugin capabilities by module. Each enabled module renders its own settings for clearer boundaries and future expansion.',
		generalHeading: 'General',
		language: {
			name: 'Language',
			desc: 'Plugin UI language. Uses the Obsidian language when left on auto.',
		},
		languageAuto: 'Follow system',
		languageZhCn: 'Simplified Chinese',
		languageEn: 'English',
	},
};
