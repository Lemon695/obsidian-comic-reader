/**
 * 漫画相关类型定义
 */

/** 支持的漫画格式 */
export type ComicFormat = 'zip' | 'cbz' | 'cbr' | 'pdf';

export interface ExternalComicSource {
    kind: 'external';
    fileName: string;
}

export interface VaultComicSource {
    kind: 'vault';
    path: string;
    fileName: string;
}

export type ComicSource = ExternalComicSource | VaultComicSource;

/** 漫画信息 */
export interface ComicInfo {
    /** 文件路径 */
    path: string;
    /** 文件名 */
    name: string;
    /** 漫画格式 */
    format: ComicFormat;
    /** 总页数 */
    pageCount: number;
    /** 文件大小（字节） */
    fileSize: number;
    /** 最后修改时间戳 */
    lastModified: number;
}

/** 页面信息 */
export interface PageInfo {
    /** 页面索引 */
    index: number;
    /** 文件名 */
    filename: string;
    /** 图片宽度 */
    width?: number;
    /** 图片高度 */
    height?: number;
}

/** 漫画数据（解析后的完整数据） */
export interface ComicData {
    /** 漫画信息 */
    info: ComicInfo;
    /** 页面列表 */
    pages: PageInfo[];
}

/** 漫画文件信息（用于漫画库列表） */
export interface MangaFileInfo {
    /** 文件名 */
    name: string;
    /** 文件路径 */
    path: string;
    /** 文件大小（字节） */
    size: number;
    /** 修改时间戳 */
    mtime: number;
}

export function getComicSourceKey(source: ComicSource): string {
    return source.kind === 'vault' ? source.path : source.fileName;
}

export function canReopenComicSource(source: ComicSource | undefined): source is VaultComicSource {
    return source?.kind === 'vault';
}

/** 根据文件扩展名获取漫画格式 */
export function getComicFormat(filename: string): ComicFormat | null {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
        case 'zip':
            return 'zip';
        case 'cbz':
            return 'cbz';
        case 'cbr':
            return 'cbr';
        case 'pdf':
            return 'pdf';
        default:
            return null;
    }
}

/** 支持的图片格式 */
export const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

/** 检查文件是否为支持的图片格式 */
export function isSupportedImage(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ext ? SUPPORTED_IMAGE_EXTENSIONS.includes(ext) : false;
}
