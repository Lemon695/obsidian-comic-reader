/**
 * 阅读模式基类
 */

import type { ReadingMode } from '../../../types';

/**
 * 阅读模式抽象基类
 */
export abstract class BaseReadingMode {
    /** 模式名称 */
    abstract readonly name: ReadingMode;

    /** 显示名称 */
    abstract readonly displayName: string;

    /** 图标名称 */
    abstract readonly icon: string;

    /** 容器元素 */
    protected container: HTMLElement | null = null;

    /** 图片元素 */
    protected imageEl: HTMLImageElement | null = null;

    /** 当前页码 */
    protected currentIndex: number = 0;

    /** 总页数 */
    protected totalPages: number = 0;

    /**
     * 初始化模式
     */
    initialize(container: HTMLElement): void {
        this.container = container;
        this.setupContainer();
    }

    /**
     * 设置容器样式
     */
    protected abstract setupContainer(): void;

    /**
     * 渲染图片
     *
     * @param imageUrl - 图片 URL
     * @param index - 页面索引
     */
    abstract render(imageUrl: string, index: number): void;

    /**
     * 跳转到指定页面
     */
    goToPage(index: number): void {
        this.currentIndex = index;
    }

    /**
     * 下一页
     */
    nextPage(): number {
        if (this.currentIndex < this.totalPages - 1) {
            this.currentIndex++;
        }
        return this.currentIndex;
    }

    /**
     * 上一页
     */
    previousPage(): number {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
        return this.currentIndex;
    }

    /**
     * 设置总页数
     */
    setTotalPages(total: number): void {
        this.totalPages = total;
    }

    /**
     * 获取当前页码
     */
    getCurrentIndex(): number {
        return this.currentIndex;
    }

    /**
     * 滚动到顶部
     */
    scrollToTop(): void {
        if (this.container) {
            this.container.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * 清理资源
     */
    dispose(): void {
        this.container = null;
        this.imageEl = null;
    }
}
