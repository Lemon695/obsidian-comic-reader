/**
 * 漫画库视图
 */

import { ItemView, WorkspaceLeaf, setIcon } from 'obsidian';
import { MANGA_LIBRARY_VIEW_TYPE } from '../../constants';
import { ComicSourceService, FileService } from '../../services';
import type { MangaFileInfo } from '../../types';
import type MangaReaderPlugin from '../../main';
import { t } from '../../i18n/locale';
import { libraryViewI18n } from '../../i18n/library/view';

type SortField = 'name' | 'size' | 'mtime' | 'lastRead';
type SortOrder = 'asc' | 'desc';

/**
 * 漫画库视图
 */
export class MangaLibraryView extends ItemView {
    private plugin: MangaReaderPlugin;
    private fileService: FileService;
    private sourceService: ComicSourceService;
    private mangaFiles: MangaFileInfo[] = [];
    private filteredFiles: MangaFileInfo[] = [];
    private searchInput: HTMLInputElement | null = null;
    private tableBody: HTMLElement | null = null;
    private tableHead: HTMLElement | null = null;
    private container: HTMLDivElement | null = null;
    private sortField: SortField = 'name';
    private sortOrder: SortOrder = 'asc';

    constructor(leaf: WorkspaceLeaf, plugin: MangaReaderPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.fileService = new FileService(plugin.app);
        this.sourceService = new ComicSourceService(plugin.app);
    }

    getViewType(): string {
        return MANGA_LIBRARY_VIEW_TYPE;
    }

    getDisplayText(): string {
        return t(libraryViewI18n, this.plugin.settings.ui.language).displayText;
    }

    getIcon(): string {
        return 'library';
    }

    async onOpen(): Promise<void> {
        const contentEl = this.containerEl.children[1] as HTMLElement;
        if (!contentEl) {
            throw new Error('Invalid container element');
        }

        contentEl.empty();
        this.container = contentEl.createDiv({ cls: 'manga-library-container' });

        this.createSearchBar();
        this.createTable();
        await this.loadMangaFiles();
    }

    /**
     * 创建搜索栏
     */
    private createSearchBar(): void {
        if (!this.container) return;
        const i18n = t(libraryViewI18n, this.plugin.settings.ui.language);

        const searchBar = this.container.createDiv({ cls: 'manga-library-search-bar' });

        this.searchInput = searchBar.createEl('input', {
            type: 'text',
            placeholder: i18n.searchPlaceholder,
            cls: 'manga-library-search-input'
        });

        this.searchInput.addEventListener('input', () => {
            this.filterFiles();
        });

        const refreshButton = searchBar.createEl('button', {
            cls: 'manga-library-refresh-button'
        });
        setIcon(refreshButton, 'refresh-cw');
        refreshButton.createSpan({ text: ` ${i18n.refresh}` });

        refreshButton.addEventListener('click', async () => {
            await this.loadMangaFiles();
        });
    }

    /**
     * 创建表格
     */
    private createTable(): void {
        if (!this.container) return;
        const i18n = t(libraryViewI18n, this.plugin.settings.ui.language);

        const tableContainer = this.container.createDiv({ cls: 'manga-library-table-container' });
        const table = tableContainer.createEl('table', { cls: 'manga-library-table' });

        const thead = table.createEl('thead');
        this.tableHead = thead.createEl('tr');

        this.createSortableHeader(i18n.headers.name, 'name');
        this.createSortableHeader(i18n.headers.size, 'size');
        this.createSortableHeader(i18n.headers.mtime, 'mtime');
        this.createSortableHeader(i18n.headers.lastRead, 'lastRead');

        this.tableBody = table.createEl('tbody');
    }

    /**
     * 创建可排序的表头
     */
    private createSortableHeader(label: string, field: SortField): void {
        if (!this.tableHead) return;

        const th = this.tableHead.createEl('th', { cls: 'sortable-header' });
        const headerContent = th.createDiv({ cls: 'header-content' });

        headerContent.createSpan({ text: label });
        const sortIcon = headerContent.createSpan({ cls: 'sort-icon' });
        this.updateSortIcon(sortIcon, field);

        th.addEventListener('click', () => {
            this.handleSort(field);
        });
    }

    /**
     * 更新排序图标
     */
    private updateSortIcon(iconEl: HTMLElement, field: SortField): void {
        iconEl.empty();

        if (this.sortField === field) {
            setIcon(iconEl, this.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down');
            iconEl.addClass('active');
        } else {
            setIcon(iconEl, 'chevrons-up-down');
            iconEl.removeClass('active');
        }
    }

    /**
     * 更新所有排序图标
     */
    private updateAllSortIcons(): void {
        if (!this.tableHead) return;

        const headers = this.tableHead.querySelectorAll('.sortable-header');
        const fields: SortField[] = ['name', 'size', 'mtime', 'lastRead'];

        headers.forEach((header, index) => {
            const sortIcon = header.querySelector('.sort-icon') as HTMLElement;
            if (sortIcon) {
                this.updateSortIcon(sortIcon, fields[index]);
            }
        });
    }

    /**
     * 处理排序
     */
    private handleSort(field: SortField): void {
        if (this.sortField === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortOrder = 'asc';
        }

        this.updateAllSortIcons();
        this.sortFiles();
        this.renderTable();
    }

    /**
     * 排序文件
     */
    private sortFiles(): void {
        this.filteredFiles.sort((a, b) => {
            let comparison = 0;

            switch (this.sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
                case 'mtime':
                    comparison = a.mtime - b.mtime;
                    break;
                case 'lastRead': {
                    const aLastRead = this.getLastReadTime(a.path);
                    const bLastRead = this.getLastReadTime(b.path);
                    comparison = aLastRead - bLastRead;
                    break;
                }
            }

            return this.sortOrder === 'asc' ? comparison : -comparison;
        });
    }

    /**
     * 获取最后阅读时间
     */
    private getLastReadTime(path: string): number {
        const history = this.plugin.getHistory();
        const historyItem = history.find(
            (item) => item.path === path || item.fileName === path.split('/').pop()
        );
        return historyItem?.lastOpened ?? 0;
    }

    /**
     * 加载漫画文件
     */
    private async loadMangaFiles(): Promise<void> {
        const settings = this.plugin.getSettings();
        const folders = settings.libraryFolders ?? ['/'];

        this.mangaFiles = [];
        for (const folder of folders) {
            const files = await this.fileService.scanMangaFiles(folder, settings.scanSubfolders);
            this.mangaFiles.push(...files);
        }

        this.filteredFiles = [...this.mangaFiles];
        this.sortFiles();
        this.renderTable();
    }

    /**
     * 过滤文件
     */
    private filterFiles(): void {
        const query = this.searchInput?.value.toLowerCase() ?? '';
        this.filteredFiles = this.mangaFiles.filter(f =>
            f.name.toLowerCase().includes(query)
        );
        this.sortFiles();
        this.renderTable();
    }

    /**
     * 渲染表格
     */
    private renderTable(): void {
        if (!this.tableBody) return;
        const i18n = t(libraryViewI18n, this.plugin.settings.ui.language);

        this.tableBody.empty();

        if (this.filteredFiles.length === 0) {
            const emptyRow = this.tableBody.createEl('tr');
            const emptyCell = emptyRow.createEl('td', {
                text: this.mangaFiles.length === 0 ? i18n.noFiles : i18n.noResults,
                attr: { colspan: '4' }
            });
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '20px';
            emptyCell.style.color = 'var(--text-muted)';
            return;
        }

        for (const file of this.filteredFiles) {
            const row = this.tableBody.createEl('tr', { cls: 'manga-library-row' });

            row.createEl('td', { text: file.name });
            row.createEl('td', { text: this.formatFileSize(file.size) });
            row.createEl('td', { text: this.formatDate(file.mtime) });

            const lastReadTime = this.getLastReadTime(file.path);
            row.createEl('td', {
                text: lastReadTime ? this.formatDate(lastReadTime) : i18n.unread,
                cls: lastReadTime ? '' : 'text-muted'
            });

            row.addEventListener('click', async () => {
                await this.openManga(file);
            });
        }
    }

    /**
     * 格式化文件大小
     */
    private formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * 格式化日期
     */
    private formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 打开漫画
     */
    private async openManga(fileInfo: MangaFileInfo): Promise<void> {
        try {
            const file = await this.fileService.readVaultFile(fileInfo.path);
            if (!file) {
                throw new Error(t(libraryViewI18n, this.plugin.settings.ui.language).fileMissing);
            }

            await this.plugin.openMangaViewFromFile(file, {
                source: this.sourceService.createVaultSource(fileInfo.path, fileInfo.name),
            });
        } catch (error) {
            console.error('[MangaLibraryView] Error opening manga:', error);
        }
    }

    async onClose(): Promise<void> {
        // 清理资源
    }
}
