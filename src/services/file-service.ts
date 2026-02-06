/**
 * 文件服务 - 处理文件访问和读取
 */

import { App, TFile, TFolder, Vault } from 'obsidian';
import type { MangaFileInfo, ComicFormat } from '../types';
import { getComicFormat } from '../types';

/** 支持的漫画文件扩展名（目前只支持 ZIP/CBZ） */
const SUPPORTED_EXTENSIONS = ['zip', 'cbz'];

/**
 * 文件服务类
 */
export class FileService {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * 请求外部文件访问权限
     *
     * @param acceptedFormats - 接受的文件格式
     * @returns 文件句柄，如果取消则返回 null
     */
    async requestExternalFileAccess(
        acceptedFormats: ComicFormat[] = ['zip', 'cbz', 'cbr']
    ): Promise<FileSystemFileHandle | null> {
        try {
            const accept: Record<string, string[]> = {};

            if (acceptedFormats.includes('zip') || acceptedFormats.includes('cbz')) {
                accept['application/zip'] = ['.zip', '.cbz'];
            }
            if (acceptedFormats.includes('cbr')) {
                accept['application/x-rar-compressed'] = ['.cbr'];
            }
            if (acceptedFormats.includes('pdf')) {
                accept['application/pdf'] = ['.pdf'];
            }

            const handles = await window.showOpenFilePicker({
                types: [{
                    description: 'Comic files',
                    accept
                }]
            });

            return handles?.[0] ?? null;
        } catch (error) {
            // 用户取消选择
            if ((error as Error).name === 'AbortError') {
                return null;
            }
            console.error('[FileService] Error requesting file access:', error);
            return null;
        }
    }

    /**
     * 从文件句柄获取 File 对象
     */
    async getFileFromHandle(handle: FileSystemFileHandle): Promise<File | null> {
        try {
            return await handle.getFile();
        } catch (error) {
            console.error('[FileService] Error getting file from handle:', error);
            return null;
        }
    }

    /**
     * 从 Vault 读取文件为 File 对象
     *
     * @param path - 文件路径
     * @returns File 对象
     */
    async readVaultFile(path: string): Promise<File | null> {
        try {
            const tfile = this.app.vault.getAbstractFileByPath(path);
            if (!(tfile instanceof TFile)) {
                console.error('[FileService] File not found:', path);
                return null;
            }

            const arrayBuffer = await this.app.vault.readBinary(tfile);
            const format = getComicFormat(tfile.name);

            return new File([arrayBuffer], tfile.name, {
                type: this.getMimeType(format)
            });
        } catch (error) {
            console.error('[FileService] Error reading vault file:', error);
            return null;
        }
    }

    /**
     * 扫描文件夹中的漫画文件
     *
     * @param folderPath - 文件夹路径
     * @param recursive - 是否递归扫描子文件夹
     * @returns 漫画文件信息列表
     */
    async scanMangaFiles(
        folderPath: string,
        recursive: boolean = true
    ): Promise<MangaFileInfo[]> {
        const files: MangaFileInfo[] = [];
        const folder = this.app.vault.getAbstractFileByPath(folderPath);

        if (!(folder instanceof TFolder)) {
            console.warn('[FileService] Folder not found:', folderPath);
            return files;
        }

        if (recursive) {
            Vault.recurseChildren(folder, (file) => {
                if (file instanceof TFile && this.isSupportedFormat(file.extension)) {
                    files.push(this.createMangaFileInfo(file));
                }
            });
        } else {
            for (const child of folder.children) {
                if (child instanceof TFile && this.isSupportedFormat(child.extension)) {
                    files.push(this.createMangaFileInfo(child));
                }
            }
        }

        return files;
    }

    /**
     * 检查文件扩展名是否为支持的格式
     */
    isSupportedFormat(extension: string): boolean {
        return SUPPORTED_EXTENSIONS.includes(extension.toLowerCase());
    }

    /**
     * 创建漫画文件信息对象
     */
    private createMangaFileInfo(file: TFile): MangaFileInfo {
        return {
            name: file.name,
            path: file.path,
            size: file.stat.size,
            mtime: file.stat.mtime
        };
    }

    /**
     * 获取文件的 MIME 类型
     */
    private getMimeType(format: ComicFormat | null): string {
        switch (format) {
            case 'zip':
            case 'cbz':
                return 'application/zip';
            case 'cbr':
                return 'application/x-rar-compressed';
            case 'pdf':
                return 'application/pdf';
            default:
                return 'application/octet-stream';
        }
    }

    /**
     * 检查文件是否存在于 Vault 中
     */
    fileExists(path: string): boolean {
        const file = this.app.vault.getAbstractFileByPath(path);
        return file instanceof TFile;
    }

    /**
     * 获取文件信息
     */
    getFileInfo(path: string): MangaFileInfo | null {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) {
            return null;
        }
        return this.createMangaFileInfo(file);
    }
}
