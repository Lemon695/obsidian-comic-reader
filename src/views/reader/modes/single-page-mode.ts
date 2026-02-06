/**
 * 单页阅读模式
 */

import { BaseReadingMode } from './base-mode';
import type { ReadingMode } from '../../../types';

/**
 * 单页模式 - 每次显示一页
 */
export class SinglePageMode extends BaseReadingMode {
    readonly name: ReadingMode = 'single';
    readonly displayName = '单页模式';
    readonly icon = 'file';

    protected setupContainer(): void {
        if (!this.container) return;

        this.container.removeClass('webtoon-mode');
        this.container.removeClass('double-page-mode');
        this.container.addClass('single-page-mode');

        // 创建图片元素
        if (!this.imageEl) {
            this.imageEl = this.container.createEl('img', {
                cls: 'manga-reader-image'
            });
        }
    }

    render(imageUrl: string, index: number): void {
        if (!this.imageEl) return;

        this.currentIndex = index;
        this.imageEl.src = imageUrl;

        // 图片加载完成后滚动到顶部
        this.imageEl.onload = () => {
            this.scrollToTop();
        };
    }

    /**
     * 获取图片元素
     */
    getImageElement(): HTMLImageElement | null {
        return this.imageEl;
    }
}
