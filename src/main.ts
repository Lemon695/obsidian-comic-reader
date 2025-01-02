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
					console.log("Command: open-manga-zip triggered");
					const fileHandle = await window.showOpenFilePicker({
						types: [{
							description: 'ZIP files',
							accept: {
								'application/zip': ['.zip']
							}
						}]
					});

					if (fileHandle && fileHandle[0]) {
						const file = await fileHandle[0].getFile();
						console.log("File selected:", file.name);
						await this.openMangaView(file, fileHandle[0]);
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
		this.addRibbonIcon('book-open', 'Open Manga ZIP', async () => {
			try {
				console.log("Ribbon icon clicked");
				const fileHandle = await window.showOpenFilePicker({
					types: [{
						description: 'ZIP files',
						accept: {
							'application/zip': ['.zip']
						}
					}]
				});

				if (fileHandle && fileHandle[0]) {
					const file = await fileHandle[0].getFile();
					console.log("File selected:", file.name);
					await this.openMangaView(file, fileHandle[0]);
				}
			} catch (error) {
				console.error('Error selecting file:', error);
			}
		});

		// 添加历史记录按钮到ribbon
		this.addRibbonIcon('history', 'Show Manga History', () => {
			new MangaHistoryModal(this).open();
		});

		// 添加样式
		this.addStyle();
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
			path: file.name, // 这里只能保存文件名，因为 File 对象不提供完整路径
			fileName: file.name,
			lastOpened: Date.now(),
			fileHandle: fileHandle
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

	private addStyle() {
		// ...原有的样式代码...
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
					if (historyItem.fileHandle) {
						const file = await historyItem.fileHandle.getFile();
						await this.plugin.openMangaView(file, historyItem.fileHandle);
						this.close();
					} else {
						new Notice('Could not access the file. Please open it manually.');
					}
				} catch (error) {
					console.error('Error opening file from history:', error);
					new Notice('Error opening file. The file might have been moved or deleted.');
				}
			});
		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
