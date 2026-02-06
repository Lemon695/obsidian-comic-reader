/**
 * 状态管理器 - 集中管理应用状态
 *
 * 使用观察者模式，当状态变化时通知所有订阅者
 */

import type {
    ComicInfo,
    ReaderState,
    Settings,
    HistoryItem,
    Bookmark,
    ReadingProgress
} from '../types';
import { DEFAULT_READER_STATE, DEFAULT_SETTINGS } from '../types';
import { EventBus, getEventBus } from './event-bus';

/** 应用状态 */
export interface AppState {
    /** 阅读器状态 */
    reader: ReaderState;
    /** 插件设置 */
    settings: Settings;
    /** 历史记录 */
    history: HistoryItem[];
    /** 书签列表 */
    bookmarks: Bookmark[];
    /** 阅读进度映射（key: comicPath） */
    progressMap: Map<string, ReadingProgress>;
    /** 是否已初始化 */
    initialized: boolean;
}

/** 默认应用状态 */
const DEFAULT_APP_STATE: AppState = {
    reader: DEFAULT_READER_STATE,
    settings: DEFAULT_SETTINGS,
    history: [],
    bookmarks: [],
    progressMap: new Map(),
    initialized: false
};

/** 状态变化回调 */
type StateChangeCallback<T> = (newValue: T, oldValue: T) => void;

/** 状态选择器 */
type StateSelector<T> = (state: AppState) => T;

/**
 * 状态管理器类
 *
 * @example
 * ```typescript
 * const stateManager = new StateManager();
 *
 * // 获取状态
 * const currentPage = stateManager.getState().reader.currentPage;
 *
 * // 更新状态
 * stateManager.setReaderState({ currentPage: 5 });
 *
 * // 订阅状态变化
 * const unsubscribe = stateManager.subscribe(
 *     (state) => state.reader.currentPage,
 *     (newPage, oldPage) => {
 *         console.log(`Page changed from ${oldPage} to ${newPage}`);
 *     }
 * );
 * ```
 */
export class StateManager {
    private state: AppState;
    private eventBus: EventBus;
    private subscribers: Map<StateSelector<unknown>, Set<StateChangeCallback<unknown>>> = new Map();

    constructor(eventBus?: EventBus) {
        this.state = this.createInitialState();
        this.eventBus = eventBus ?? getEventBus();
    }

    /**
     * 创建初始状态（深拷贝默认状态）
     */
    private createInitialState(): AppState {
        return {
            reader: { ...DEFAULT_READER_STATE },
            settings: { ...DEFAULT_SETTINGS },
            history: [],
            bookmarks: [],
            progressMap: new Map(),
            initialized: false
        };
    }

    /**
     * 获取当前状态（只读）
     */
    getState(): Readonly<AppState> {
        return this.state;
    }

    /**
     * 获取阅读器状态
     */
    getReaderState(): Readonly<ReaderState> {
        return this.state.reader;
    }

    /**
     * 获取设置
     */
    getSettings(): Readonly<Settings> {
        return this.state.settings;
    }

    /**
     * 获取历史记录
     */
    getHistory(): readonly HistoryItem[] {
        return this.state.history;
    }

    /**
     * 获取书签列表
     */
    getBookmarks(): readonly Bookmark[] {
        return this.state.bookmarks;
    }

    /**
     * 更新阅读器状态
     */
    setReaderState(partial: Partial<ReaderState>): void {
        const oldState = { ...this.state.reader };
        this.state.reader = { ...this.state.reader, ...partial };
        this.notifySubscribers((state) => state.reader, this.state.reader, oldState);

        // 发送相关事件
        if (partial.currentPage !== undefined && partial.currentPage !== oldState.currentPage) {
            this.eventBus.emit('comic:page-changed', {
                index: partial.currentPage,
                total: this.state.reader.comic?.pageCount ?? 0
            });
        }

        if (partial.mode !== undefined && partial.mode !== oldState.mode) {
            this.eventBus.emit('comic:mode-changed', { mode: partial.mode });
        }
    }

    /**
     * 设置当前漫画
     */
    setCurrentComic(comic: ComicInfo | null): void {
        const oldComic = this.state.reader.comic;
        this.state.reader = {
            ...this.state.reader,
            comic,
            currentPage: 0,
            isLoading: false
        };

        this.notifySubscribers((state) => state.reader.comic, comic, oldComic);

        if (comic) {
            this.eventBus.emit('comic:loaded', { comic });
        } else if (oldComic) {
            this.eventBus.emit('comic:unloaded', { comicPath: oldComic.path });
        }
    }

    /**
     * 更新设置
     */
    setSettings(partial: Partial<Settings>): void {
        const oldSettings = { ...this.state.settings };
        this.state.settings = { ...this.state.settings, ...partial };
        this.notifySubscribers((state) => state.settings, this.state.settings, oldSettings);

        this.eventBus.emit('settings:changed', { settings: partial });
    }

    /**
     * 加载设置（从存储恢复）
     */
    loadSettings(settings: Partial<Settings>): void {
        this.state.settings = { ...DEFAULT_SETTINGS, ...settings };
        this.eventBus.emit('settings:loaded', { settings: this.state.settings });
    }

    /**
     * 设置历史记录
     */
    setHistory(history: HistoryItem[]): void {
        const oldHistory = this.state.history;
        this.state.history = history;
        this.notifySubscribers((state) => state.history, history, oldHistory);
        this.eventBus.emit('history:updated', { history });
    }

    /**
     * 添加历史记录项
     */
    addHistoryItem(item: HistoryItem): void {
        // 移除重复项
        const filtered = this.state.history.filter(h => h.fileName !== item.fileName);
        // 添加到开头
        const newHistory = [item, ...filtered];
        // 限制数量
        const maxItems = this.state.settings.maxHistoryItems;
        this.state.history = newHistory.slice(0, maxItems);

        this.eventBus.emit('history:item-added', { item });
        this.eventBus.emit('history:updated', { history: this.state.history });
    }

    /**
     * 清除历史记录
     */
    clearHistory(): void {
        this.state.history = [];
        this.eventBus.emit('history:cleared', undefined as never);
        this.eventBus.emit('history:updated', { history: [] });
    }

    /**
     * 设置书签列表
     */
    setBookmarks(bookmarks: Bookmark[]): void {
        const oldBookmarks = this.state.bookmarks;
        this.state.bookmarks = bookmarks;
        this.notifySubscribers((state) => state.bookmarks, bookmarks, oldBookmarks);
    }

    /**
     * 添加书签
     */
    addBookmark(bookmark: Bookmark): void {
        this.state.bookmarks = [...this.state.bookmarks, bookmark];
        this.eventBus.emit('bookmark:added', { bookmark });
    }

    /**
     * 移除书签
     */
    removeBookmark(bookmarkId: string): void {
        this.state.bookmarks = this.state.bookmarks.filter(b => b.id !== bookmarkId);
        this.eventBus.emit('bookmark:removed', { bookmarkId });
    }

    /**
     * 更新阅读进度
     */
    updateProgress(comicPath: string, progress: ReadingProgress): void {
        this.state.progressMap.set(comicPath, progress);
    }

    /**
     * 获取阅读进度
     */
    getProgress(comicPath: string): ReadingProgress | undefined {
        return this.state.progressMap.get(comicPath);
    }

    /**
     * 订阅状态变化
     *
     * @param selector - 状态选择器，用于选择要监听的状态部分
     * @param callback - 状态变化时的回调函数
     * @returns 取消订阅的函数
     */
    subscribe<T>(
        selector: StateSelector<T>,
        callback: StateChangeCallback<T>
    ): () => void {
        if (!this.subscribers.has(selector as StateSelector<unknown>)) {
            this.subscribers.set(selector as StateSelector<unknown>, new Set());
        }

        this.subscribers.get(selector as StateSelector<unknown>)!.add(callback as StateChangeCallback<unknown>);

        return () => {
            const callbacks = this.subscribers.get(selector as StateSelector<unknown>);
            if (callbacks) {
                callbacks.delete(callback as StateChangeCallback<unknown>);
            }
        };
    }

    /**
     * 通知订阅者状态变化
     */
    private notifySubscribers<T>(
        selector: StateSelector<T>,
        newValue: T,
        oldValue: T
    ): void {
        const callbacks = this.subscribers.get(selector as StateSelector<unknown>);
        if (!callbacks) return;

        for (const callback of callbacks) {
            try {
                (callback as StateChangeCallback<T>)(newValue, oldValue);
            } catch (error) {
                console.error('[StateManager] Error in subscriber callback:', error);
            }
        }
    }

    /**
     * 标记为已初始化
     */
    setInitialized(initialized: boolean): void {
        this.state.initialized = initialized;
    }

    /**
     * 检查是否已初始化
     */
    isInitialized(): boolean {
        return this.state.initialized;
    }

    /**
     * 重置状态
     */
    reset(): void {
        this.state = this.createInitialState();
        this.subscribers.clear();
    }

    /**
     * 销毁状态管理器
     */
    destroy(): void {
        this.reset();
    }
}

/** 全局状态管理器实例 */
let globalStateManager: StateManager | null = null;

/**
 * 获取全局状态管理器实例
 */
export function getStateManager(): StateManager {
    if (!globalStateManager) {
        globalStateManager = new StateManager();
    }
    return globalStateManager;
}

/**
 * 重置全局状态管理器（主要用于测试）
 */
export function resetStateManager(): void {
    if (globalStateManager) {
        globalStateManager.destroy();
        globalStateManager = null;
    }
}
