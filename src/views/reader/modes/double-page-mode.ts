/**
 * 双页阅读模式
 */

import { BaseReadingMode } from './base-mode';
import type { ReadingMode } from '../../../types';

/**
 * 双页模式 - 每次显示两页（适合传统漫画）
 */
export class DoublePageMode extends BaseReadingMode {
    readonly name: ReadingMode = 'double';
    readonly displayName = '双页模式';
    readonly icon = 'book-open';

    private leftImageEl: HTMLImageElement | null = null;
    private rightImageEl: HTMLImageElement | null = null;
    private imageContainer: HTMLDivElement | null = null;

    protected setupContainer(): void {
        if (!this.container) return;

        this.container.removeClass('single-page-mode');
        this.container.removeClass('webtoon-mode');
        this.container.addClass('double-page-mode');

        // 创建双页容器
        if (!this.imageContainer) {
            this.imageContainer = this.container.createEl('div', {
                cls: 'double-page-container'
            });

            this.leftImageEl = this.imageContainer.createEl('img', {
                cls: 'manga-reader-image double-page-left'
            });

            this.rightImageEl = this.imageContainer.createEl('img', {
                cls: 'manga-reader-image double-page-right'
            });
        }
    }

    render(imageUrl: string, index: number): void {
        // 双页模式需要特殊处理
        // 这里简化实现，只显示当前页
        if (!this.leftImageEl) return;

        this.currentIndex = index;
        this.leftImageEl.src = imageUrl;

        // 如果有下一页，显示在右边
        // 注意：这需要外部传入第二张图片的 URL
        if (this.rightImageEl) {
            this.rightImageEl.src = '';
            this.rightImageEl.style.display = 'none';
        }

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
        super.dispose();
        this.leftImageEl = null;
        this.rightImageEl = null;
        this.imageContainer = null;
    }
}
