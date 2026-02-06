/**
 * 事件总线 - 用于模块间解耦通信
 *
 * 使用发布-订阅模式，允许不同模块之间进行松耦合的通信
 */

import type { ComicInfo, Bookmark, ReadingMode, HistoryItem, Settings } from '../types';

/** 事件类型映射 */
export interface EventMap {
    // 漫画相关事件
    'comic:loaded': { comic: ComicInfo };
    'comic:unloaded': { comicPath: string };
    'comic:page-changed': { index: number; total: number };
    'comic:mode-changed': { mode: ReadingMode };
    'comic:error': { error: Error; context: string };

    // 书签相关事件
    'bookmark:added': { bookmark: Bookmark };
    'bookmark:removed': { bookmarkId: string };
    'bookmark:updated': { bookmark: Bookmark };

    // 历史记录相关事件
    'history:updated': { history: HistoryItem[] };
    'history:item-added': { item: HistoryItem };
    'history:cleared': void;

    // 设置相关事件
    'settings:changed': { settings: Partial<Settings>; key?: string };
    'settings:loaded': { settings: Settings };

    // 视图相关事件
    'view:ready': { viewType: string };
    'view:closed': { viewType: string };

    // 图片相关事件
    'image:loading': { index: number };
    'image:loaded': { index: number; url: string };
    'image:error': { index: number; error: Error };
    'image:preloaded': { indices: number[] };
}

/** 事件回调类型 */
type EventCallback<T> = (data: T) => void;

/** 事件监听器信息 */
interface ListenerInfo<T> {
    callback: EventCallback<T>;
    once: boolean;
}

/**
 * 事件总线类
 *
 * @example
 * ```typescript
 * const eventBus = new EventBus();
 *
 * // 订阅事件
 * eventBus.on('comic:loaded', (data) => {
 *     console.log('Comic loaded:', data.comic.name);
 * });
 *
 * // 发布事件
 * eventBus.emit('comic:loaded', { comic: comicInfo });
 *
 * // 一次性订阅
 * eventBus.once('comic:page-changed', (data) => {
 *     console.log('First page change:', data.index);
 * });
 * ```
 */
export class EventBus {
    private listeners: Map<keyof EventMap, Set<ListenerInfo<unknown>>> = new Map();
    private debugMode: boolean = false;

    /**
     * 启用或禁用调试模式
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    /**
     * 订阅事件
     *
     * @param event - 事件名称
     * @param callback - 回调函数
     * @returns 取消订阅的函数
     */
    on<K extends keyof EventMap>(
        event: K,
        callback: EventCallback<EventMap[K]>
    ): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        const listenerInfo: ListenerInfo<EventMap[K]> = {
            callback,
            once: false
        };

        this.listeners.get(event)!.add(listenerInfo as ListenerInfo<unknown>);

        if (this.debugMode) {
            console.log(`[EventBus] Subscribed to: ${String(event)}`);
        }

        // 返回取消订阅函数
        return () => this.off(event, callback);
    }

    /**
     * 一次性订阅事件（触发后自动取消订阅）
     *
     * @param event - 事件名称
     * @param callback - 回调函数
     * @returns 取消订阅的函数
     */
    once<K extends keyof EventMap>(
        event: K,
        callback: EventCallback<EventMap[K]>
    ): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        const listenerInfo: ListenerInfo<EventMap[K]> = {
            callback,
            once: true
        };

        this.listeners.get(event)!.add(listenerInfo as ListenerInfo<unknown>);

        if (this.debugMode) {
            console.log(`[EventBus] Subscribed once to: ${String(event)}`);
        }

        return () => this.off(event, callback);
    }

    /**
     * 取消订阅事件
     *
     * @param event - 事件名称
     * @param callback - 要取消的回调函数
     */
    off<K extends keyof EventMap>(
        event: K,
        callback: EventCallback<EventMap[K]>
    ): void {
        const listeners = this.listeners.get(event);
        if (!listeners) return;

        for (const listenerInfo of listeners) {
            if (listenerInfo.callback === callback) {
                listeners.delete(listenerInfo);
                break;
            }
        }

        if (this.debugMode) {
            console.log(`[EventBus] Unsubscribed from: ${String(event)}`);
        }
    }

    /**
     * 发布事件
     *
     * @param event - 事件名称
     * @param data - 事件数据
     */
    emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
        const listeners = this.listeners.get(event);
        if (!listeners || listeners.size === 0) {
            if (this.debugMode) {
                console.log(`[EventBus] No listeners for: ${String(event)}`);
            }
            return;
        }

        if (this.debugMode) {
            console.log(`[EventBus] Emitting: ${String(event)}`, data);
        }

        const toRemove: ListenerInfo<unknown>[] = [];

        for (const listenerInfo of listeners) {
            try {
                (listenerInfo.callback as EventCallback<EventMap[K]>)(data);
                if (listenerInfo.once) {
                    toRemove.push(listenerInfo);
                }
            } catch (error) {
                console.error(`[EventBus] Error in listener for ${String(event)}:`, error);
            }
        }

        // 移除一次性监听器
        for (const listener of toRemove) {
            listeners.delete(listener);
        }
    }

    /**
     * 移除指定事件的所有监听器
     *
     * @param event - 事件名称
     */
    removeAllListeners<K extends keyof EventMap>(event?: K): void {
        if (event) {
            this.listeners.delete(event);
            if (this.debugMode) {
                console.log(`[EventBus] Removed all listeners for: ${String(event)}`);
            }
        } else {
            this.listeners.clear();
            if (this.debugMode) {
                console.log('[EventBus] Removed all listeners');
            }
        }
    }

    /**
     * 获取指定事件的监听器数量
     *
     * @param event - 事件名称
     * @returns 监听器数量
     */
    listenerCount<K extends keyof EventMap>(event: K): number {
        return this.listeners.get(event)?.size ?? 0;
    }

    /**
     * 检查是否有指定事件的监听器
     *
     * @param event - 事件名称
     * @returns 是否有监听器
     */
    hasListeners<K extends keyof EventMap>(event: K): boolean {
        return this.listenerCount(event) > 0;
    }

    /**
     * 销毁事件总线，清理所有资源
     */
    destroy(): void {
        this.listeners.clear();
        if (this.debugMode) {
            console.log('[EventBus] Destroyed');
        }
    }
}

/** 全局事件总线实例 */
let globalEventBus: EventBus | null = null;

/**
 * 获取全局事件总线实例
 */
export function getEventBus(): EventBus {
    if (!globalEventBus) {
        globalEventBus = new EventBus();
    }
    return globalEventBus;
}

/**
 * 重置全局事件总线（主要用于测试）
 */
export function resetEventBus(): void {
    if (globalEventBus) {
        globalEventBus.destroy();
        globalEventBus = null;
    }
}
