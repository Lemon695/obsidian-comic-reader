import { ItemView, TFile, TFolder, Vault, WorkspaceLeaf, setIcon } from "obsidian";
import { MANGA_LIBRARY_VIEW_TYPE } from "../constants";
import { MangaFileInfo } from "../type/types";
import type MangaReaderPlugin from "../main";

type SortField = 'name' | 'size' | 'mtime' | 'lastRead';
type SortOrder = 'asc' | 'desc';

export class MangaLibraryView extends ItemView {
    private plugin: MangaReaderPlugin;
    private mangaFiles: MangaFileInfo[] = [];
    private filteredFiles: MangaFileInfo[] = [];
    private searchInput: HTMLInputElement;
    private tableBody: HTMLElement;
    private tableHead: HTMLElement;
    private container: HTMLDivElement;
    private sortField: SortField = 'name';
    private sortOrder: SortOrder = 'asc';

    constructor(leaf: WorkspaceLeaf, plugin: MangaReaderPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return MANGA_LIBRARY_VIEW_TYPE;
    }

    getDisplayText(): string {
        return '漫画库';
    }

    getIcon(): string {
        return 'library';
    }

    async onOpen(): Promise<void> {
        const contentEl = this.containerEl.children[1];
        if (!(contentEl instanceof HTMLElement)) {
            throw new Error("Invalid container element");
        }

        contentEl.empty();
        this.container = contentEl.createDiv({ cls: 'manga-library-container' });

        // 创建搜索栏
        this.createSearchBar();

        // 创建表格
        this.createTable();

        // 加载漫画文件
        await this.loadMangaFiles();
    }

    private createSearchBar(): void {
        const searchBar = this.container.createDiv({ cls: 'manga-library-search-bar' });

        // 搜索输入框
        this.searchInput = searchBar.createEl('input', {
            type: 'text',
            placeholder: '搜索漫画...',
            cls: 'manga-library-search-input'
        });

        this.searchInput.addEventListener('input', () => {
            this.filterFiles();
        });

        // 刷新按钮
        const refreshButton = searchBar.createEl('button', {
            cls: 'manga-library-refresh-button'
        });
        setIcon(refreshButton, 'refresh-cw');
        refreshButton.createSpan({ text: ' 刷新' });

        refreshButton.addEventListener('click', async () => {
            await this.loadMangaFiles();
        });
    }

    private createTable(): void {
        const tableContainer = this.container.createDiv({ cls: 'manga-library-table-container' });
        const table = tableContainer.createEl('table', { cls: 'manga-library-table' });

        // 表头
        const thead = table.createEl('thead');
        this.tableHead = thead.createEl('tr');

        this.createSortableHeader('文件名', 'name');
        this.createSortableHeader('大小', 'size');
        this.createSortableHeader('最近添加', 'mtime');
        this.createSortableHeader('最近阅读', 'lastRead');

        // 表体
        this.tableBody = table.createEl('tbody');
    }

    private createSortableHeader(label: string, field: SortField): void {
        const th = this.tableHead.createEl('th', { cls: 'sortable-header' });
        const headerContent = th.createDiv({ cls: 'header-content' });

        headerContent.createSpan({ text: label });

        const sortIcon = headerContent.createSpan({ cls: 'sort-icon' });

        // 设置初始排序图标
        this.updateSortIcon(sortIcon, field);

        th.addEventListener('click', () => {
            this.handleSort(field);
        });
    }

    private updateSortIcon(iconEl: HTMLElement, field: SortField): void {
        iconEl.empty();

        if (this.sortField === field) {
            if (this.sortOrder === 'asc') {
                setIcon(iconEl, 'arrow-up');
            } else {
                setIcon(iconEl, 'arrow-down');
            }
            iconEl.addClass('active');
        } else {
            setIcon(iconEl, 'chevrons-up-down');
            iconEl.removeClass('active');
        }
    }

    private updateAllSortIcons(): void {
        const headers = this.tableHead.querySelectorAll('.sortable-header');
        const fields: SortField[] = ['name', 'size', 'mtime', 'lastRead'];

        headers.forEach((header, index) => {
            const sortIcon = header.querySelector('.sort-icon') as HTMLElement;
            if (sortIcon) {
                this.updateSortIcon(sortIcon, fields[index]);
            }
        });
    }

    private handleSort(field: SortField): void {
        if (this.sortField === field) {
            // 切换排序顺序
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            // 新字段,默认升序
            this.sortField = field;
            this.sortOrder = 'asc';
        }

        this.updateAllSortIcons();
        this.sortFiles();
        this.renderTable();
    }

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
                case 'lastRead':
                    const aLastRead = this.getLastReadTime(a.path);
                    const bLastRead = this.getLastReadTime(b.path);
                    comparison = aLastRead - bLastRead;
                    break;
            }

            return this.sortOrder === 'asc' ? comparison : -comparison;
        });
    }

    private getLastReadTime(path: string): number {
        // 从历史记录中查找最后阅读时间
        const historyItem = this.plugin.settings.history.find(
            item => item.path === path || item.fileName === path.split('/').pop()
        );
        return historyItem ? historyItem.lastOpened : 0;
    }

    private async loadMangaFiles(): Promise<void> {
        this.mangaFiles = await this.scanMangaFiles(this.plugin.settings.mangaLibraryFolder);
        this.filteredFiles = [...this.mangaFiles];
        this.sortFiles();
        this.renderTable();
    }

    private async scanMangaFiles(folderPath: string): Promise<MangaFileInfo[]> {
        const files: MangaFileInfo[] = [];
        const folder = this.app.vault.getAbstractFileByPath(folderPath);

        if (folder instanceof TFolder) {
            Vault.recurseChildren(folder, (file) => {
                if (file instanceof TFile && file.extension === 'zip') {
                    files.push({
                        name: file.name,
                        path: file.path,
                        size: file.stat.size,
                        mtime: file.stat.mtime
                    });
                }
            });
        }

        return files;
    }

    private filterFiles(): void {
        const query = this.searchInput.value.toLowerCase();
        this.filteredFiles = this.mangaFiles.filter(f =>
            f.name.toLowerCase().includes(query)
        );
        this.sortFiles();
        this.renderTable();
    }

    private renderTable(): void {
        this.tableBody.empty();

        if (this.filteredFiles.length === 0) {
            const emptyRow = this.tableBody.createEl('tr');
            const emptyCell = emptyRow.createEl('td', {
                text: this.mangaFiles.length === 0 ? '未找到漫画文件' : '没有匹配的结果',
                attr: { colspan: '4' }
            });
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '20px';
            emptyCell.style.color = 'var(--text-muted)';
            return;
        }

        for (const file of this.filteredFiles) {
            const row = this.tableBody.createEl('tr', { cls: 'manga-library-row' });

            // 文件名
            row.createEl('td', { text: file.name });

            // 文件大小
            row.createEl('td', { text: this.formatFileSize(file.size) });

            // 最近添加时间
            row.createEl('td', { text: this.formatDate(file.mtime) });

            // 最近阅读时间
            const lastReadTime = this.getLastReadTime(file.path);
            row.createEl('td', {
                text: lastReadTime ? this.formatDate(lastReadTime) : '未阅读',
                cls: lastReadTime ? '' : 'text-muted'
            });

            // 点击事件
            row.addEventListener('click', async () => {
                await this.openManga(file);
            });
        }
    }

    private formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

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

    private async openManga(fileInfo: MangaFileInfo): Promise<void> {
        try {
            const tfile = this.app.vault.getAbstractFileByPath(fileInfo.path);
            if (!(tfile instanceof TFile)) {
                throw new Error('文件不存在');
            }

            // 读取文件为 ArrayBuffer
            const arrayBuffer = await this.app.vault.readBinary(tfile);

            // 创建 File 对象
            const file = new File([arrayBuffer], fileInfo.name, {
                type: 'application/zip'
            });

            // 调用插件的打开方法
            await this.plugin.openMangaViewFromFile(file);
        } catch (error) {
            console.error('Error opening manga:', error);
        }
    }

    async onClose(): Promise<void> {
        // 清理资源
    }
}
