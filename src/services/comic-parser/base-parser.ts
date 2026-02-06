/**
 * 漫画解析器基类
 *
 * 使用策略模式，支持多种漫画格式
 */

import type { ComicData, ComicInfo, PageInfo, ComicFormat } from '../../types';

/**
 * 漫画解析器抽象基类
 */
export abstract class BaseComicParser {
    /** 支持的文件扩展名 */
    abstract readonly supportedExtensions: string[];

    /** 解析器名称 */
    abstract readonly name: string;

    /** 当前文件 */
    protected currentFile: File | null = null;

    /** 页面列表 */
    protected pages: PageInfo[] = [];

    /**
     * 检查是否可以解析指定文件
     */
    canParse(file: File): boolean {
        const ext = file.name.toLowerCase().split('.').pop();
        return ext ? this.supportedExtensions.includes(ext) : false;
    }

    /**
     * 解析漫画文件
     *
     * @param file - 漫画文件
     * @returns 漫画数据
     */
    abstract parse(file: File): Promise<ComicData>;

    /**
     * 获取指定页面的图片数据
     *
     * @param index - 页面索引
     * @returns 图片 Blob
     */
    abstract getPage(index: number): Promise<Blob>;

    /**
     * 获取指定页面的缩略图
     *
     * @param index - 页面索引
     * @param size - 缩略图大小
     * @returns 缩略图 Blob
     */
    abstract getThumbnail(index: number, size?: number): Promise<Blob>;

    /**
     * 获取页面数量
     */
    getPageCount(): number {
        return this.pages.length;
    }

    /**
     * 获取页面列表
     */
    getPages(): readonly PageInfo[] {
        return this.pages;
    }

    /**
     * 获取当前文件信息
     */
    getCurrentFile(): File | null {
        return this.currentFile;
    }

    /**
     * 释放资源
     */
    abstract dispose(): void;

    /**
     * 创建漫画信息对象
     */
    protected createComicInfo(file: File, format: ComicFormat, pageCount: number): ComicInfo {
        return {
            path: file.name, // 外部文件只有文件名
            name: file.name,
            format,
            pageCount,
            fileSize: file.size,
            lastModified: file.lastModified
        };
    }

    /**
     * 创建页面信息对象
     */
    protected createPageInfo(index: number, filename: string): PageInfo {
        return {
            index,
            filename
        };
    }
}
