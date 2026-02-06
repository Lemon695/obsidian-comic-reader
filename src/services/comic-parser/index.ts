/**
 * 漫画解析器工厂
 *
 * 根据文件类型选择合适的解析器
 */

import { BaseComicParser } from './base-parser';
import { ZipParser } from './zip-parser';

/**
 * 解析器工厂类
 */
export class ComicParserFactory {
    private parsers: BaseComicParser[] = [];
    private static instance: ComicParserFactory | null = null;

    private constructor() {
        // 注册默认解析器
        this.register(new ZipParser());
    }

    /**
     * 获取工厂单例
     */
    static getInstance(): ComicParserFactory {
        if (!ComicParserFactory.instance) {
            ComicParserFactory.instance = new ComicParserFactory();
        }
        return ComicParserFactory.instance;
    }

    /**
     * 重置工厂（主要用于测试）
     */
    static reset(): void {
        if (ComicParserFactory.instance) {
            ComicParserFactory.instance.dispose();
            ComicParserFactory.instance = null;
        }
    }

    /**
     * 注册解析器
     */
    register(parser: BaseComicParser): void {
        // 检查是否已注册相同类型的解析器
        const existingIndex = this.parsers.findIndex(
            p => p.name === parser.name
        );

        if (existingIndex >= 0) {
            // 替换现有解析器
            this.parsers[existingIndex].dispose();
            this.parsers[existingIndex] = parser;
        } else {
            this.parsers.push(parser);
        }
    }

    /**
     * 注销解析器
     */
    unregister(parserName: string): void {
        const index = this.parsers.findIndex(p => p.name === parserName);
        if (index >= 0) {
            this.parsers[index].dispose();
            this.parsers.splice(index, 1);
        }
    }

    /**
     * 获取适合指定文件的解析器
     */
    getParser(file: File): BaseComicParser | null {
        for (const parser of this.parsers) {
            if (parser.canParse(file)) {
                return parser;
            }
        }
        return null;
    }

    /**
     * 检查是否支持指定文件
     */
    isSupported(file: File): boolean {
        return this.getParser(file) !== null;
    }

    /**
     * 获取所有支持的扩展名
     */
    getSupportedExtensions(): string[] {
        const extensions = new Set<string>();
        for (const parser of this.parsers) {
            for (const ext of parser.supportedExtensions) {
                extensions.add(ext);
            }
        }
        return Array.from(extensions);
    }

    /**
     * 获取所有已注册的解析器
     */
    getParsers(): readonly BaseComicParser[] {
        return this.parsers;
    }

    /**
     * 释放所有解析器资源
     */
    dispose(): void {
        for (const parser of this.parsers) {
            parser.dispose();
        }
        this.parsers = [];
    }
}

// 导出便捷函数
export function getComicParser(file: File): BaseComicParser | null {
    return ComicParserFactory.getInstance().getParser(file);
}

export function isComicSupported(file: File): boolean {
    return ComicParserFactory.getInstance().isSupported(file);
}

export function getSupportedComicExtensions(): string[] {
    return ComicParserFactory.getInstance().getSupportedExtensions();
}
