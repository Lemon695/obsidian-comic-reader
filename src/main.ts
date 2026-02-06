/**
 * Obsidian Comic Reader 插件
 *
 * 一个功能强大的漫画阅读插件
 */

import { Plugin, Notice, Modal } from 'obsidian';
import { MANGA_VIEW_TYPE, MANGA_LIBRARY_VIEW_TYPE } from './constants';
import { EventBus, getEventBus, resetEventBus } from './core';
import {
    StorageService,
    HistoryService,
    FileService,
    ComicParserFactory
} from './services';
import { MangaReaderView, MangaLibraryView, SettingsTab } from './views';
import type { Settings, HistoryItem } from './types';
import { DEFAULT_SETTINGS } from './types';

export default class MangaReaderPlugin extends Plugin {
    private eventBus!: EventBus;
    private storageService!: StorageService;
    private historyService!: HistoryService;
    private fileService!: FileService;
    private settings: Settings = DEFAULT_SETTINGS;

    async onload(): Promise<void> {
        console.log('Loading Comic Reader plugin');

        // 初始化核心服务
        this.eventBus = getEventBus();
        this.storageService = new StorageService(this);
        this.historyService = new HistoryService(this.storageService, this.eventBus);
        this.fileService = new FileService(this.app);

        // 加载设置
        await this.loadSettings();

        // 初始化历史记录服务
        await this.historyService.initialize(this.settings);

        // 注册视图
        this.registerViews();

        // 注册命令
        this.registerCommands();

        // 注册 Ribbon 按钮
        this.registerRibbonIcons();

        // 注册设置标签页
        this.addSettingTab(new SettingsTab(this.app, this));

        // 监听设置变化
        this.eventBus.on('settings:changed', ({ settings }) => {
            this.historyService.updateSettings(settings);
        });
    }

    /**
     * 注册视图
     */
    private registerViews(): void {
        // 注册漫画阅读器视图
        this.registerView(
            MANGA_VIEW_TYPE,
            (leaf) => new MangaReaderView(leaf)
        );

        // 注册漫画库视图
        this.registerView(
            MANGA_LIBRARY_VIEW_TYPE,
            (leaf) => new MangaLibraryView(leaf, this)
        );
    }

    /**
     * 注册命令
     */
    private registerCommands(): void {
        // 打开漫画文件
        this.addCommand({
            id: 'open-manga-zip',
            name: '打开漫画文件',
            callback: async () => {
                await this.openMangaFromPicker();
            }
        });

        // 显示历史记录
        this.addCommand({
            id: 'show-manga-history',
            name: '显示阅读历史',
            callback: () => {
                new MangaHistoryModal(this).open();
            }
        });

        // 打开漫画库
        this.addCommand({
            id: 'open-manga-library',
            name: '打开漫画库',
            callback: async () => {
                await this.openMangaLibrary();
            }
        });
    }

    /**
     * 注册 Ribbon 图标
     */
    private registerRibbonIcons(): void {
        // 打开漫画按钮
        this.addRibbonIcon('book-open', '打开漫画', async () => {
            await this.openMangaFromPicker();
        });

        // 历史记录按钮
        this.addRibbonIcon('history', '阅读历史', () => {
            new MangaHistoryModal(this).open();
        });

        // 漫画库按钮
        this.addRibbonIcon('library', '漫画库', async () => {
            await this.openMangaLibrary();
        });
    }

    /**
     * 加载设置
     */
    async loadSettings(): Promise<void> {
        this.settings = await this.storageService.loadSettings();
    }

    /**
     * 保存设置
     */
    async saveSettings(): Promise<void> {
        await this.storageService.saveSettings(this.settings);
    }

    /**
     * 更新设置
     */
    async updateSettings(partial: Partial<Settings>): Promise<void> {
        this.settings = { ...this.settings, ...partial };
        await this.saveSettings();
        this.eventBus.emit('settings:changed', { settings: partial });
    }

    /**
     * 获取设置
     */
    getSettings(): Readonly<Settings> {
        return this.settings;
    }

    /**
     * 获取历史记录
     */
    getHistory(): readonly HistoryItem[] {
        return this.historyService.getHistory();
    }

    /**
     * 清除历史记录
     */
    async clearHistory(): Promise<void> {
        await this.historyService.clear();
        new Notice('历史记录已清除');
    }

    /**
     * 从文件选择器打开漫画
     */
    async openMangaFromPicker(): Promise<void> {
        try {
            const fileHandle = await this.fileService.requestExternalFileAccess();
            if (!fileHandle) return;

            const file = await this.fileService.getFileFromHandle(fileHandle);
            if (!file) {
                new Notice('无法读取文件');
                return;
            }

            // 添加到历史记录
            await this.historyService.addItem(
                file.name,
                file.name,
                'external',
                fileHandle
            );

            // 打开阅读器
            await this.openMangaView(file);
        } catch (error) {
            console.error('[MangaReaderPlugin] Error opening file:', error);
            new Notice('打开文件失败');
        }
    }

    /**
     * 打开漫画阅读器视图
     */
    async openMangaView(file: File): Promise<void> {
        const workspace = this.app.workspace;
        const leaf = workspace.getLeaf('split', 'vertical');

        await leaf.setViewState({
            type: MANGA_VIEW_TYPE
        });

        const view = leaf.view as MangaReaderView;
        if (view) {
            await view.setState({ file });
        }

        workspace.revealLeaf(leaf);
    }

    /**
     * 从 File 对象打开漫画（供漫画库调用）
     */
    async openMangaViewFromFile(file: File): Promise<void> {
        // 添加到历史记录
        await this.historyService.addItem(
            file.name,
            file.name,
            'vault'
        );

        await this.openMangaView(file);
    }

    /**
     * 打开漫画库视图
     */
    async openMangaLibrary(): Promise<void> {
        const workspace = this.app.workspace;
        const leaves = workspace.getLeavesOfType(MANGA_LIBRARY_VIEW_TYPE);

        if (leaves.length > 0) {
            workspace.revealLeaf(leaves[0]);
        } else {
            const leaf = workspace.getLeaf('tab');
            await leaf.setViewState({
                type: MANGA_LIBRARY_VIEW_TYPE,
                active: true
            });
            workspace.revealLeaf(leaf);
        }
    }

    onunload(): void {
        console.log('Unloading Comic Reader plugin');

        // 清理视图
        this.app.workspace.detachLeavesOfType(MANGA_VIEW_TYPE);
        this.app.workspace.detachLeavesOfType(MANGA_LIBRARY_VIEW_TYPE);

        // 清理解析器工厂
        ComicParserFactory.reset();

        // 清理事件总线
        resetEventBus();
    }
}

/**
 * 历史记录模态窗口
 */
class MangaHistoryModal extends Modal {
    private plugin: MangaReaderPlugin;

    constructor(plugin: MangaReaderPlugin) {
        super(plugin.app);
        this.plugin = plugin;
    }

    async onOpen(): Promise<void> {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('manga-history-modal');

        contentEl.createEl('h2', { text: '阅读历史' });

        const history = this.plugin.getHistory();

        if (history.length === 0) {
            contentEl.createEl('p', {
                text: '暂无阅读历史',
                cls: 'manga-history-empty'
            });
            return;
        }

        const historyList = contentEl.createDiv({ cls: 'manga-history-list' });

        for (const item of history) {
            const itemDiv = historyList.createDiv({ cls: 'manga-history-item' });

            itemDiv.createDiv({
                text: item.fileName,
                cls: 'manga-history-title'
            });

            const infoDiv = itemDiv.createDiv({ cls: 'manga-history-info' });
            infoDiv.createSpan({
                text: new Date(item.lastOpened).toLocaleString(),
                cls: 'manga-history-date'
            });

            if (item.lastPage !== undefined && item.totalPages !== undefined) {
                infoDiv.createSpan({
                    text: ` · ${item.lastPage + 1}/${item.totalPages}`,
                    cls: 'manga-history-progress'
                });
            }

            itemDiv.addEventListener('click', async () => {
                await this.openHistoryItem(item);
            });
        }
    }

    /**
     * 打开历史记录项
     */
    private async openHistoryItem(item: HistoryItem): Promise<void> {
        try {
            let file: File | null = null;

            if (item.sourceType === 'external' && item.fileHandle) {
                // 外部文件，使用文件句柄
                file = await item.fileHandle.getFile();
            } else {
                // Vault 内文件
                const fileService = new FileService(this.app);
                file = await fileService.readVaultFile(item.path);
            }

            if (!file) {
                // 文件不可访问，提示用户重新选择
                new Notice('无法访问文件，请重新选择');
                const fileService = new FileService(this.app);
                const handle = await fileService.requestExternalFileAccess();
                if (handle) {
                    file = await fileService.getFileFromHandle(handle);
                }
            }

            if (file) {
                await this.plugin.openMangaView(file);
                this.close();
            }
        } catch (error) {
            console.error('[MangaHistoryModal] Error opening file:', error);
            new Notice('打开文件失败');
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
