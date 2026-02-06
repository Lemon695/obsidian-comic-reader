/**
 * 韩漫/条漫阅读模式
 *
 * 垂直滚动显示所有图片，像长条一样从上到下连续显示
 * 支持懒加载和虚拟滚动优化
 */

import { BaseReadingMode } from './base-mode';
import type { ReadingMode } from '../../../types';

/** 图片加载状态 */
interface ImageState {
    index: number;
    url: string | null;
    loaded: boolean;
    element: HTMLImageElement | null;
}

/**
 * 韩漫模式 - 长条滚动阅读，垂直显示所有图片
 */
export class WebtoonMode extends BaseReadingMode {
    readonly name: ReadingMode = 'webtoon';
    readonly displayName = '韩漫模式';
    readonly icon = 'scroll';

    /** 所有图片状态 */
    private imageStates: ImageState[] = [];

    /** 图片加载回调 */
    private imageLoader: ((index: number) => Promise<string>) | null = null;

    /** 页码变化回调 */
    private onPageChangeCallback: ((index: number, total: number) => void) | null = null;

    /** 滚动容器 */
    private scrollContainer: HTMLElement | null = null;

    /** 预加载范围（当前可见图片前后各加载多少张） */
    private preloadRange: number = 3;

    /** 滚动监听器 */
    private scrollHandler: (() => void) | null = null;

    /** 防抖定时器 */
    private scrollDebounceTimer: number | null = null;

    /** 上一次的页码索引，用于避免重复触发回调 */
    private lastReportedIndex: number = -1;

    protected setupContainer(): void {
        if (!this.container) return;

        // 添加模式类
        this.container.addClass('webtoon-mode');

        // 创建图片容器（垂直排列）
        this.imageContainer = this.container.createEl('div', {
            cls: 'mode-image-container webtoon-image-container'
        });

        // 保存滚动容器引用
        this.scrollContainer = this.container;

        // 设置滚动监听
        this.setupScrollListener();
    }

    /**
     * 设置滚动监听器
     */
    private setupScrollListener(): void {
        if (!this.scrollContainer) return;

        this.scrollHandler = () => {
            // 防抖处理
            if (this.scrollDebounceTimer) {
                window.clearTimeout(this.scrollDebounceTimer);
            }
            this.scrollDebounceTimer = window.setTimeout(() => {
                this.onScroll();
            }, 100);
        };

        this.scrollContainer.addEventListener('scroll', this.scrollHandler);
    }

    /**
     * 滚动事件处理
     */
    private onScroll(): void {
        if (!this.scrollContainer || !this.imageContainer) return;

        // 找出当前可见的图片索引
        const visibleIndices = this.getVisibleImageIndices();

        if (visibleIndices.length > 0) {
            // 更新当前索引为第一个可见图片
            const newIndex = visibleIndices[0];
            this.currentIndex = newIndex;

            // 如果页码变化了，触发回调
            if (newIndex !== this.lastReportedIndex) {
                this.lastReportedIndex = newIndex;
                if (this.onPageChangeCallback) {
                    this.onPageChangeCallback(newIndex, this.totalPages);
                }
            }

            // 加载可见图片及其周围的图片
            this.loadVisibleImages(visibleIndices);
        }
    }

    /**
     * 获取当前可见的图片索引
     */
    private getVisibleImageIndices(): number[] {
        if (!this.scrollContainer || !this.imageContainer) return [];

        const containerRect = this.scrollContainer.getBoundingClientRect();
        const visibleIndices: number[] = [];

        for (const state of this.imageStates) {
            if (state.element) {
                const rect = state.element.getBoundingClientRect();
                // 检查图片是否在可视区域内
                if (rect.bottom > containerRect.top && rect.top < containerRect.bottom) {
                    visibleIndices.push(state.index);
                }
            }
        }

        return visibleIndices;
    }

    /**
     * 加载可见图片及其周围的图片
     */
    private async loadVisibleImages(visibleIndices: number[]): Promise<void> {
        if (visibleIndices.length === 0 || !this.imageLoader) return;

        // 计算需要加载的范围
        const minIndex = Math.max(0, Math.min(...visibleIndices) - this.preloadRange);
        const maxIndex = Math.min(this.totalPages - 1, Math.max(...visibleIndices) + this.preloadRange);

        // 加载范围内的所有图片
        for (let i = minIndex; i <= maxIndex; i++) {
            await this.loadImage(i);
        }
    }

    /**
     * 加载单张图片
     */
    private async loadImage(index: number): Promise<void> {
        if (index < 0 || index >= this.imageStates.length) return;

        const state = this.imageStates[index];
        if (state.loaded || !state.element || !this.imageLoader) return;

        try {
            const url = await this.imageLoader(index);
            state.url = url;
            state.element.src = url;
            state.loaded = true;
        } catch (error) {
            console.error(`[WebtoonMode] Failed to load image ${index}:`, error);
        }
    }

    /**
     * 设置图片加载器
     */
    setImageLoader(loader: (index: number) => Promise<string>): void {
        this.imageLoader = loader;
    }

    /**
     * 设置页码变化回调
     */
    onPageChange(callback: (index: number, total: number) => void): void {
        this.onPageChangeCallback = callback;
    }

    /**
     * 初始化所有图片占位符
     */
    initializeImages(totalPages: number): void {
        if (!this.imageContainer) return;

        // 清空现有内容
        this.imageContainer.empty();
        this.imageStates = [];
        this.totalPages = totalPages;

        // 创建所有图片的占位符
        for (let i = 0; i < totalPages; i++) {
            const wrapper = this.imageContainer.createEl('div', {
                cls: 'webtoon-image-wrapper'
            });

            // 添加页码标签
            wrapper.createEl('div', {
                cls: 'webtoon-page-label',
                text: `${i + 1} / ${totalPages}`
            });

            const img = wrapper.createEl('img', {
                cls: 'manga-reader-image webtoon-image',
                attr: {
                    'data-index': String(i),
                    'alt': `Page ${i + 1}`
                }
            });

            // 设置占位符样式
            img.style.minHeight = '200px';
            img.style.backgroundColor = 'var(--background-secondary)';

            this.imageStates.push({
                index: i,
                url: null,
                loaded: false,
                element: img
            });
        }
    }

    /**
     * 渲染 - 韩漫模式下这个方法用于初始化并跳转到指定页
     */
    render(imageUrl: string, index: number): void {
        // 如果还没有初始化图片，先初始化
        if (this.imageStates.length === 0 && this.totalPages > 0) {
            this.initializeImages(this.totalPages);
        }

        this.currentIndex = index;

        // 加载当前页及周围的图片
        this.loadImagesAround(index);

        // 滚动到指定页
        this.scrollToImage(index);
    }

    /**
     * 加载指定索引周围的图片
     */
    async loadImagesAround(index: number): Promise<void> {
        const minIndex = Math.max(0, index - this.preloadRange);
        const maxIndex = Math.min(this.totalPages - 1, index + this.preloadRange);

        for (let i = minIndex; i <= maxIndex; i++) {
            await this.loadImage(i);
        }
    }

    /**
     * 滚动到指定图片
     */
    scrollToImage(index: number): void {
        if (index < 0 || index >= this.imageStates.length) return;

        const state = this.imageStates[index];
        if (state.element) {
            state.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * 下一页 - 韩漫模式下滚动到下一张图片
     */
    nextPage(): number {
        if (this.currentIndex < this.totalPages - 1) {
            this.currentIndex++;
            this.scrollToImage(this.currentIndex);
        }
        return this.currentIndex;
    }

    /**
     * 上一页 - 韩漫模式下滚动到上一张图片
     */
    previousPage(): number {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.scrollToImage(this.currentIndex);
        }
        return this.currentIndex;
    }

    /**
     * 获取当前页索引
     */
    getCurrentIndex(): number {
        return this.currentIndex;
    }

    /**
     * 获取图片元素（兼容旧接口）
     */
    getImageElement(): HTMLImageElement | null {
        if (this.currentIndex >= 0 && this.currentIndex < this.imageStates.length) {
            return this.imageStates[this.currentIndex].element;
        }
        return null;
    }

    dispose(): void {
        // 移除滚动监听
        if (this.scrollContainer && this.scrollHandler) {
            this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
        }

        // 清除防抖定时器
        if (this.scrollDebounceTimer) {
            window.clearTimeout(this.scrollDebounceTimer);
        }

        // 清理图片状态
        this.imageStates = [];
        this.imageLoader = null;
        this.onPageChangeCallback = null;
        this.scrollContainer = null;
        this.scrollHandler = null;
        this.lastReportedIndex = -1;

        super.dispose();
    }
}
