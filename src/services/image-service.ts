/**
 * 图片服务 - 处理图片加载、缓存和预加载
 */

import { EventBus, getEventBus } from '../core/event-bus';
import type { BaseComicParser } from './comic-parser/base-parser';

/** 缓存项 */
interface CacheItem {
    url: string;
    blob: Blob;
    timestamp: number;
}

/**
 * 图片服务类
 */
export class ImageService {
    private eventBus: EventBus;
    private parser: BaseComicParser | null = null;
    private cache: Map<number, CacheItem> = new Map();
    private preloadQueue: Set<number> = new Set();
    private maxCacheSize: number;
    private isPreloading = false;

    constructor(eventBus?: EventBus, maxCacheSize = 100) {
        this.eventBus = eventBus ?? getEventBus();
        this.maxCacheSize = maxCacheSize; // MB
    }

    /**
     * 设置当前解析器
     */
    setParser(parser: BaseComicParser | null): void {
        // 清理旧缓存
        this.clearCache();
        this.parser = parser;
    }

    /**
     * 加载指定页面的图片
     *
     * @param index - 页面索引
     * @returns 图片 Blob URL
     */
    async loadImage(index: number): Promise<string> {
        if (!this.parser) {
            throw new Error('No parser set');
        }

        // 检查缓存
        const cached = this.cache.get(index);
        if (cached) {
            return cached.url;
        }

        this.eventBus.emit('image:loading', { index });

        try {
            const blob = await this.parser.getPage(index);
            const url = URL.createObjectURL(blob);

            // 添加到缓存
            this.addToCache(index, url, blob);

            this.eventBus.emit('image:loaded', { index, url });

            return url;
        } catch (error) {
            this.eventBus.emit('image:error', { index, error: error as Error });
            throw error;
        }
    }

    /**
     * 预加载指定页面
     *
     * @param indices - 要预加载的页面索引列表
     */
    async preloadImages(indices: number[]): Promise<void> {
        if (!this.parser || this.isPreloading) return;

        // 过滤已缓存的页面
        const toPreload = indices.filter(i => !this.cache.has(i));
        if (toPreload.length === 0) return;

        this.isPreloading = true;

        try {
            // 并行预加载，但限制并发数
            const batchSize = 3;
            for (let i = 0; i < toPreload.length; i += batchSize) {
                const batch = toPreload.slice(i, i + batchSize);
                await Promise.all(
                    batch.map(async (index) => {
                        try {
                            await this.loadImage(index);
                        } catch (error) {
                            // 预加载失败不抛出错误
                            console.warn(`[ImageService] Preload failed for page ${index}:`, error);
                        }
                    })
                );
            }

            this.eventBus.emit('image:preloaded', { indices: toPreload });
        } finally {
            this.isPreloading = false;
        }
    }

    /**
     * 预加载当前页面周围的页面
     *
     * @param currentIndex - 当前页面索引
     * @param range - 预加载范围（前后各多少页）
     */
    async preloadAround(currentIndex: number, range = 3): Promise<void> {
        if (!this.parser) return;

        const pageCount = this.parser.getPageCount();
        const indices: number[] = [];

        // 优先预加载后面的页面
        for (let i = 1; i <= range; i++) {
            const nextIndex = currentIndex + i;
            if (nextIndex < pageCount) {
                indices.push(nextIndex);
            }
        }

        // 然后预加载前面的页面
        for (let i = 1; i <= range; i++) {
            const prevIndex = currentIndex - i;
            if (prevIndex >= 0) {
                indices.push(prevIndex);
            }
        }

        await this.preloadImages(indices);
    }

    /**
     * 获取缩略图
     *
     * @param index - 页面索引
     * @param size - 缩略图大小
     * @returns 缩略图 Blob URL
     */
    async getThumbnail(index: number, size = 80): Promise<string> {
        if (!this.parser) {
            throw new Error('No parser set');
        }

        // 缩略图使用单独的缓存键
        const cacheKey = index + 100000; // 偏移以区分原图

        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached.url;
        }

        const blob = await this.parser.getThumbnail(index, size);
        const url = URL.createObjectURL(blob);

        // 缩略图也加入缓存
        this.addToCache(cacheKey, url, blob);

        return url;
    }

    /**
     * 复制图片到剪贴板
     *
     * @param index - 页面索引
     */
    async copyToClipboard(index: number): Promise<void> {
        if (!this.parser) {
            throw new Error('No parser set');
        }

        const blob = await this.parser.getPage(index);

        // 创建 canvas 转换为 PNG
        const img = new Image();
        const loadPromise = new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });

        await loadPromise;

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to create canvas context');
        }

        ctx.drawImage(img, 0, 0);

        // 转换为 PNG Blob
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create PNG blob'));
                }
            }, 'image/png');
        });

        // 写入剪贴板
        const clipboardItem = new ClipboardItem({
            'image/png': pngBlob
        });

        await navigator.clipboard.write([clipboardItem]);

        // 清理
        URL.revokeObjectURL(img.src);
    }

    /**
     * 获取当前图片的 Blob
     */
    async getImageBlob(index: number): Promise<Blob> {
        if (!this.parser) {
            throw new Error('No parser set');
        }

        const cached = this.cache.get(index);
        if (cached) {
            return cached.blob;
        }

        return await this.parser.getPage(index);
    }

    /**
     * 添加到缓存
     */
    private addToCache(index: number, url: string, blob: Blob): void {
        // 检查缓存大小
        this.checkCacheSize();

        this.cache.set(index, {
            url,
            blob,
            timestamp: Date.now()
        });
    }

    /**
     * 检查并清理缓存
     */
    private checkCacheSize(): void {
        // 计算当前缓存大小
        let totalSize = 0;
        for (const item of this.cache.values()) {
            totalSize += item.blob.size;
        }

        const maxBytes = this.maxCacheSize * 1024 * 1024;

        // 如果超过限制，删除最旧的项
        if (totalSize > maxBytes) {
            const entries = Array.from(this.cache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);

            while (totalSize > maxBytes * 0.8 && entries.length > 0) {
                const oldestEntry = entries.shift();
                if (!oldestEntry) break;
                const [key, item] = oldestEntry;
                URL.revokeObjectURL(item.url);
                this.cache.delete(key);
                totalSize -= item.blob.size;
            }
        }
    }

    /**
     * 清理缓存
     */
    clearCache(): void {
        for (const item of this.cache.values()) {
            URL.revokeObjectURL(item.url);
        }
        this.cache.clear();
        this.preloadQueue.clear();
    }

    /**
     * 释放资源
     */
    dispose(): void {
        this.clearCache();
        this.parser = null;
    }

    /**
     * 获取缓存统计信息
     */
    getCacheStats(): { count: number; sizeBytes: number } {
        let sizeBytes = 0;
        for (const item of this.cache.values()) {
            sizeBytes += item.blob.size;
        }
        return {
            count: this.cache.size,
            sizeBytes
        };
    }
}
