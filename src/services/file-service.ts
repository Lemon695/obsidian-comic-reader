/**
 * 文件服务 - 处理文件访问和读取
 */

import { App, TFile, TFolder, Vault } from 'obsidian';
import type { MangaFileInfo, ComicFormat } from '../types';
import { getComicFormat } from '../types';
import {
    getComicMimeType,
    getSupportedComicPickerAccept,
    isSupportedComicExtension,
} from './comic-parser';

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
        acceptedFormats?: ComicFormat[]
    ): Promise<FileSystemFileHandle | null> {
        try {
            const allAccept = getSupportedComicPickerAccept();
            const accept = acceptedFormats?.length
                ? this.filterAcceptMap(allAccept, acceptedFormats)
                : allAccept;

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
        recursive = true
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
        return isSupportedComicExtension(extension);
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
        return getComicMimeType(format);
    }

    private filterAcceptMap(
        acceptMap: Record<string, string[]>,
        acceptedFormats: ComicFormat[]
    ): Record<string, string[]> {
        const allowedExtensions = new Set(acceptedFormats.map((format) => `.${format}`));
        const filtered: Record<string, string[]> = {};

        for (const [mimeType, extensions] of Object.entries(acceptMap)) {
            const matched = extensions.filter((extension) => allowedExtensions.has(extension));
            if (matched.length > 0) {
                filtered[mimeType] = matched;
            }
        }

        return filtered;
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
