/**
 * 存储服务 - 处理数据持久化
 */

import { Plugin } from 'obsidian';
import type { Settings, HistoryItem, Bookmark, ReadingProgress } from '../types';
import { DEFAULT_SETTINGS } from '../types';

/** 存储数据结构 */
interface StorageData {
    settings: Partial<Settings>;
    history: HistoryItem[];
    bookmarks: Bookmark[];
    progress: Record<string, ReadingProgress>;
    version: number;
}

/** 当前存储版本 */
const STORAGE_VERSION = 1;

/**
 * 存储服务类
 */
export class StorageService {
    private plugin: Plugin;
    private cache: StorageData | null = null;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    /**
     * 加载所有数据
     */
    async loadAll(): Promise<StorageData> {
        if (this.cache) {
            return this.cache;
        }

        try {
            const data = await this.plugin.loadData();
            this.cache = this.migrateData(data);
            return this.cache;
        } catch (error) {
            console.error('[StorageService] Error loading data:', error);
            return this.getDefaultData();
        }
    }

    /**
     * 保存所有数据
     */
    async saveAll(data: Partial<StorageData>): Promise<void> {
        try {
            const current = await this.loadAll();
            const merged: StorageData = {
                ...current,
                ...data,
                version: STORAGE_VERSION
            };
            this.cache = merged;
            await this.plugin.saveData(merged);
        } catch (error) {
            console.error('[StorageService] Error saving data:', error);
        }
    }

    /**
     * 加载设置
     */
    async loadSettings(): Promise<Settings> {
        const data = await this.loadAll();
        return { ...DEFAULT_SETTINGS, ...data.settings };
    }

    /**
     * 保存设置
     */
    async saveSettings(settings: Partial<Settings>): Promise<void> {
        const data = await this.loadAll();
        data.settings = { ...data.settings, ...settings };
        await this.saveAll(data);
    }

    /**
     * 加载历史记录
     */
    async loadHistory(): Promise<HistoryItem[]> {
        const data = await this.loadAll();
        // 过滤掉无效的历史记录项（fileHandle 无法序列化）
        return data.history.map(item => ({
            ...item,
            fileHandle: undefined // fileHandle 无法持久化
        }));
    }

    /**
     * 保存历史记录
     */
    async saveHistory(history: HistoryItem[]): Promise<void> {
        const data = await this.loadAll();
        // 保存时移除 fileHandle（无法序列化）
        data.history = history.map(item => ({
            ...item,
            fileHandle: undefined
        }));
        await this.saveAll(data);
    }

    /**
     * 加载书签
     */
    async loadBookmarks(): Promise<Bookmark[]> {
        const data = await this.loadAll();
        return data.bookmarks;
    }

    /**
     * 保存书签
     */
    async saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
        const data = await this.loadAll();
        data.bookmarks = bookmarks;
        await this.saveAll(data);
    }

    /**
     * 加载阅读进度
     */
    async loadProgress(): Promise<Map<string, ReadingProgress>> {
        const data = await this.loadAll();
        return new Map(Object.entries(data.progress));
    }

    /**
     * 保存阅读进度
     */
    async saveProgress(progressMap: Map<string, ReadingProgress>): Promise<void> {
        const data = await this.loadAll();
        data.progress = Object.fromEntries(progressMap);
        await this.saveAll(data);
    }

    /**
     * 更新单个漫画的阅读进度
     */
    async updateProgress(comicPath: string, progress: ReadingProgress): Promise<void> {
        const data = await this.loadAll();
        data.progress[comicPath] = progress;
        await this.saveAll(data);
    }

    /**
     * 获取单个漫画的阅读进度
     */
    async getProgress(comicPath: string): Promise<ReadingProgress | null> {
        const data = await this.loadAll();
        return data.progress[comicPath] ?? null;
    }

    /**
     * 清除所有数据
     */
    async clearAll(): Promise<void> {
        this.cache = this.getDefaultData();
        await this.plugin.saveData(this.cache);
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.cache = null;
    }

    /**
     * 获取默认数据
     */
    private getDefaultData(): StorageData {
        return {
            settings: {},
            history: [],
            bookmarks: [],
            progress: {},
            version: STORAGE_VERSION
        };
    }

    /**
     * 数据迁移（处理版本升级）
     */
    private migrateData(data: unknown): StorageData {
        if (!data || typeof data !== 'object') {
            return this.getDefaultData();
        }

        const rawData = data as Record<string, unknown>;

        // 处理旧版本数据格式
        if (!rawData.version) {
            // 旧版本数据迁移
            return {
                settings: {
                    maxHistoryItems: (rawData.maxHistoryItems as number) ?? DEFAULT_SETTINGS.maxHistoryItems,
                    libraryFolders: rawData.mangaLibraryFolder
                        ? [rawData.mangaLibraryFolder as string]
                        : DEFAULT_SETTINGS.libraryFolders
                },
                history: this.migrateHistory(rawData.history as unknown[]),
                bookmarks: [],
                progress: {},
                version: STORAGE_VERSION
            };
        }

        // 当前版本数据
        return {
            settings: (rawData.settings as Partial<Settings>) ?? {},
            history: (rawData.history as HistoryItem[]) ?? [],
            bookmarks: (rawData.bookmarks as Bookmark[]) ?? [],
            progress: (rawData.progress as Record<string, ReadingProgress>) ?? {},
            version: STORAGE_VERSION
        };
    }

    /**
     * 迁移旧版本历史记录
     */
    private migrateHistory(oldHistory: unknown[]): HistoryItem[] {
        if (!Array.isArray(oldHistory)) {
            return [];
        }

        return oldHistory.map((item, index) => {
            const oldItem = item as Record<string, unknown>;
            return {
                id: `migrated_${index}_${Date.now()}`,
                path: (oldItem.path as string) ?? '',
                fileName: (oldItem.fileName as string) ?? '',
                lastOpened: (oldItem.lastOpened as number) ?? Date.now(),
                sourceType: 'external' as const
            };
        });
    }
}
