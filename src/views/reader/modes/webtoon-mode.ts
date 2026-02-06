/**
 * 韩漫/条漫阅读模式
 */

import { BaseReadingMode } from './base-mode';
import type { ReadingMode } from '../../../types';

/**
 * 韩漫模式 - 长条滚动阅读
 */
export class WebtoonMode extends BaseReadingMode {
    readonly name: ReadingMode = 'webtoon';
    readonly displayName = '韩漫模式';
    readonly icon = 'scroll';

    protected setupContainer(): void {
        if (!this.container) return;

        this.container.removeClass('single-page-mode');
        this.container.removeClass('double-page-mode');
        this.container.addClass('webtoon-mode');

        // 创建图片元素
        if (!this.imageEl) {
            this.imageEl = this.container.createEl('img', {
                cls: 'manga-reader-image webtoon-image'
            });
        } else {
            this.imageEl.addClass('webtoon-image');
        }
    }

    render(imageUrl: string, index: number): void {
        if (!this.imageEl) return;

        this.currentIndex = index;
        this.imageEl.src = imageUrl;

        // 韩漫模式下图片加载完成后也滚动到顶部
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
