/**
 * 缩略图栏组件
 */

import type { ImageService } from '../../../services';

export interface ThumbnailBarOptions {
    /** 缩略图大小 */
    thumbnailSize: number;
    /** 显示范围（当前页前后各多少张） */
    range: number;
}

const DEFAULT_OPTIONS: ThumbnailBarOptions = {
    thumbnailSize: 80,
    range: 5
};

/**
 * 缩略图栏组件
 */
export class ThumbnailBar {
    private container: HTMLElement;
    private thumbnailContainer: HTMLElement;
    private pageInfo: HTMLElement;
    private options: ThumbnailBarOptions;
    private imageService: ImageService | null = null;
    private totalPages = 0;
    private currentIndex = 0;
    private onSelectCallback: ((index: number) => void) | null = null;
    private thumbnailUrls: Map<number, string> = new Map();

    constructor(container: HTMLElement, options: Partial<ThumbnailBarOptions> = {}) {
        this.container = container;
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.setupUI();
    }

    /**
     * 设置 UI
     */
    private setupUI(): void {
        this.container.addClass('thumbnail-bar');

        // 页码信息
        this.pageInfo = this.container.createEl('div', {
            cls: 'page-info'
        });

        // 缩略图容器
        this.thumbnailContainer = this.container.createEl('div', {
            cls: 'thumbnail-container'
        });
    }

    /**
     * 设置图片服务
     */
    setImageService(service: ImageService): void {
        this.imageService = service;
    }

    /**
     * 设置总页数
     */
    setTotalPages(total: number): void {
        this.totalPages = total;
        this.updatePageInfo();
    }

    /**
     * 设置当前页码并更新缩略图
     */
    async setCurrentIndex(index: number): Promise<void> {
        this.currentIndex = index;
        this.updatePageInfo();
        await this.updateThumbnails();
    }

    /**
     * 设置选择回调
     */
    onSelect(callback: (index: number) => void): void {
        this.onSelectCallback = callback;
    }

    /**
     * 显示缩略图栏
     */
    show(): void {
        this.container.addClass('show');
    }

    /**
     * 隐藏缩略图栏
     */
    hide(): void {
        this.container.removeClass('show');
    }

    /**
     * 更新页码信息
     */
    private updatePageInfo(): void {
        this.pageInfo.textContent = `${this.currentIndex + 1} / ${this.totalPages}`;
    }

    /**
     * 更新缩略图
     */
    private async updateThumbnails(): Promise<void> {
        if (!this.imageService) return;

        // 清空现有缩略图
        this.clearThumbnails();

        // 计算显示范围
        const start = Math.max(0, this.currentIndex - this.options.range);
        const end = Math.min(this.totalPages - 1, this.currentIndex + this.options.range);

        // 创建缩略图
        const promises: Promise<void>[] = [];
        for (let i = start; i <= end; i++) {
            promises.push(this.createThumbnail(i));
        }

        await Promise.all(promises);
    }

    /**
     * 创建单个缩略图
     */
    private async createThumbnail(index: number): Promise<void> {
        if (!this.imageService) return;

        const wrapper = this.thumbnailContainer.createEl('div', {
            cls: 'thumbnail-wrapper'
        });

        const thumb = wrapper.createEl('img', {
            cls: `thumbnail${index === this.currentIndex ? ' current' : ''}`
        });

        thumb.style.width = `${this.options.thumbnailSize}px`;
        thumb.style.height = `${this.options.thumbnailSize}px`;

        try {
            const url = await this.imageService.getThumbnail(index, this.options.thumbnailSize);
            thumb.src = url;
            this.thumbnailUrls.set(index, url);

            wrapper.addEventListener('click', () => {
                if (this.onSelectCallback) {
                    this.onSelectCallback(index);
                }
            });
        } catch (error) {
            console.error(`[ThumbnailBar] Error loading thumbnail ${index}:`, error);
            thumb.alt = `Page ${index + 1}`;
        }
    }

    /**
     * 清空缩略图
     */
    private clearThumbnails(): void {
        while (this.thumbnailContainer.firstChild) {
            this.thumbnailContainer.removeChild(this.thumbnailContainer.firstChild);
        }
        // 不需要手动释放 URL，因为 ImageService 会管理缓存
        this.thumbnailUrls.clear();
    }

    /**
     * 更新选项
     */
    updateOptions(options: Partial<ThumbnailBarOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * 销毁组件
     */
    dispose(): void {
        this.clearThumbnails();
        this.imageService = null;
        this.onSelectCallback = null;
    }
}
