import { Setting } from 'obsidian';
import type ComicReaderPlugin from '../main';
import type { PluginModule } from '../core/types';
import { t } from '../i18n/locale';
import { bookmarkModuleI18n } from '../i18n/bookmarks/module';
import { bookmarkCommandsI18n } from '../i18n/bookmarks/commands';
import { bookmarkSettingsI18n } from '../i18n/bookmarks/settings';
import { BookmarkModal } from './bookmark-modal';

export class BookmarkModule implements PluginModule {
	readonly id = 'bookmarks';

	constructor(private readonly plugin: ComicReaderPlugin) {}

	get name(): string {
		return t(bookmarkModuleI18n, this.plugin.settings.ui.language).name;
	}

	get description(): string {
		return t(bookmarkModuleI18n, this.plugin.settings.ui.language).description;
	}

	onload(): void {
		const i18n = t(bookmarkCommandsI18n, this.plugin.settings.ui.language);

		this.plugin.addCommand({
			id: 'view-bookmarks',
			name: i18n.openBookmarks,
			callback: () => this.openBookmarkModal(),
		});
	}

	onunload(): void {}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(bookmarkSettingsI18n, this.plugin.settings.ui.language);

		new Setting(containerEl)
			.setName(i18n.total.name)
			.setDesc(i18n.total.desc.replace('{count}', String(this.plugin.getBookmarks().length)));

		new Setting(containerEl)
			.setName(i18n.clearBookmarks.name)
			.setDesc(i18n.clearBookmarks.desc)
			.addButton((button) =>
				button
					.setButtonText(i18n.clearBookmarks.button)
					.setWarning()
					.onClick(async () => {
						await this.plugin.clearBookmarks();
					}),
			);
	}

	openBookmarkModal(): void {
		new BookmarkModal(
			this.plugin.app,
			this.plugin.settings.ui.language,
			this.plugin.getBookmarks(),
			(bookmarkId) => this.plugin.deleteBookmark(bookmarkId),
			(bookmarkId) => this.plugin.openBookmark(bookmarkId),
		).open();
	}
}
