/**
 * 单页阅读模式
 */

import { BaseReadingMode } from './base-mode';
import type { ReadingMode } from '../../../types';

/**
 * 单页模式 - 每次显示一页，图片居中显示
 */
export class SinglePageMode extends BaseReadingMode {
    readonly name: ReadingMode = 'single';
    readonly displayName = '单页模式';
    readonly icon = 'file';

    private imageEl: HTMLImageElement | null = null;

    protected setupContainer(): void {
        if (!this.container) return;

        // 添加模式类
        this.container.addClass('single-page-mode');

        // 创建图片容器
        this.imageContainer = this.container.createEl('div', {
            cls: 'mode-image-container single-image-container'
        });

        // 创建图片元素
        this.imageEl = this.imageContainer.createEl('img', {
            cls: 'manga-reader-image single-page-image'
        });
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

    dispose(): void {
        this.imageEl = null;
        super.dispose();
    }
}
