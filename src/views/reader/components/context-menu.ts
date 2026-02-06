/**
 * 右键菜单组件
 */

import { Menu } from 'obsidian';

export interface ContextMenuItem {
    title: string;
    icon?: string;
    onClick: () => void;
    disabled?: boolean;
}

/**
 * 右键菜单组件
 */
export class ContextMenu {
    private items: ContextMenuItem[] = [];

    /**
     * 添加菜单项
     */
    addItem(item: ContextMenuItem): this {
        this.items.push(item);
        return this;
    }

    /**
     * 添加分隔符
     */
    addSeparator(): this {
        this.items.push({
            title: '---',
            onClick: () => {}
        });
        return this;
    }

    /**
     * 清空菜单项
     */
    clear(): this {
        this.items = [];
        return this;
    }

    /**
     * 显示菜单
     */
    show(event: MouseEvent): void {
        const menu = new Menu();

        for (const item of this.items) {
            if (item.title === '---') {
                menu.addSeparator();
            } else {
                menu.addItem((menuItem) => {
                    menuItem.setTitle(item.title);
                    if (item.icon) {
                        menuItem.setIcon(item.icon);
                    }
                    if (item.disabled) {
                        menuItem.setDisabled(true);
                    }
                    menuItem.onClick(item.onClick);
                });
            }
        }

        menu.showAtPosition({ x: event.x, y: event.y });
    }

    /**
     * 创建默认的阅读器右键菜单
     */
    static createReaderMenu(options: {
        onCopyImage?: () => void;
        onAddBookmark?: () => void;
        onToggleFullscreen?: () => void;
        onZoomIn?: () => void;
        onZoomOut?: () => void;
        onResetZoom?: () => void;
    }): ContextMenu {
        const menu = new ContextMenu();

        if (options.onCopyImage) {
            menu.addItem({
                title: '复制图片',
                icon: 'copy',
                onClick: options.onCopyImage
            });
        }

        if (options.onAddBookmark) {
            menu.addItem({
                title: '添加书签',
                icon: 'bookmark',
                onClick: options.onAddBookmark
            });
        }

        if (options.onCopyImage || options.onAddBookmark) {
            menu.addSeparator();
        }

        if (options.onZoomIn) {
            menu.addItem({
                title: '放大',
                icon: 'zoom-in',
                onClick: options.onZoomIn
            });
        }

        if (options.onZoomOut) {
            menu.addItem({
                title: '缩小',
                icon: 'zoom-out',
                onClick: options.onZoomOut
            });
        }

        if (options.onResetZoom) {
            menu.addItem({
                title: '重置缩放',
                icon: 'maximize',
                onClick: options.onResetZoom
            });
        }

        if (options.onToggleFullscreen) {
            menu.addSeparator();
            menu.addItem({
                title: '全屏',
                icon: 'maximize-2',
                onClick: options.onToggleFullscreen
            });
        }

        return menu;
    }
}
