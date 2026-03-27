import { App, Modal, Notice } from 'obsidian';
import { t } from '../i18n/locale';
import type { Language } from '../types/settings';
import { historyModalI18n } from '../i18n/history/modal';
import type { HistoryEntry } from '../reader/parser';
import { canReopenComicSource } from '../types/comic';

export class HistoryModal extends Modal {
	constructor(
		app: App,
		private readonly language: Language,
		private readonly entries: HistoryEntry[],
		private readonly onDelete: (entryKey: string) => Promise<void>,
		private readonly onOpenEntry: (entryKey: string) => Promise<boolean>,
	) {
		super(app);
	}

	onOpen(): void {
		const i18n = t(historyModalI18n, this.language);
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h2', { text: i18n.modalTitle });

		if (this.entries.length === 0) {
			contentEl.createEl('p', { text: i18n.empty, cls: 'comic-history-empty' });
			return;
		}

		const list = contentEl.createEl('ul', { cls: 'comic-history-list' });
		for (const entry of this.entries) {
			this.renderEntry(list, entry, i18n);
		}
	}

	private renderEntry(
		list: HTMLElement,
		entry: HistoryEntry,
		i18n: ReturnType<typeof t<typeof historyModalI18n['en']>>,
	): void {
		const li = list.createEl('li', { cls: 'comic-history-item' });

		const info = li.createEl('div', { cls: 'comic-history-info' });
		info.createEl('span', { text: entry.fileName, cls: 'comic-history-filename' });

		const meta = info.createEl('div', { cls: 'comic-history-meta' });
		const percentText = i18n.percentLabel.replace('{percent}', String(entry.percent));
		meta.createEl('span', { text: percentText, cls: 'comic-history-percent' });
		const dateStr = new Date(entry.openedAt).toLocaleString();
		meta.createEl('span', { text: `${i18n.openedAtLabel}: ${dateStr}`, cls: 'comic-history-date' });

		const actions = li.createEl('div', { cls: 'comic-history-actions' });

		if (canReopenComicSource(entry.source)) {
			const openBtn = actions.createEl('button', { text: i18n.openEntry, cls: 'comic-history-btn' });
			openBtn.addEventListener('click', async () => {
				await this.onOpenEntry(entry.key);
				this.close();
			});
		}

		const copyBtn = actions.createEl('button', { text: i18n.copyFileName, cls: 'comic-history-btn' });
		copyBtn.addEventListener('click', async () => {
			await navigator.clipboard.writeText(entry.fileName);
			new Notice(i18n.fileNameCopied);
		});

		const deleteBtn = actions.createEl('button', { text: i18n.deleteEntry, cls: 'comic-history-btn mod-warning' });
		deleteBtn.addEventListener('click', async () => {
			await this.onDelete(entry.key);
			li.remove();
			if (list.children.length === 0) {
				list.replaceWith(this.contentEl.createEl('p', { text: i18n.empty, cls: 'comic-history-empty' }));
			}
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
