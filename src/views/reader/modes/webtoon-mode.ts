/**
 * 韩漫/条漫阅读模式
 */

import { BaseReadingMode } from './base-mode';
import type { ReadingMode } from '../../../types';

/**
 * 韩漫模式 - 长条滚动阅读，图片宽度限制，适合条漫
 */
export class WebtoonMode extends BaseReadingMode {
    readonly name: ReadingMode = 'webtoon';
    readonly displayName = '韩漫模式';
    readonly icon = 'scroll';

    private imageEl: HTMLImageElement | null = null;

    protected setupContainer(): void {
        if (!this.container) return;

        // 添加模式类
        this.container.addClass('webtoon-mode');

        // 创建图片容器
        this.imageContainer = this.container.createEl('div', {
            cls: 'mode-image-container webtoon-image-container'
        });

        // 创建图片元素
        this.imageEl = this.imageContainer.createEl('img', {
            cls: 'manga-reader-image webtoon-image'
        });
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

    dispose(): void {
        this.imageEl = null;
        super.dispose();
    }
}
