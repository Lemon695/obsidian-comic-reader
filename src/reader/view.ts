import { ItemView, Menu, Notice, WorkspaceLeaf } from 'obsidian';
import JSZip from 'jszip';
import { MANGA_VIEW_TYPE } from '../constants';
import { ReaderSettings } from '../core/types';
import { t } from '../i18n/locale';
import { noticesI18n } from '../i18n/reader/notices';
import { contextMenuI18n } from '../i18n/reader/context-menu';
import { ImageManager } from './image-manager';
import { extractImages, getThumbnailRange } from './parser';

interface MangaViewState {
	file: File;
}

export class MangaReaderView extends ItemView {
	private currentIndex = 0;
	private images: string[] = [];
	private currentFile: File | null = null;
	private imageEl: HTMLImageElement;
	private container: HTMLDivElement;
	private thumbnailBar: HTMLDivElement;
	private pageInfo: HTMLDivElement;
	private zipInstance: JSZip | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private imgManager: ImageManager,
		private settings: ReaderSettings,
	) {
		super(leaf);
	}

	getViewType(): string {
		return MANGA_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Comic Reader';
	}

	async setState(state: MangaViewState): Promise<void> {
		if (state?.file) {
			this.currentFile = state.file;
			await this.loadManga(state.file);
		}
	}

	async onOpen(): Promise<void> {
		const contentEl = this.containerEl.children[1] as HTMLElement;

		while (contentEl.firstChild) {
			contentEl.removeChild(contentEl.firstChild);
		}

		this.container = contentEl as HTMLDivElement;
		this.container.addClass('manga-reader-container');
		this.container.setAttribute('tabindex', '0');

		this.imageEl = this.container.createEl('img', { cls: 'manga-reader-image' });

		this.thumbnailBar = this.container.createEl('div', { cls: 'thumbnail-bar' });
		this.pageInfo = this.thumbnailBar.createEl('div', { cls: 'page-info' });
		this.thumbnailBar.createEl('div', { cls: 'thumbnail-container' });

		this.registerDomEvent(this.container, 'mousemove', (e: MouseEvent) => {
			const threshold = this.container.clientHeight - 150;
			if (e.clientY > threshold) {
				this.thumbnailBar.addClass('show');
			} else {
				this.thumbnailBar.removeClass('show');
			}
		});

		this.registerDomEvent(this.container, 'keydown', (evt: KeyboardEvent) => {
			if (evt.key === 'ArrowLeft') {
				evt.preventDefault();
				this.previousPage();
			} else if (evt.key === 'ArrowRight') {
				evt.preventDefault();
				this.nextPage();
			}
		});

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf && leaf.view === this) {
					this.container.focus();
				}
			})
		);

		this.registerDomEvent(this.container, 'mouseenter', () => {
			this.container.focus();
		});

		this.registerDomEvent(this.imageEl, 'contextmenu', (evt: MouseEvent) => {
			evt.preventDefault();
			this.showContextMenu(evt);
		});

		if (this.currentFile) {
			await this.loadManga(this.currentFile);
		}
	}

	async onClose(): Promise<void> {
		this.imgManager.dispose();
		this.zipInstance = null;
	}

	async loadManga(file: File): Promise<void> {
		try {
			this.zipInstance = new JSZip();
			const zipContent = await this.zipInstance.loadAsync(file);
			this.images = extractImages(zipContent, this.settings.sortOrder);

			if (this.images.length > 0) {
				await this.showImage(0);
			} else {
				const notices = t(noticesI18n);
				(this.containerEl.children[1] as HTMLElement).setText(notices.noImagesFound);
			}
		} catch (error) {
			console.error('Error loading comic:', error);
			const notices = t(noticesI18n);
			(this.containerEl.children[1] as HTMLElement).setText(notices.loadError);
		}
	}

	async showImage(index: number): Promise<void> {
		if (!this.zipInstance || index < 0 || index >= this.images.length) return;

		try {
			const { url } = await this.imgManager.loadImage(this.zipInstance, this.images[index]);
			this.imageEl.src = url;
			this.currentIndex = index;
			setTimeout(() => this.updateThumbnails(), 100);
		} catch (error) {
			console.error('Error showing image:', error);
			this.imageEl.src = '';
			this.imageEl.alt = 'Error loading image';
		}

		await this.updateThumbnails();
	}

	previousPage(): void {
		if (this.currentIndex > 0) {
			this.showImage(this.currentIndex - 1);
		}
	}

	nextPage(): void {
		if (this.currentIndex < this.images.length - 1) {
			this.showImage(this.currentIndex + 1);
		}
	}

	private async updateThumbnails(): Promise<void> {
		if (!this.zipInstance || !this.thumbnailBar) return;

		const thumbnailContainer = this.thumbnailBar.querySelector('.thumbnail-container');
		if (!thumbnailContainer) return;

		// Revoke old thumbnail URLs before clearing
		thumbnailContainer.querySelectorAll<HTMLImageElement>('img').forEach(img => {
			if (img.src) this.imgManager.revokeThumbnailUrl(img.src);
		});
		while (thumbnailContainer.firstChild) {
			thumbnailContainer.removeChild(thumbnailContainer.firstChild);
		}

		this.pageInfo.textContent = `${this.currentIndex + 1} / ${this.images.length}`;

		const indices = getThumbnailRange(this.currentIndex, this.images.length, this.settings.thumbnailCount);
		await Promise.all(indices.map(i => this.createThumbnail(i, thumbnailContainer)));
	}

	private async createThumbnail(index: number, container: Element): Promise<void> {
		const thumbContainer = container.createEl('div', { cls: 'thumbnail-wrapper' });
		const thumb = thumbContainer.createEl('img', {
			cls: 'thumbnail' + (index === this.currentIndex ? ' current' : ''),
		});

		try {
			if (this.zipInstance) {
				const url = await this.imgManager.loadThumbnail(this.zipInstance, this.images[index]);
				if (url) {
					thumb.src = url;
					thumb.onload = () => this.imgManager.revokeThumbnailUrl(url);
					thumbContainer.addEventListener('click', () => this.showImage(index));
				}
			}
		} catch (error) {
			console.error('Error loading thumbnail:', error);
		}
	}

	private showContextMenu(evt: MouseEvent): void {
		const menu = new Menu();
		const i18n = t(contextMenuI18n);

		menu.addItem((item) => {
			item.setTitle(i18n.copyImage)
				.setIcon('copy')
				.onClick(() => this.copyCurrentImage());
		});

		menu.showAtPosition({ x: evt.x, y: evt.y });
	}

	private async copyCurrentImage(): Promise<void> {
		const notices = t(noticesI18n);
		const blob = this.imgManager.getCurrentBlob();

		if (!blob) {
			new Notice(notices.noImageToCopy);
			return;
		}

		try {
			const img = new Image();
			const objectUrl = URL.createObjectURL(blob);
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = reject;
				img.src = objectUrl;
			});

			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Cannot create canvas context');
			ctx.drawImage(img, 0, 0);
			URL.revokeObjectURL(objectUrl);

			const pngBlob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob(b => b ? resolve(b) : reject(new Error('Cannot create blob')), 'image/png');
			});

			await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
			new Notice(notices.imageCopied);
		} catch (error) {
			console.error('Copy image failed:', error);
			new Notice(notices.copyFailed);
		}
	}
}
