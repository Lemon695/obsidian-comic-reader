import { getLanguage } from 'obsidian';

export type I18nDict<T> = { zh: T; en: T };

export function t<T>(dict: I18nDict<T>): T {
	return getLanguage().startsWith('zh') ? dict.zh : dict.en;
}
