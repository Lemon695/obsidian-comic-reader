// mangaReaderView.ts
import { ItemView, WorkspaceLeaf } from "obsidian";
import JSZip from "jszip";
import { MANGA_VIEW_TYPE } from "./constants";

interface MangaViewState {
	file: File;
}

export class MangaReaderView extends ItemView {
	private currentIndex: number = 0;
	private images: string[] = [];
	private currentFile: File | null = null;
	private imageEl: HTMLImageElement;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		console.log("MangaReaderView constructed");
	}

	getViewType(): string {
		return MANGA_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Manga Reader';
	}

	// 修改 setState 方法名和实现
	async setState(state: MangaViewState): Promise<void> {
		console.log("setState called with state:", state);
		if (state?.file) {
			this.currentFile = state.file;
			await this.loadManga(state.file);
		}
	}

	async onOpen(): Promise<void> {
		console.log("onOpen called");
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('manga-reader-container');

		this.imageEl = container.createEl('img', {
			cls: 'manga-reader-image'
		});

		this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
			if (evt.key === 'ArrowLeft') {
				this.previousPage();
			} else if (evt.key === 'ArrowRight') {
				this.nextPage();
			}
		});

		// 如果已经有文件，重新加载它
		if (this.currentFile) {
			await this.loadManga(this.currentFile);
		}
	}

	async loadManga(file: File) {
		console.log("Loading manga file:", file.name);
		try {
			const zip = new JSZip();
			const zipContent = await zip.loadAsync(file);
			console.log("Zip content loaded:", Object.keys(zipContent.files).length, "files found");

			// 获取所有图片文件并排序
			this.images = Object.keys(zipContent.files)
				.filter(filename => {
					const isImage = filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
					const isNotDir = !zipContent.files[filename].dir;
					console.log("File:", filename, "isImage:", !!isImage, "isNotDir:", isNotDir);
					return isImage && isNotDir;
				})
				.sort((a, b) => {
					const numA = parseInt(a.match(/\d+/)?.[0] || '0');
					const numB = parseInt(b.match(/\d+/)?.[0] || '0');
					return numA - numB;
				});

			console.log("Filtered image files:", this.images);

			// 显示第一张图片
			if (this.images.length > 0) {
				await this.showImage(0);
			} else {
				console.log("No images found in zip file");
				// 显示错误信息
				this.containerEl.children[1].setText('No images found in the ZIP file');
			}
		} catch (error) {
			console.error('Error loading manga:', error);
			// 显示错误信息
			this.containerEl.children[1].setText('Error loading ZIP file: ' + error.message);
		}
	}

	async showImage(index: number) {
		console.log("Showing image at index:", index);
		if (!this.currentFile || index < 0 || index >= this.images.length) {
			console.log("Invalid image index or no file loaded");
			return;
		}

		try {
			const zip = new JSZip();
			const zipContent = await zip.loadAsync(this.currentFile);
			const imageFileName = this.images[index];
			const imageFile = zipContent.file(imageFileName);

			if (imageFile) {
				console.log("Loading image:", imageFileName);
				const blob = await imageFile.async('blob');
				const url = URL.createObjectURL(blob);

				// 清理之前的URL
				if (this.imageEl.src) {
					URL.revokeObjectURL(this.imageEl.src);
				}

				this.imageEl.src = url;
				this.currentIndex = index;
				console.log("Image loaded successfully");
			} else {
				console.log("Image file not found in zip");
				this.imageEl.src = '';
				this.imageEl.alt = 'Image not found';
			}
		} catch (error) {
			console.error('Error showing image:', error);
			this.imageEl.src = '';
			this.imageEl.alt = 'Error loading image';
		}
	}

	previousPage() {
		if (this.currentIndex > 0) {
			this.showImage(this.currentIndex - 1);
		}
	}

	nextPage() {
		if (this.currentIndex < this.images.length - 1) {
			this.showImage(this.currentIndex + 1);
		}
	}
}
