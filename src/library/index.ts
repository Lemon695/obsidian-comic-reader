import { Setting } from 'obsidian';
import type ComicReaderPlugin from '../main';
import type { PluginModule } from '../core/types';
import { MANGA_LIBRARY_VIEW_TYPE } from '../constants';
import { MangaLibraryView } from '../views/library/manga-library-view';
import { t } from '../i18n/locale';
import { libraryModuleI18n } from '../i18n/library/module';
import { libraryCommandsI18n } from '../i18n/library/commands';
import { librarySettingsI18n } from '../i18n/library/settings';

export class LibraryModule implements PluginModule {
	readonly id = 'library';

	constructor(private readonly plugin: ComicReaderPlugin) {}

	get name(): string {
		return t(libraryModuleI18n, this.plugin.settings.ui.language).name;
	}

	get description(): string {
		return t(libraryModuleI18n, this.plugin.settings.ui.language).description;
	}

	onload(): void {
		const i18n = t(libraryCommandsI18n, this.plugin.settings.ui.language);

		this.plugin.registerView(
			MANGA_LIBRARY_VIEW_TYPE,
			(leaf) => new MangaLibraryView(leaf, this.plugin),
		);

		this.plugin.addCommand({
			id: 'open-comic-library',
			name: i18n.openLibrary,
			callback: () => this.openLibraryView(),
		});

		this.plugin.addRibbonIcon('library', i18n.ribbonTooltip, () => this.openLibraryView());
	}

	onunload(): void {
		this.plugin.app.workspace.detachLeavesOfType(MANGA_LIBRARY_VIEW_TYPE);
	}

	renderSettings(containerEl: HTMLElement): void {
		const i18n = t(librarySettingsI18n, this.plugin.settings.ui.language);

		new Setting(containerEl)
			.setName(i18n.libraryFolders.name)
			.setDesc(i18n.libraryFolders.desc)
			.addText((text) =>
				text
					.setPlaceholder('/')
					.setValue(this.plugin.settings.library.libraryFolders.join(', '))
					.onChange(async (value) => {
						const folders = value
							.split(',')
							.map((folder) => folder.trim())
							.filter(Boolean);
						this.plugin.settings.library.libraryFolders = folders.length > 0 ? folders : ['/'];
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(i18n.scanSubfolders.name)
			.setDesc(i18n.scanSubfolders.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.library.scanSubfolders)
					.onChange(async (value) => {
						this.plugin.settings.library.scanSubfolders = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(i18n.showHiddenFiles.name)
			.setDesc(i18n.showHiddenFiles.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.library.showHiddenFiles)
					.onChange(async (value) => {
						this.plugin.settings.library.showHiddenFiles = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	private async openLibraryView(): Promise<void> {
		const leaf = this.plugin.app.workspace.getLeaf(true);
		await leaf.setViewState({ type: MANGA_LIBRARY_VIEW_TYPE });
		this.plugin.app.workspace.revealLeaf(leaf);
	}
}
