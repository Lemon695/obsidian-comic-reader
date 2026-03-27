/**
 * ZIP/CBZ 格式漫画解析器
 */

import JSZip from 'jszip';
import { BaseComicParser } from './base-parser';
import type { ComicData } from '../../types';
import { isSupportedImage } from '../../types';

/**
 * ZIP/CBZ 解析器
 */
export class ZipParser extends BaseComicParser {
    readonly supportedExtensions = ['zip', 'cbz'];
    readonly name = 'ZIP/CBZ Parser';

    private zipInstance: JSZip | null = null;
    private imageFiles: string[] = [];

    /**
     * 解析 ZIP/CBZ 文件
     */
    async parse(file: File): Promise<ComicData> {
        this.currentFile = file;
        this.zipInstance = new JSZip();

        try {
            const zipContent = await this.zipInstance.loadAsync(file);

            // 获取所有图片文件并排序
            this.imageFiles = Object.keys(zipContent.files)
                .filter(filename => {
                    const isImage = isSupportedImage(filename);
                    const isNotDir = !zipContent.files[filename].dir;
                    return isImage && isNotDir;
                })
                .sort(this.naturalSort);

            // 创建页面信息
            this.pages = this.imageFiles.map((filename, index) =>
                this.createPageInfo(index, filename)
            );

            const format = file.name.toLowerCase().endsWith('.cbz') ? 'cbz' : 'zip';
            const info = this.createComicInfo(file, format, this.pages.length);

            return {
                info,
                pages: this.pages
            };
        } catch (error) {
            console.error('[ZipParser] Error parsing file:', error);
            throw new Error(`Failed to parse ZIP file: ${(error as Error).message}`);
        }
    }

    /**
     * 获取指定页面的图片
     */
    async getPage(index: number): Promise<Blob> {
        if (!this.zipInstance || index < 0 || index >= this.imageFiles.length) {
            throw new Error(`Invalid page index: ${index}`);
        }

        const filename = this.imageFiles[index];
        const imageFile = this.zipInstance.file(filename);

        if (!imageFile) {
            throw new Error(`Image file not found: ${filename}`);
        }

        return await imageFile.async('blob');
    }

    /**
     * 获取缩略图
     */
    async getThumbnail(index: number, size = 80): Promise<Blob> {
        // 对于 ZIP 格式，直接返回原图
        // 缩略图的缩放由前端处理
        return this.getPage(index);
    }

    /**
     * 释放资源
     */
    dispose(): void {
        this.zipInstance = null;
        this.imageFiles = [];
        this.pages = [];
        this.currentFile = null;
    }

    /**
     * 自然排序比较函数
     * 处理文件名中的数字，使 "2" 排在 "10" 前面
     */
    private naturalSort(a: string, b: string): number {
        const extractNumber = (str: string): number => {
            const match = str.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
        };

        const numA = extractNumber(a);
        const numB = extractNumber(b);

        if (numA !== numB) {
            return numA - numB;
        }

        return a.localeCompare(b);
    }
}
