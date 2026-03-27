import { App, PluginSettingTab, Setting } from 'obsidian';
import type ComicReaderPlugin from '../main';
import { t } from '../i18n/locale';
import { settingsTabI18n } from '../i18n/core/settings-tab';
import type { SettingsTabI18n } from '../i18n/core/settings-tab';

export class ComicSettingsTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: ComicReaderPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const i18n = t(settingsTabI18n, this.plugin.settings.ui.language);
		containerEl.createEl('h2', { text: i18n.heading });
		containerEl.createEl('p', { text: i18n.intro, cls: 'comic-settings-intro' });

		this.renderGeneralSettings(containerEl, i18n);

		for (const module of this.plugin.moduleManager.getAll()) {
			this.renderModuleSection(containerEl, module.id);
		}
	}

	private renderGeneralSettings(containerEl: HTMLElement, i18n: SettingsTabI18n): void {
		containerEl.createEl('h3', { text: i18n.generalHeading });

		new Setting(containerEl)
			.setName(i18n.language.name)
			.setDesc(i18n.language.desc)
			.addDropdown((drop) =>
				drop
					.addOption('auto', i18n.languageAuto)
					.addOption('zh-CN', i18n.languageZhCn)
					.addOption('en', i18n.languageEn)
					.setValue(this.plugin.settings.ui.language)
					.onChange(async (value) => {
						this.plugin.settings.ui.language = value as 'auto' | 'zh-CN' | 'en';
						await this.plugin.saveSettings();
							this.display();
						}),
			);
	}

	private renderModuleSection(containerEl: HTMLElement, moduleId: string): void {
		const module = this.plugin.moduleManager.get(moduleId);
		if (!module) return;

		const sectionEl = containerEl.createDiv({ cls: 'comic-module-section' });
		new Setting(sectionEl)
			.setName(module.name)
			.setDesc(module.description)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.moduleManager.isEnabled(module.id))
					.onChange(async (enabled) => {
						if (enabled) {
							await this.plugin.moduleManager.enableModule(module.id);
						} else {
							await this.plugin.moduleManager.disableModule(module.id);
						}
						this.display();
					}),
			);

		if (this.plugin.moduleManager.isEnabled(module.id) && module.renderSettings) {
			const settingsEl = sectionEl.createDiv({ cls: 'comic-module-settings' });
			module.renderSettings(settingsEl);
		}
	}
}
