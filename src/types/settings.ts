/**
 * 设置相关类型定义
 */

import type { ReadingMode, ReadingDirection } from './reader';

/** 支持的语言 */
export type Language = 'zh-CN' | 'en' | 'auto';

/** 缩略图大小 */
export type ThumbnailSize = 'small' | 'medium' | 'large';

/** 插件设置 */
export interface Settings {
    // ===== 阅读设置 =====
    /** 默认阅读模式 */
    defaultMode: ReadingMode;
    /** 默认阅读方向 */
    defaultDirection: ReadingDirection;
    /** 默认缩放级别（百分比） */
    defaultZoom: number;
    /** 是否自动保存阅读进度 */
    autoSaveProgress: boolean;
    /** 预加载页数 */
    preloadPages: number;
    /** 是否记住每本漫画的阅读模式 */
    rememberModePerComic: boolean;

    // ===== 漫画库设置 =====
    /** 漫画库文件夹路径列表 */
    libraryFolders: string[];
    /** 是否扫描子文件夹 */
    scanSubfolders: boolean;
    /** 是否显示隐藏文件 */
    showHiddenFiles: boolean;

    // ===== 历史记录设置 =====
    /** 最大历史记录数量 */
    maxHistoryItems: number;
    /** 是否在退出时清除历史记录 */
    clearHistoryOnExit: boolean;

    // ===== 界面设置 =====
    /** 是否显示缩略图栏 */
    showThumbnailBar: boolean;
    /** 缩略图大小 */
    thumbnailSize: ThumbnailSize;
    /** 是否显示页码 */
    showPageNumber: boolean;
    /** 是否显示工具栏 */
    showToolbar: boolean;
    /** 界面语言 */
    language: Language;

    // ===== 性能设置 =====
    /** 最大缓存大小（MB） */
    maxCacheSize: number;
    /** 是否启用硬件加速 */
    enableHardwareAcceleration: boolean;
}

/** 默认设置 */
export const DEFAULT_SETTINGS: Settings = {
    // 阅读设置
    defaultMode: 'single',
    defaultDirection: 'ltr',
    defaultZoom: 100,
    autoSaveProgress: true,
    preloadPages: 3,
    rememberModePerComic: false,

    // 漫画库设置
    libraryFolders: ['/'],
    scanSubfolders: true,
    showHiddenFiles: false,

    // 历史记录设置
    maxHistoryItems: 50,
    clearHistoryOnExit: false,

    // 界面设置
    showThumbnailBar: true,
    thumbnailSize: 'medium',
    showPageNumber: true,
    showToolbar: true,
    language: 'auto',

    // 性能设置
    maxCacheSize: 100,
    enableHardwareAcceleration: true
};

/** 缩略图大小映射（像素） */
export const THUMBNAIL_SIZE_MAP: Record<ThumbnailSize, number> = {
    small: 60,
    medium: 80,
    large: 100
};

/** 获取缩略图像素大小 */
export function getThumbnailPixelSize(size: ThumbnailSize): number {
    return THUMBNAIL_SIZE_MAP[size];
}
