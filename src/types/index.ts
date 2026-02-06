/**
 * 类型定义统一导出
 */

// 漫画相关类型
export type {
    ComicFormat,
    ComicInfo,
    PageInfo,
    ComicData,
    MangaFileInfo
} from './comic';

export {
    getComicFormat,
    isSupportedImage,
    SUPPORTED_IMAGE_EXTENSIONS
} from './comic';

// 阅读器相关类型
export type {
    ReadingMode,
    ReadingDirection,
    ZoomMode,
    ReaderState,
    Bookmark,
    ReadingProgress
} from './reader';

export {
    DEFAULT_READER_STATE,
    calculateProgressPercentage
} from './reader';

// 设置相关类型
export type {
    Language,
    ThumbnailSize,
    Settings
} from './settings';

export {
    DEFAULT_SETTINGS,
    THUMBNAIL_SIZE_MAP,
    getThumbnailPixelSize
} from './settings';

// 历史记录相关类型
export type {
    HistoryItem
} from './history';

export {
    createHistoryItem,
    updateHistoryProgress
} from './history';

// 全局类型扩展
declare global {
    interface Window {
        showOpenFilePicker(options?: {
            types?: {
                description: string;
                accept: Record<string, string[]>;
            }[];
            excludeAcceptAllOption?: boolean;
            multiple?: boolean;
        }): Promise<FileSystemFileHandle[]>;
    }
}
