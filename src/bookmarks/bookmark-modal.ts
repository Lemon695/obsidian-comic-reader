import { App, Modal, Notice } from 'obsidian';
import type { Bookmark } from '../types/reader';
import type { Language } from '../types/settings';
import { t } from '../i18n/locale';
import { bookmarkModalI18n } from '../i18n/bookmarks/modal';
import { canReopenComicSource } from '../types/comic';

export class BookmarkModal extends Modal {
	constructor(
		app: App,
		private readonly language: Language,
		private readonly bookmarks: Bookmark[],
		private readonly onDelete: (bookmarkId: string) => Promise<void>,
		private readonly onOpenBookmark: (bookmarkId: string) => Promise<boolean>,
	) {
		super(app);
	}

	onOpen(): void {
		const i18n = t(bookmarkModalI18n, this.language);
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h2', { text: i18n.modalTitle });

		if (this.bookmarks.length === 0) {
			contentEl.createEl('p', { text: i18n.empty, cls: 'comic-bookmark-empty' });
			return;
		}

		const list = contentEl.createEl('ul', { cls: 'comic-bookmark-list' });
		for (const bookmark of this.bookmarks) {
			this.renderBookmark(list, bookmark, i18n);
		}
	}

	private renderBookmark(
		list: HTMLElement,
		bookmark: Bookmark,
		i18n: ReturnType<typeof t<typeof bookmarkModalI18n['en']>>,
	): void {
		const li = list.createEl('li', { cls: 'comic-bookmark-item' });
		const info = li.createEl('div', { cls: 'comic-bookmark-info' });
		info.createEl('span', { text: bookmark.comicName, cls: 'comic-bookmark-filename' });

		const meta = info.createEl('div', { cls: 'comic-bookmark-meta' });
		meta.createEl('span', {
			text: i18n.pageLabel.replace('{page}', String(bookmark.pageIndex + 1)),
			cls: 'comic-bookmark-page',
		});
		meta.createEl('span', {
			text: `${i18n.createdAtLabel}: ${new Date(bookmark.createdAt).toLocaleString()}`,
			cls: 'comic-bookmark-date',
		});

		if (bookmark.note) {
			meta.createEl('span', { text: bookmark.note, cls: 'comic-bookmark-note' });
		}

		const actions = li.createEl('div', { cls: 'comic-bookmark-actions' });

		if (canReopenComicSource(bookmark.source)) {
			const openBtn = actions.createEl('button', { text: i18n.openEntry, cls: 'comic-bookmark-btn' });
			openBtn.addEventListener('click', async () => {
				await this.onOpenBookmark(bookmark.id);
				this.close();
			});
		}

		const copyBtn = actions.createEl('button', { text: i18n.copyFileName, cls: 'comic-bookmark-btn' });
		copyBtn.addEventListener('click', async () => {
			await navigator.clipboard.writeText(bookmark.comicName);
			new Notice(i18n.fileNameCopied);
		});

		const deleteBtn = actions.createEl('button', { text: i18n.deleteEntry, cls: 'comic-bookmark-btn mod-warning' });
		deleteBtn.addEventListener('click', async () => {
			await this.onDelete(bookmark.id);
			li.remove();
			if (list.children.length === 0) {
				list.replaceWith(this.contentEl.createEl('p', { text: i18n.empty, cls: 'comic-bookmark-empty' }));
			}
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
