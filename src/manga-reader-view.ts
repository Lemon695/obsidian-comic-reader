import {ItemView, Menu, Notice, WorkspaceLeaf} from "obsidian";
import JSZip from "jszip";
import {MANGA_VIEW_TYPE} from "./constants";

interface MangaViewState {
	file: File;
}

export class MangaReaderView extends ItemView {
	private currentIndex: number = 0;
	private images: string[] = [];
	private currentFile: File | null = null;
	private imageEl: HTMLImageElement;
	private currentBlob: Blob | null = null; // 存储当前图片的Blob数据
	private container: HTMLDivElement;

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
		const contentEl = this.containerEl.children[1];
		if (!(contentEl instanceof HTMLElement)) {
			throw new Error("Invalid container element");
		}

		// 清空容器
		while (contentEl.firstChild) {
			contentEl.removeChild(contentEl.firstChild);
		}

		this.container = (this.containerEl.children[1] as HTMLDivElement);
		this.container.addClass('manga-reader-container');
		this.container.setAttribute('tabindex', '0');

		this.imageEl = this.container.createEl('img', {
			cls: 'manga-reader-image'
		});

		// 监听容器的键盘事件
		this.registerDomEvent(this.container, 'keydown', (evt: KeyboardEvent) => {
			if (evt.key === 'ArrowLeft') {
				evt.preventDefault();
				this.previousPage();
			} else if (evt.key === 'ArrowRight') {
				evt.preventDefault();
				this.nextPage();
			}
		});

		// 修复事件注册方式
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf && leaf.view === this) {
					this.container.focus();
				}
			})
		);

		// 添加鼠标进入时自动聚焦
		this.registerDomEvent(this.container, 'mouseenter', () => {
			this.container.focus();
		});

		// 右键菜单事件监听
		this.registerDomEvent(this.imageEl, 'contextmenu', (evt: MouseEvent) => {
			evt.preventDefault();
			this.showContextMenu(evt);
		});

		if (this.currentFile) {
			await this.loadManga(this.currentFile);
		}
	}

	private showContextMenu(evt: MouseEvent) {
		const menu = new Menu();

		menu.addItem((item) => {
			item
				.setTitle("复制图片")
				.setIcon("copy")
				.onClick(async () => {
					await this.copyCurrentImage();
				});
		});

		menu.showAtPosition({x: evt.x, y: evt.y});
	}

	private async copyCurrentImage() {
		if (!this.currentBlob) {
			new Notice("没有可复制的图片");
			return;
		}

		try {
			// 创建一个 img 元素并加载当前图片
			const img = new Image();
			const loadImagePromise = new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
				img.src = URL.createObjectURL(<Blob>this.currentBlob);
			});

			await loadImagePromise;

			// 创建 canvas 并绘制图片
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				throw new Error('无法创建 canvas context');
			}

			ctx.drawImage(img, 0, 0);

			// 将 canvas 转换为 blob
			const blobPromise = new Promise<Blob>((resolve, reject) => {
				canvas.toBlob((blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('无法创建图片 blob'));
					}
				}, 'image/png'); // 明确指定为 PNG 格式
			});

			const blob = await blobPromise;

			// 尝试写入剪贴板
			const clipboardItem = new ClipboardItem({
				'image/png': blob
			});

			await navigator.clipboard.write([clipboardItem]);
			new Notice("图片已复制到剪贴板");

			// 清理资源
			URL.revokeObjectURL(img.src);

		} catch (error) {
			console.error('复制图片失败:', error);
			new Notice("复制图片失败");
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
				// 存储blob数据以供复制使用
				const blob = await imageFile.async('blob');
				this.currentBlob = blob;
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
				this.currentBlob = null;
			}
		} catch (error) {
			console.error('Error showing image:', error);
			this.imageEl.src = '';
			this.imageEl.alt = 'Error loading image';
			this.currentBlob = null;
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
