/**
 * 漫画阅读器视图
 *
 * 重构后的阅读器视图，使用服务层和组件化设计
 */

import { ItemView, Notice, WorkspaceLeaf } from 'obsidian';
import { MANGA_VIEW_TYPE } from '../../constants';
import { EventBus, getEventBus } from '../../core/event-bus';
import { ImageService, getComicParser } from '../../services';
import type { BaseComicParser } from '../../services';
import type { ComicInfo, ReadingMode } from '../../types';
import { Toolbar, ThumbnailBar, ContextMenu } from './components';
import { SinglePageMode, WebtoonMode, DoublePageMode, BaseReadingMode } from './modes';

interface MangaViewState {
    file: File;
}

/**
 * 漫画阅读器视图
 */
export class MangaReaderView extends ItemView {
    private eventBus: EventBus;
    private imageService: ImageService;
    private parser: BaseComicParser | null = null;
    private comicInfo: ComicInfo | null = null;

    // UI 组件
    private container: HTMLDivElement | null = null;
    private toolbar: Toolbar | null = null;
    private thumbnailBar: ThumbnailBar | null = null;
    private contextMenu: ContextMenu | null = null;

    // 阅读模式
    private currentMode: BaseReadingMode | null = null;
    private modes: Map<ReadingMode, BaseReadingMode> = new Map();

    // 状态
    private currentIndex: number = 0;
    private currentFile: File | null = null;
    private currentImageUrl: string | null = null;
    private currentBlob: Blob | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.eventBus = getEventBus();
        this.imageService = new ImageService(this.eventBus);
    }

    getViewType(): string {
        return MANGA_VIEW_TYPE;
    }

    getDisplayText(): string {
        return this.comicInfo?.name ?? 'Manga Reader';
    }

    getIcon(): string {
        return 'book-open';
    }

    async setState(state: MangaViewState): Promise<void> {
        if (state?.file) {
            this.currentFile = state.file;
            await this.loadManga(state.file);
        }
    }

    async onOpen(): Promise<void> {
        const contentEl = this.containerEl.children[1] as HTMLElement;
        if (!contentEl) {
            throw new Error('Invalid container element');
        }

        // 清空容器
        contentEl.empty();

        // 创建主容器
        this.container = contentEl.createDiv({ cls: 'manga-reader-container' });
        this.container.setAttribute('tabindex', '0');

        // 初始化工具栏
        this.initToolbar();

        // 初始化阅读模式
        this.initModes();

        // 初始化缩略图栏
        this.initThumbnailBar();

        // 初始化右键菜单
        this.initContextMenu();

        // 注册事件
        this.registerEvents();

        // 如果已有文件，加载它
        if (this.currentFile) {
            await this.loadManga(this.currentFile);
        }
    }

    /**
     * 初始化工具栏
     */
    private initToolbar(): void {
        const toolbarEl = this.containerEl.children[0] as HTMLElement;
        if (!toolbarEl) return;

        this.toolbar = new Toolbar(toolbarEl, {
            showPageInfo: true,
            showModeSwitch: true
        });

        this.toolbar.onModeChange((mode) => {
            this.switchMode(mode);
        });
    }

    /**
     * 初始化阅读模式
     */
    private initModes(): void {
        if (!this.container) return;

        // 创建所有模式
        const singleMode = new SinglePageMode();
        const webtoonMode = new WebtoonMode();
        const doubleMode = new DoublePageMode();

        this.modes.set('single', singleMode);
        this.modes.set('webtoon', webtoonMode);
        this.modes.set('double', doubleMode);

        // 默认使用单页模式
        this.currentMode = singleMode;
        this.currentMode.initialize(this.container);
    }

    /**
     * 初始化缩略图栏
     */
    private initThumbnailBar(): void {
        if (!this.container) return;

        const thumbnailBarEl = this.container.createDiv({ cls: 'thumbnail-bar-wrapper' });
        this.thumbnailBar = new ThumbnailBar(thumbnailBarEl, {
            thumbnailSize: 80,
            range: 5
        });

        this.thumbnailBar.setImageService(this.imageService);
        this.thumbnailBar.onSelect((index) => {
            this.goToPage(index);
        });
    }

    /**
     * 初始化右键菜单
     */
    private initContextMenu(): void {
        this.contextMenu = ContextMenu.createReaderMenu({
            onCopyImage: () => this.copyCurrentImage(),
            onAddBookmark: () => this.addBookmark()
        });
    }

    /**
     * 注册事件
     */
    private registerEvents(): void {
        if (!this.container) return;

        // 键盘事件
        this.registerDomEvent(this.container, 'keydown', (evt: KeyboardEvent) => {
            this.handleKeydown(evt);
        });

        // 鼠标移动显示缩略图栏
        this.registerDomEvent(this.container, 'mousemove', (e: MouseEvent) => {
            const rect = this.container!.getBoundingClientRect();
            const threshold = 100;

            if (e.clientY > rect.bottom - threshold) {
                this.thumbnailBar?.show();
            } else {
                this.thumbnailBar?.hide();
            }
        });

        // 鼠标离开隐藏缩略图栏
        this.registerDomEvent(this.container, 'mouseleave', () => {
            this.thumbnailBar?.hide();
        });

        // 鼠标进入时聚焦
        this.registerDomEvent(this.container, 'mouseenter', () => {
            this.container?.focus();
        });

        // 右键菜单
        this.registerDomEvent(this.container, 'contextmenu', (evt: MouseEvent) => {
            evt.preventDefault();
            this.contextMenu?.show(evt);
        });

        // 视图激活时聚焦
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                if (leaf?.view === this) {
                    this.container?.focus();
                }
            })
        );
    }

    /**
     * 处理键盘事件
     */
    private handleKeydown(evt: KeyboardEvent): void {
        switch (evt.key) {
            case 'ArrowLeft':
                evt.preventDefault();
                this.previousPage();
                break;
            case 'ArrowRight':
                evt.preventDefault();
                this.nextPage();
                break;
            case 'Home':
                evt.preventDefault();
                this.goToPage(0);
                break;
            case 'End':
                evt.preventDefault();
                this.goToPage(this.parser?.getPageCount() ?? 0 - 1);
                break;
            case ' ':
                evt.preventDefault();
                this.nextPage();
                break;
            case '1':
                this.switchMode('single');
                break;
            case '2':
                this.switchMode('double');
                break;
            case '3':
                this.switchMode('webtoon');
                break;
        }
    }

    /**
     * 加载漫画
     */
    async loadManga(file: File): Promise<void> {
        try {
            // 获取解析器
            this.parser = getComicParser(file);
            if (!this.parser) {
                new Notice('不支持的文件格式');
                return;
            }

            // 解析漫画
            const comicData = await this.parser.parse(file);
            this.comicInfo = comicData.info;

            // 设置图片服务
            this.imageService.setParser(this.parser);

            // 更新 UI
            this.currentMode?.setTotalPages(comicData.info.pageCount);
            this.thumbnailBar?.setTotalPages(comicData.info.pageCount);

            // 显示第一页
            if (comicData.info.pageCount > 0) {
                await this.showImage(0);
            } else {
                new Notice('漫画中没有找到图片');
            }

            // 发送事件
            this.eventBus.emit('comic:loaded', { comic: comicData.info });

        } catch (error) {
            console.error('[MangaReaderView] Error loading manga:', error);
            new Notice(`加载漫画失败: ${(error as Error).message}`);
        }
    }

    /**
     * 显示指定页面
     */
    async showImage(index: number): Promise<void> {
        if (!this.parser || index < 0 || index >= this.parser.getPageCount()) {
            return;
        }

        try {
            // 加载图片
            const url = await this.imageService.loadImage(index);
            this.currentImageUrl = url;
            this.currentIndex = index;

            // 获取 Blob 用于复制
            this.currentBlob = await this.imageService.getImageBlob(index);

            // 渲染图片
            this.currentMode?.render(url, index);

            // 更新 UI
            this.toolbar?.setPageInfo(index, this.parser.getPageCount());
            await this.thumbnailBar?.setCurrentIndex(index);

            // 预加载周围页面
            this.imageService.preloadAround(index, 3);

            // 发送事件
            this.eventBus.emit('comic:page-changed', {
                index,
                total: this.parser.getPageCount()
            });

        } catch (error) {
            console.error('[MangaReaderView] Error showing image:', error);
            new Notice('加载图片失败');
        }
    }

    /**
     * 下一页
     */
    nextPage(): void {
        if (!this.parser) return;

        const nextIndex = this.currentMode?.nextPage() ?? this.currentIndex + 1;
        if (nextIndex < this.parser.getPageCount()) {
            this.showImage(nextIndex);
        }
    }

    /**
     * 上一页
     */
    previousPage(): void {
        const prevIndex = this.currentMode?.previousPage() ?? this.currentIndex - 1;
        if (prevIndex >= 0) {
            this.showImage(prevIndex);
        }
    }

    /**
     * 跳转到指定页面
     */
    goToPage(index: number): void {
        this.showImage(index);
    }

    /**
     * 切换阅读模式
     */
    switchMode(mode: ReadingMode): void {
        if (!this.container) return;

        const newMode = this.modes.get(mode);
        if (!newMode || newMode === this.currentMode) return;

        // 切换模式
        this.currentMode = newMode;
        this.currentMode.initialize(this.container);
        this.currentMode.setTotalPages(this.parser?.getPageCount() ?? 0);

        // 更新工具栏
        this.toolbar?.setMode(mode);

        // 重新显示当前页面
        if (this.currentImageUrl) {
            this.currentMode.render(this.currentImageUrl, this.currentIndex);
        }

        // 发送事件
        this.eventBus.emit('comic:mode-changed', { mode });
    }

    /**
     * 复制当前图片
     */
    async copyCurrentImage(): Promise<void> {
        if (!this.currentBlob) {
            new Notice('没有可复制的图片');
            return;
        }

        try {
            await this.imageService.copyToClipboard(this.currentIndex);
            new Notice('图片已复制到剪贴板');
        } catch (error) {
            console.error('[MangaReaderView] Error copying image:', error);
            new Notice('复制图片失败');
        }
    }

    /**
     * 添加书签
     */
    addBookmark(): void {
        // TODO: 实现书签功能
        new Notice('书签功能即将推出');
    }

    async onClose(): Promise<void> {
        // 清理资源
        this.imageService.dispose();
        this.parser?.dispose();
        this.toolbar?.dispose();
        this.thumbnailBar?.dispose();

        for (const mode of this.modes.values()) {
            mode.dispose();
        }
        this.modes.clear();

        this.currentBlob = null;
        this.currentImageUrl = null;
    }
}
