import { getLanguage } from 'obsidian';
import type { Language } from '../types/settings';

export type I18nDict<T> = { zh: T; en: T };

export function resolveLanguage(preferred: Language = 'auto'): 'zh' | 'en' {
	if (preferred === 'zh-CN') return 'zh';
	if (preferred === 'en') return 'en';
	return getLanguage().startsWith('zh') ? 'zh' : 'en';
}

export function t<T>(dict: I18nDict<T>, preferred: Language = 'auto'): T {
	return resolveLanguage(preferred) === 'zh' ? dict.zh : dict.en;
}
