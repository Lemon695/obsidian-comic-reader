import {Plugin, Notice, Modal} from 'obsidian';
import {MANGA_VIEW_TYPE} from "./constants";
import {MangaReaderView} from "./view/manga-reader-view";
import {DEFAULT_SETTINGS, HistoryItem, MangaReaderSettings} from "./type/types";

export default class MangaReaderPlugin extends Plugin {
	settings: MangaReaderSettings;

	async onload() {
		// 加载设置
		await this.loadSettings();

		console.log('Loading MangaReader plugin');

		// 注册视图类型
		this.registerView(
			MANGA_VIEW_TYPE,
			(leaf) => {
				console.log("Creating new MangaReaderView");
				return new MangaReaderView(leaf);
			}
		);

		// 添加打开漫画的命令
		this.addCommand({
			id: 'open-manga-zip',
			name: 'Open Manga ZIP',
			callback: async () => {
				try {
					const fileHandle = await this.requestFileAccess();
					if (fileHandle) {
						const file = await fileHandle.getFile();
						console.log("File selected:", file.name);
						await this.openMangaView(file, fileHandle);
					}
				} catch (error) {
					console.error('Error selecting file:', error);
				}
			}
		});

		// 添加查看历史记录的命令
		this.addCommand({
			id: 'show-manga-history',
			name: 'Show Manga History',
			callback: () => {
				new MangaHistoryModal(this).open();
			}
		});

		// 添加功能按钮到ribbon
		// 添加功能按钮到ribbon
		this.addRibbonIcon('book-open', 'Open Manga ZIP', async () => {
			try {
				const fileHandle = await this.requestFileAccess();
				if (fileHandle) {
					const file = await fileHandle.getFile();
					console.log("File selected:", file.name);
					await this.openMangaView(file, fileHandle);
				}
			} catch (error) {
				console.error('Error selecting file:', error);
			}
		});

		// 添加历史记录按钮到ribbon
		this.addRibbonIcon('history', 'Show Manga History', () => {
			new MangaHistoryModal(this).open();
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}



	// 添加历史记录
	async addToHistory(file: File, fileHandle: FileSystemFileHandle) {
		const newItem: HistoryItem = {
			path: file.name,
			fileName: file.name,
			lastOpened: Date.now()
		};

		// 移除可能存在的重复项
		this.settings.history = this.settings.history.filter(
			item => item.fileName !== newItem.fileName
		);

		// 添加新项到开头
		this.settings.history.unshift(newItem);

		// 限制历史记录数量
		if (this.settings.history.length > this.settings.maxHistoryItems) {
			this.settings.history = this.settings.history.slice(0, this.settings.maxHistoryItems);
		}

		// 保存设置
		await this.saveSettings();
	}

	async requestFileAccess(fileName?: string) {
		try {
			const handle = await window.showOpenFilePicker({
				types: [{
					description: 'ZIP files',
					accept: {
						'application/zip': ['.zip']
					}
				}]
			});

			if (handle && handle[0]) {
				const file = await handle[0].getFile();
				if (fileName && file.name !== fileName) {
					new Notice(`请选择文件: ${fileName}`);
					return null;
				}
				return handle[0];
			}
			return null;
		} catch (error) {
			console.error('Error requesting file access:', error);
			return null;
		}
	}

	async openMangaView(file: File, fileHandle: FileSystemFileHandle) {
		console.log("Opening manga view for file:", file.name);
		const workspace = this.app.workspace;

		// 添加到历史记录
		await this.addToHistory(file, fileHandle);

		// 创建新的叶子窗口
		let leaf = workspace.getLeaf('split', 'vertical');

		// 先设置类型
		await leaf.setViewState({
			type: MANGA_VIEW_TYPE,
		});

		// 获取视图实例
		const view = leaf.view as MangaReaderView;
		if (view) {
			// 设置文件
			await view.setState({file: file});
		}

		// 激活视图
		workspace.revealLeaf(leaf);
	}

	onunload() {
		console.log('Unloading MangaReader plugin');
		this.app.workspace.detachLeavesOfType(MANGA_VIEW_TYPE);
	}
}

// 历史记录模态窗口类
export class MangaHistoryModal extends Modal {
	plugin: MangaReaderPlugin;

	constructor(plugin: MangaReaderPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	async onOpen() {
		const {contentEl} = this;
		contentEl.empty();

		contentEl.createEl('h2', {text: 'Manga Reading History'});

		const historyList = contentEl.createEl('div', {cls: 'manga-history-list'});

		if (this.plugin.settings.history.length === 0) {
			historyList.createEl('p', {text: 'No reading history yet.'});
			return;
		}

		for (const historyItem of this.plugin.settings.history) {
			const itemDiv = historyList.createEl('div', {cls: 'manga-history-item'});

			const titleEl = itemDiv.createEl('div', {
				text: historyItem.fileName,
				cls: 'manga-history-title'
			});

			const dateEl = itemDiv.createEl('div', {
				text: new Date(historyItem.lastOpened).toLocaleString(),
				cls: 'manga-history-date'
			});

			itemDiv.addEventListener('click', async () => {
				try {
					// 直接尝试打开文件
					const fileHandle = await this.plugin.requestFileAccess(historyItem.fileName);
					if (fileHandle) {
						const file = await fileHandle.getFile();
						if (file.name === historyItem.fileName) {
							await this.plugin.openMangaView(file, fileHandle);
							this.close();
						}
					}
				} catch (error) {
					console.error('Error opening file from history:', error);
					new Notice('Error opening file. Please try selecting the file manually.');
				}
			});
		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
