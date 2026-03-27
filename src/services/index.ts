/**
 * 服务层统一导出
 */

// 文件服务
export { FileService } from './file-service';
export { ComicSourceService } from './comic-source-service';

// 存储服务
export { StorageService } from './storage-service';

// 历史记录服务
export { HistoryService } from './history-service';

// 图片服务
export { ImageService } from './image-service';

// 漫画解析器
export { BaseComicParser } from './comic-parser/base-parser';
export { ZipParser } from './comic-parser/zip-parser';
export {
    ComicParserFactory,
    getComicParser,
    isComicSupported,
    getSupportedComicExtensions
} from './comic-parser/index';
