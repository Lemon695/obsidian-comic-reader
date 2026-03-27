/**
 * 设置标签页
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import type MangaReaderPlugin from '../../main';
import type { ReadingMode, ThumbnailSize, Language } from '../../types';

/**
 * 插件设置标签页
 */
export class SettingsTab extends PluginSettingTab {
    plugin: MangaReaderPlugin;

    constructor(app: App, plugin: MangaReaderPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h1', { text: 'Comic Reader 设置' });

        // 阅读设置
        this.addReadingSettings(containerEl);

        // 漫画库设置
        this.addLibrarySettings(containerEl);

        // 历史记录设置
        this.addHistorySettings(containerEl);

        // 界面设置
        this.addUISettings(containerEl);

        // 性能设置
        this.addPerformanceSettings(containerEl);
    }

    /**
     * 阅读设置
     */
    private addReadingSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: '阅读设置' });

        const settings = this.plugin.getSettings();

        new Setting(containerEl)
            .setName('默认阅读模式')
            .setDesc('打开漫画时的默认阅读模式')
            .addDropdown(dropdown => dropdown
                .addOption('single', '单页模式')
                .addOption('double', '双页模式')
                .addOption('webtoon', '韩漫模式')
                .setValue(settings.defaultMode)
                .onChange(async (value) => {
                    await this.plugin.updateSettings({
                        defaultMode: value as ReadingMode
                    });
                }));

        new Setting(containerEl)
            .setName('默认阅读方向')
            .setDesc('翻页方向（日漫通常从右到左）')
            .addDropdown(dropdown => dropdown
                .addOption('ltr', '从左到右')
                .addOption('rtl', '从右到左')
                .setValue(settings.defaultDirection)
                .onChange(async (value) => {
                    await this.plugin.updateSettings({
                        defaultDirection: value as 'ltr' | 'rtl'
                    });
                }));

        new Setting(containerEl)
            .setName('自动保存阅读进度')
            .setDesc('自动记住每本漫画的阅读位置')
            .addToggle(toggle => toggle
                .setValue(settings.autoSaveProgress)
                .onChange(async (value) => {
                    await this.plugin.updateSettings({
                        autoSaveProgress: value
                    });
                }));

        new Setting(containerEl)
            .setName('预加载页数')
            .setDesc('提前加载当前页前后的页数')
            .addSlider(slider => slider
                .setLimits(0, 10, 1)
                .setValue(settings.preloadPages)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await this.plugin.updateSettings({
                        preloadPages: value
                    });
                }));
    }

    /**
     * 漫画库设置
     */
    private addLibrarySettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: '漫画库设置' });

        const settings = this.plugin.getSettings();

        new Setting(containerEl)
            .setName('漫画库文件夹')
            .setDesc('扫描漫画文件的文件夹路径（多个路径用逗号分隔）')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(settings.libraryFolders.join(', '))
                .onChange(async (value) => {
                    const folders = value.split(',').map(f => f.trim()).filter(f => f);
                    await this.plugin.updateSettings({
                        libraryFolders: folders.length > 0 ? folders : ['/']
                    });
                }));

        new Setting(containerEl)
            .setName('扫描子文件夹')
            .setDesc('是否递归扫描子文件夹中的漫画')
            .addToggle(toggle => toggle
                .setValue(settings.scanSubfolders)
                .onChange(async (value) => {
                    await this.plugin.updateSettings({
                        scanSubfolders: value
                    });
                }));
    }

    /**
     * 历史记录设置
     */
    private addHistorySettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: '历史记录设置' });

        const settings = this.plugin.getSettings();

        new Setting(containerEl)
            .setName('最大历史记录数')
            .setDesc('保存的最大历史记录数量')
            .addSlider(slider => slider
                .setLimits(10, 200, 10)
                .setValue(settings.maxHistoryItems)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await this.plugin.updateSettings({
                        maxHistoryItems: value
                    });
                }));

        new Setting(containerEl)
            .setName('清除历史记录')
            .setDesc('删除所有阅读历史记录')
            .addButton(button => button
                .setButtonText('清除')
                .setWarning()
                .onClick(async () => {
                    await this.plugin.clearHistory();
                }));
    }

    /**
     * 界面设置
     */
    private addUISettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: '界面设置' });

        const settings = this.plugin.getSettings();

        new Setting(containerEl)
            .setName('显示缩略图栏')
            .setDesc('在阅读器底部显示缩略图导航栏')
            .addToggle(toggle => toggle
                .setValue(settings.showThumbnailBar)
                .onChange(async (value) => {
                    await this.plugin.updateSettings({
                        showThumbnailBar: value
                    });
                }));

        new Setting(containerEl)
            .setName('缩略图大小')
            .setDesc('缩略图的显示大小')
            .addDropdown(dropdown => dropdown
                .addOption('small', '小')
                .addOption('medium', '中')
                .addOption('large', '大')
                .setValue(settings.thumbnailSize)
                .onChange(async (value) => {
                    await this.plugin.updateSettings({
                        thumbnailSize: value as ThumbnailSize
                    });
                }));

        new Setting(containerEl)
            .setName('显示页码')
            .setDesc('在工具栏显示当前页码')
            .addToggle(toggle => toggle
                .setValue(settings.showPageNumber)
                .onChange(async (value) => {
                    await this.plugin.updateSettings({
                        showPageNumber: value
                    });
                }));

        new Setting(containerEl)
            .setName('界面语言')
            .setDesc('插件界面语言')
            .addDropdown(dropdown => dropdown
                .addOption('auto', '跟随系统')
                .addOption('zh-CN', '简体中文')
                .addOption('en', 'English')
                .setValue(settings.language)
                .onChange(async (value) => {
                    await this.plugin.updateSettings({
                        language: value as Language
                    });
                }));
    }

    /**
     * 性能设置
     */
    private addPerformanceSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: '性能设置' });

        const settings = this.plugin.getSettings();

        new Setting(containerEl)
            .setName('最大缓存大小')
            .setDesc('图片缓存的最大大小（MB）')
            .addSlider(slider => slider
                .setLimits(50, 500, 50)
                .setValue(settings.maxCacheSize)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await this.plugin.updateSettings({
                        maxCacheSize: value
                    });
                }));
    }
}
