/**
 * 双页阅读模式
 */

import { BaseReadingMode } from './base-mode';
import type { ReadingMode } from '../../../types';

/**
 * 双页模式 - 每次显示两页（适合传统漫画和大屏幕）
 */
export class DoublePageMode extends BaseReadingMode {
    readonly name: ReadingMode = 'double';
    readonly displayName = '双页模式';
    readonly icon = 'book-open';

    private leftImageEl: HTMLImageElement | null = null;
    private rightImageEl: HTMLImageElement | null = null;

    protected setupContainer(): void {
        if (!this.container) return;

        // 添加模式类
        this.container.addClass('double-page-mode');

        // 创建图片容器
        this.imageContainer = this.container.createEl('div', {
            cls: 'mode-image-container double-page-container'
        });

        // 创建左侧图片
        this.leftImageEl = this.imageContainer.createEl('img', {
            cls: 'manga-reader-image double-page-left'
        });

        // 创建右侧图片
        this.rightImageEl = this.imageContainer.createEl('img', {
            cls: 'manga-reader-image double-page-right'
        });
    }

    render(imageUrl: string, index: number): void {
        // 双页模式：当前页显示在左边
        if (!this.leftImageEl || !this.rightImageEl) return;

        this.currentIndex = index;
        this.leftImageEl.src = imageUrl;

        // 右侧暂时隐藏（需要外部传入第二张图片）
        this.rightImageEl.src = '';
        this.rightImageEl.style.display = 'none';

        this.leftImageEl.onload = () => {
            this.scrollToTop();
        };
    }

    /**
     * 渲染双页
     */
    renderDoublePage(leftUrl: string, rightUrl: string | null, index: number): void {
        if (!this.leftImageEl || !this.rightImageEl) return;

        this.currentIndex = index;
        this.leftImageEl.src = leftUrl;

        if (rightUrl) {
            this.rightImageEl.src = rightUrl;
            this.rightImageEl.style.display = 'block';
        } else {
            this.rightImageEl.src = '';
            this.rightImageEl.style.display = 'none';
        }

        this.leftImageEl.onload = () => {
            this.scrollToTop();
        };
    }

    /**
     * 双页模式下，每次翻两页
     */
    nextPage(): number {
        if (this.currentIndex < this.totalPages - 2) {
            this.currentIndex += 2;
        } else if (this.currentIndex < this.totalPages - 1) {
            this.currentIndex = this.totalPages - 1;
        }
        return this.currentIndex;
    }

    /**
     * 双页模式下，每次翻两页
     */
    previousPage(): number {
        if (this.currentIndex >= 2) {
            this.currentIndex -= 2;
        } else {
            this.currentIndex = 0;
        }
        return this.currentIndex;
    }

    /**
     * 获取左侧图片元素
     */
    getLeftImageElement(): HTMLImageElement | null {
        return this.leftImageEl;
    }

    /**
     * 获取右侧图片元素
     */
    getRightImageElement(): HTMLImageElement | null {
        return this.rightImageEl;
    }

    dispose(): void {
        this.leftImageEl = null;
        this.rightImageEl = null;
        super.dispose();
    }
}
