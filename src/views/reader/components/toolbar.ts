/**
 * 工具栏组件
 */

import { setIcon } from 'obsidian';
import type { ReadingMode } from '../../../types';

export interface ToolbarButton {
    id: string;
    icon: string;
    tooltip: string;
    onClick: () => void;
}

export interface ToolbarOptions {
    showPageInfo: boolean;
    showModeSwitch: boolean;
    showZoomControls: boolean;
}

const DEFAULT_OPTIONS: ToolbarOptions = {
    showPageInfo: true,
    showModeSwitch: true,
    showZoomControls: true
};

/**
 * 工具栏组件
 */
export class Toolbar {
    private container: HTMLElement;
    private options: ToolbarOptions;
    private buttons: Map<string, HTMLButtonElement> = new Map();
    private pageInfoEl: HTMLElement | null = null;
    private modeSwitchEl: HTMLButtonElement | null = null;
    private zoomInfoEl: HTMLElement | null = null;
    private currentMode: ReadingMode = 'single';
    private currentZoom = 100;
    private onModeChangeCallback: ((mode: ReadingMode) => void) | null = null;
    private onZoomChangeCallback: ((zoom: number) => void) | null = null;

    constructor(container: HTMLElement, options: Partial<ToolbarOptions> = {}) {
        this.container = container;
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.setupUI();
    }

    /**
     * 设置 UI
     */
    private setupUI(): void {
        this.container.addClass('manga-toolbar');

        // 左侧按钮区域
        const leftSection = this.container.createEl('div', {
            cls: 'toolbar-section toolbar-left'
        });

        // 添加缩放控制到左侧
        if (this.options.showZoomControls) {
            this.setupZoomControls(leftSection);
        }

        // 中间信息区域
        if (this.options.showPageInfo) {
            const centerSection = this.container.createEl('div', {
                cls: 'toolbar-section toolbar-center'
            });
            this.pageInfoEl = centerSection.createEl('span', {
                cls: 'toolbar-page-info'
            });
        }

        // 右侧按钮区域
        const rightSection = this.container.createEl('div', {
            cls: 'toolbar-section toolbar-right'
        });

        // 模式切换按钮
        if (this.options.showModeSwitch) {
            this.modeSwitchEl = rightSection.createEl('button', {
                cls: 'toolbar-button mode-switch-button',
                attr: { 'aria-label': '切换阅读模式' }
            });
            this.updateModeSwitchButton();

            this.modeSwitchEl.addEventListener('click', () => {
                this.cycleMode();
            });
        }
    }

    /**
     * 设置缩放控制
     */
    private setupZoomControls(container: HTMLElement): void {
        // 缩小按钮
        const zoomOutBtn = container.createEl('button', {
            cls: 'toolbar-button zoom-button',
            attr: { 'aria-label': '缩小 (-)' }
        });
        setIcon(zoomOutBtn, 'minus');
        zoomOutBtn.addEventListener('click', () => {
            this.zoomOut();
        });
        this.buttons.set('zoom-out', zoomOutBtn);

        // 缩放比例显示
        this.zoomInfoEl = container.createEl('span', {
            cls: 'toolbar-zoom-info',
            text: '100%'
        });

        // 点击缩放比例重置为100%
        this.zoomInfoEl.addEventListener('click', () => {
            this.setZoom(100);
        });

        // 放大按钮
        const zoomInBtn = container.createEl('button', {
            cls: 'toolbar-button zoom-button',
            attr: { 'aria-label': '放大 (+)' }
        });
        setIcon(zoomInBtn, 'plus');
        zoomInBtn.addEventListener('click', () => {
            this.zoomIn();
        });
        this.buttons.set('zoom-in', zoomInBtn);

        // 分隔符
        container.createEl('div', { cls: 'toolbar-separator' });
    }

    /**
     * 放大
     */
    zoomIn(): void {
        const newZoom = Math.min(this.currentZoom + 10, 300);
        this.setZoom(newZoom);
    }

    /**
     * 缩小
     */
    zoomOut(): void {
        const newZoom = Math.max(this.currentZoom - 10, 30);
        this.setZoom(newZoom);
    }

    /**
     * 设置缩放比例（由按钮点击触发，会通知外部）
     */
    setZoom(zoom: number): void {
        this.currentZoom = zoom;
        this.updateZoomInfo();

        if (this.onZoomChangeCallback) {
            this.onZoomChangeCallback(zoom);
        }
    }

    /**
     * 仅更新缩放显示（由外部调用，不触发回调，避免循环）
     */
    updateZoomDisplay(zoom: number): void {
        this.currentZoom = zoom;
        this.updateZoomInfo();
    }

    /**
     * 获取当前缩放比例
     */
    getZoom(): number {
        return this.currentZoom;
    }

    /**
     * 更新缩放信息显示
     */
    private updateZoomInfo(): void {
        if (this.zoomInfoEl) {
            this.zoomInfoEl.textContent = `${this.currentZoom}%`;
        }
    }

    /**
     * 设置缩放变化回调
     */
    onZoomChange(callback: (zoom: number) => void): void {
        this.onZoomChangeCallback = callback;
    }

    /**
     * 添加按钮
     */
    addButton(button: ToolbarButton, position: 'left' | 'right' = 'left'): void {
        const section = this.container.querySelector(`.toolbar-${position}`);
        if (!section) return;

        const btn = section.createEl('button', {
            cls: 'toolbar-button',
            attr: {
                'aria-label': button.tooltip,
                'data-button-id': button.id
            }
        });

        setIcon(btn, button.icon);
        btn.addEventListener('click', button.onClick);

        this.buttons.set(button.id, btn);
    }

    /**
     * 移除按钮
     */
    removeButton(id: string): void {
        const btn = this.buttons.get(id);
        if (btn) {
            btn.remove();
            this.buttons.delete(id);
        }
    }

    /**
     * 添加分隔符
     */
    addSeparator(position: 'left' | 'right' = 'left'): void {
        const section = this.container.querySelector(`.toolbar-${position}`);
        if (!section) return;

        section.createEl('div', { cls: 'toolbar-separator' });
    }

    /**
     * 设置页码信息
     */
    setPageInfo(current: number, total: number): void {
        if (this.pageInfoEl) {
            this.pageInfoEl.textContent = `${current + 1} / ${total}`;
        }
    }

    /**
     * 设置当前模式
     */
    setMode(mode: ReadingMode): void {
        this.currentMode = mode;
        this.updateModeSwitchButton();
    }

    /**
     * 设置模式切换回调
     */
    onModeChange(callback: (mode: ReadingMode) => void): void {
        this.onModeChangeCallback = callback;
    }

    /**
     * 循环切换模式
     */
    private cycleMode(): void {
        const modes: ReadingMode[] = ['single', 'double', 'webtoon'];
        const currentIndex = modes.indexOf(this.currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.currentMode = modes[nextIndex];

        this.updateModeSwitchButton();

        if (this.onModeChangeCallback) {
            this.onModeChangeCallback(this.currentMode);
        }
    }

    /**
     * 更新模式切换按钮
     */
    private updateModeSwitchButton(): void {
        if (!this.modeSwitchEl) return;

        const modeInfo: Record<ReadingMode, { icon: string; text: string }> = {
            single: { icon: 'file', text: '单页' },
            double: { icon: 'book-open', text: '双页' },
            webtoon: { icon: 'scroll', text: '韩漫' }
        };

        const info = modeInfo[this.currentMode];
        this.modeSwitchEl.empty();
        setIcon(this.modeSwitchEl, info.icon);
        this.modeSwitchEl.createSpan({ text: ` ${info.text}` });
    }

    /**
     * 启用/禁用按钮
     */
    setButtonEnabled(id: string, enabled: boolean): void {
        const btn = this.buttons.get(id);
        if (btn) {
            btn.disabled = !enabled;
        }
    }

    /**
     * 显示工具栏
     */
    show(): void {
        this.container.removeClass('hidden');
    }

    /**
     * 隐藏工具栏
     */
    hide(): void {
        this.container.addClass('hidden');
    }

    /**
     * 销毁组件
     */
    dispose(): void {
        this.buttons.clear();
        this.onModeChangeCallback = null;
        this.onZoomChangeCallback = null;
    }
}
