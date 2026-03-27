import { Setting } from 'obsidian';
import type ComicReaderPlugin from '../main';
import type { PluginModule } from '../core/types';
import { t } from '../i18n/locale';
import { historyModuleI18n } from '../i18n/history/module';
import { historyCommandsI18n } from '../i18n/history/commands';
import { historySettingsI18n } from '../i18n/history/settings';
import { HistoryModal } from './history-modal';
import { getRecentHistory } from '../reader/parser';

export class HistoryModule implements PluginModule {
	readonly id = 'history';

	constructor(private readonly plugin: ComicReaderPlugin) {}

	get name(): string {
		return t(historyModuleI18n, this.plugin.settings.ui.language).name;
	}

	get description(): string {
		return t(historyModuleI18n, this.plugin.settings.ui.language).description;
	}

	onload(): void {
		const i18n = t(historyCommandsI18n, this.plugin.settings.ui.language);

		this.plugin.addCommand({
			id: 'view-reading-history',
			name: i18n.openHistory,
			callback: () => this.openHistoryModal(),
		});
	}

	onunload(): void {}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(historySettingsI18n, this.plugin.settings.ui.language);

		new Setting(containerEl)
			.setName(i18n.historyLimit.name)
			.setDesc(i18n.historyLimit.desc)
			.addSlider((slider) =>
				slider
					.setLimits(10, 200, 10)
					.setValue(this.plugin.settings.historyConfig.maxItems)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.historyConfig.maxItems = value;
						this.plugin.settings.history = this.plugin.pruneHistoryEntries(this.plugin.settings.history);
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(i18n.clearHistory.name)
			.setDesc(i18n.clearHistory.desc)
			.addButton((button) =>
				button
					.setButtonText(i18n.clearHistory.button)
					.setWarning()
					.onClick(async () => {
						await this.plugin.clearHistory();
					}),
			);
	}

	openHistoryModal(): void {
		const entries = getRecentHistory(
			this.plugin.settings.history,
			this.plugin.settings.historyConfig.maxItems,
		);

		new HistoryModal(
			this.plugin.app,
			this.plugin.settings.ui.language,
			entries,
			(entryKey) => this.plugin.deleteProgress(entryKey),
			(entryKey) => this.plugin.openHistoryEntry(entryKey),
		).open();
	}
}
