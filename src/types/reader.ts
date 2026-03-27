/**
 * 阅读器相关类型定义
 */

import type { ComicInfo, ComicSource } from './comic';

/** 阅读模式 */
export type ReadingMode = 'single' | 'double' | 'webtoon';

/** 阅读方向 */
export type ReadingDirection = 'ltr' | 'rtl';

/** 缩放模式 */
export type ZoomMode = 'fit-width' | 'fit-height' | 'fit-page' | 'original' | 'custom';

/** 阅读器状态 */
export interface ReaderState {
    /** 当前漫画信息 */
    comic: ComicInfo | null;
    /** 当前页码（从0开始） */
    currentPage: number;
    /** 阅读模式 */
    mode: ReadingMode;
    /** 阅读方向 */
    direction: ReadingDirection;
    /** 缩放级别（百分比） */
    zoom: number;
    /** 缩放模式 */
    zoomMode: ZoomMode;
    /** 是否全屏 */
    isFullscreen: boolean;
    /** 是否正在加载 */
    isLoading: boolean;
}

/** 默认阅读器状态 */
export const DEFAULT_READER_STATE: ReaderState = {
    comic: null,
    currentPage: 0,
    mode: 'single',
    direction: 'ltr',
    zoom: 100,
    zoomMode: 'fit-page',
    isFullscreen: false,
    isLoading: false
};

/** 书签 */
export interface Bookmark {
    /** 书签ID */
    id: string;
    /** 漫画路径 */
    comicPath: string;
    /** 漫画名称 */
    comicName: string;
    /** 页码索引 */
    pageIndex: number;
    /** 创建时间戳 */
    createdAt: number;
    /** 备注 */
    note?: string;
    /** 缩略图（Base64） */
    thumbnail?: string;
    /** 漫画来源 */
    source?: ComicSource;
}

/** 阅读进度 */
export interface ReadingProgress {
    /** 漫画路径 */
    comicPath: string;
    /** 漫画名称 */
    comicName: string;
    /** 最后阅读页码 */
    lastPage: number;
    /** 总页数 */
    totalPages: number;
    /** 最后阅读时间戳 */
    lastReadAt: number;
    /** 阅读进度百分比 */
    percentage: number;
}

/** 计算阅读进度百分比 */
export function calculateProgressPercentage(currentPage: number, totalPages: number): number {
    if (totalPages <= 0) return 0;
    return Math.round(((currentPage + 1) / totalPages) * 100);
}
