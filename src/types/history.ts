/**
 * 历史记录相关类型定义
 */

/** 历史记录项 */
export interface HistoryItem {
    /** 唯一标识 */
    id: string;
    /** 文件路径 */
    path: string;
    /** 文件名 */
    fileName: string;
    /** 最后打开时间戳 */
    lastOpened: number;
    /** 最后阅读页码 */
    lastPage?: number;
    /** 总页数 */
    totalPages?: number;
    /** 文件来源类型 */
    sourceType: 'vault' | 'external';
    /** 文件句柄（仅外部文件） */
    fileHandle?: FileSystemFileHandle;
}

/** 创建历史记录项 */
export function createHistoryItem(
    path: string,
    fileName: string,
    sourceType: 'vault' | 'external',
    fileHandle?: FileSystemFileHandle
): HistoryItem {
    return {
        id: generateHistoryId(),
        path,
        fileName,
        lastOpened: Date.now(),
        sourceType,
        fileHandle
    };
}

/** 生成历史记录ID */
function generateHistoryId(): string {
    return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** 更新历史记录项的阅读进度 */
export function updateHistoryProgress(
    item: HistoryItem,
    lastPage: number,
    totalPages: number
): HistoryItem {
    return {
        ...item,
        lastOpened: Date.now(),
        lastPage,
        totalPages
    };
}
