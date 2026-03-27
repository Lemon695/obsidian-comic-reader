/**
 * 历史记录服务 - 管理阅读历史
 */

import type { HistoryItem, Settings } from '../types';
import { createHistoryItem, updateHistoryProgress } from '../types';
import { EventBus, getEventBus } from '../core/event-bus';
import { StorageService } from './storage-service';

/**
 * 历史记录服务类
 */
export class HistoryService {
    private storageService: StorageService;
    private eventBus: EventBus;
    private history: HistoryItem[] = [];
    private maxItems: number;

    constructor(storageService: StorageService, eventBus?: EventBus) {
        this.storageService = storageService;
        this.eventBus = eventBus ?? getEventBus();
        this.maxItems = 50; // 默认值，会在初始化时更新
    }

    /**
     * 初始化服务
     */
    async initialize(settings: Settings): Promise<void> {
        this.maxItems = settings.maxHistoryItems;
        this.history = await this.storageService.loadHistory();
        this.eventBus.emit('history:updated', { history: this.history });
    }

    /**
     * 更新设置
     */
    updateSettings(settings: Partial<Settings>): void {
        if (settings.maxHistoryItems !== undefined) {
            this.maxItems = settings.maxHistoryItems;
            // 如果新的最大数量小于当前历史记录数量，则截断
            if (this.history.length > this.maxItems) {
                this.history = this.history.slice(0, this.maxItems);
                this.save();
            }
        }
    }

    /**
     * 获取所有历史记录
     */
    getHistory(): readonly HistoryItem[] {
        return this.history;
    }

    /**
     * 添加历史记录
     *
     * @param path - 文件路径
     * @param fileName - 文件名
     * @param sourceType - 来源类型
     * @param fileHandle - 文件句柄（仅外部文件）
     */
    async addItem(
        path: string,
        fileName: string,
        sourceType: 'vault' | 'external',
        fileHandle?: FileSystemFileHandle
    ): Promise<HistoryItem> {
        // 检查是否已存在
        const existingIndex = this.history.findIndex(
            item => item.fileName === fileName
        );

        let item: HistoryItem;

        if (existingIndex >= 0) {
            // 更新现有记录
            item = {
                ...this.history[existingIndex],
                lastOpened: Date.now(),
                fileHandle
            };
            // 移除旧记录
            this.history.splice(existingIndex, 1);
        } else {
            // 创建新记录
            item = createHistoryItem(path, fileName, sourceType, fileHandle);
        }

        // 添加到开头
        this.history.unshift(item);

        // 限制数量
        if (this.history.length > this.maxItems) {
            this.history = this.history.slice(0, this.maxItems);
        }

        // 保存并通知
        await this.save();
        this.eventBus.emit('history:item-added', { item });
        this.eventBus.emit('history:updated', { history: this.history });

        return item;
    }

    /**
     * 更新历史记录的阅读进度
     */
    async updateProgress(
        fileName: string,
        lastPage: number,
        totalPages: number
    ): Promise<void> {
        const index = this.history.findIndex(item => item.fileName === fileName);
        if (index < 0) return;

        this.history[index] = updateHistoryProgress(
            this.history[index],
            lastPage,
            totalPages
        );

        await this.save();
        this.eventBus.emit('history:updated', { history: this.history });
    }

    /**
     * 移除历史记录项
     */
    async removeItem(id: string): Promise<void> {
        const index = this.history.findIndex(item => item.id === id);
        if (index < 0) return;

        this.history.splice(index, 1);
        await this.save();
        this.eventBus.emit('history:updated', { history: this.history });
    }

    /**
     * 清除所有历史记录
     */
    async clear(): Promise<void> {
        this.history = [];
        await this.save();
        this.eventBus.emit('history:cleared', undefined as never);
        this.eventBus.emit('history:updated', { history: [] });
    }

    /**
     * 根据文件名查找历史记录
     */
    findByFileName(fileName: string): HistoryItem | undefined {
        return this.history.find(item => item.fileName === fileName);
    }

    /**
     * 根据路径查找历史记录
     */
    findByPath(path: string): HistoryItem | undefined {
        return this.history.find(item => item.path === path);
    }

    /**
     * 获取最近阅读的记录
     */
    getRecent(count = 10): HistoryItem[] {
        return this.history.slice(0, count);
    }

    /**
     * 保存历史记录到存储
     */
    private async save(): Promise<void> {
        await this.storageService.saveHistory(this.history);
    }
}
