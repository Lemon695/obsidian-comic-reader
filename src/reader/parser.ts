import JSZip from 'jszip';
import { HistoryMap, ProgressEntry } from '../core/types';
import type { ComicSource } from '../types/comic';

export function isImageFile(filename: string): boolean {
	return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
}

export function sortNumeric(filenames: string[]): string[] {
	return [...filenames].sort((a, b) => {
		const numA = parseInt(a.match(/\d+/)?.[0] ?? '0');
		const numB = parseInt(b.match(/\d+/)?.[0] ?? '0');
		return numA - numB;
	});
}

export function sortAlpha(filenames: string[]): string[] {
	return [...filenames].sort((a, b) => a.localeCompare(b));
}

export function extractImages(zip: JSZip, order: 'numeric' | 'alpha' = 'numeric'): string[] {
	const raw = Object.entries(zip.files)
		.filter(([name, file]) => isImageFile(name) && !file.dir)
		.map(([name]) => name);
	return order === 'numeric' ? sortNumeric(raw) : sortAlpha(raw);
}

export function getThumbnailRange(current: number, total: number, count: number): number[] {
	const half = Math.floor(count / 2);
	let start = Math.max(0, current - half);
	const end = Math.min(total - 1, start + count - 1);
	start = Math.max(0, end - count + 1);
	const result: number[] = [];
	for (let i = start; i <= end; i++) result.push(i);
	return result;
}

// ── 阅读历史 ────────────────────────────────────────────

export const HISTORY_MAX = 20;

export interface HistoryEntry {
	key: string;
	fileName: string;
	page: number;
	total: number;
	openedAt: number;
	percent: number;  // 0–100，四舍五入
	source?: ComicSource;
}

/** 从 HistoryMap 提取最近 HISTORY_MAX 条，按 openedAt 降序 */
export function getRecentHistory(history: HistoryMap, limit: number = HISTORY_MAX): HistoryEntry[] {
	return Object.entries(history)
		.map(([key, entry]: [string, ProgressEntry]) => ({
			key,
			fileName: entry.fileName ?? key,
			page: entry.page,
			total: entry.total,
			openedAt: entry.openedAt,
			percent: entry.total > 0 ? Math.round(((entry.page + 1) / entry.total) * 100) : 0,
			source: entry.source,
		}))
		.sort((a, b) => b.openedAt - a.openedAt)
		.slice(0, limit);
}

/** 裁剪超出限额的旧条目，返回更新后的 HistoryMap */
export function pruneHistory(history: HistoryMap, limit: number = HISTORY_MAX): HistoryMap {
	const entries = Object.entries(history) as [string, ProgressEntry][];
	if (entries.length <= limit) return history;
	const kept = entries
		.sort(([, a], [, b]) => b.openedAt - a.openedAt)
		.slice(0, limit);
	return Object.fromEntries(kept);
}
