// main.ts
import {Plugin} from 'obsidian';
import {MANGA_VIEW_TYPE} from "./constants";
import {MangaReaderView} from "./mangaReaderView";
import './types';

export default class MangaReaderPlugin extends Plugin {
	async onload() {
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
						await this.openMangaView(file);
					}
				} catch (error) {
					console.error('Error selecting file:', error);
				}
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
					await this.openMangaView(file);
				}
			} catch (error) {
				console.error('Error selecting file:', error);
			}
		});

		// 添加样式
		this.addStyle();
	}

	async openMangaView(file: File) {
		console.log("Opening manga view for file:", file.name);
		const workspace = this.app.workspace;

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
		// 添加样式
		const styleEl = document.createElement('style');
		styleEl.innerHTML = `
            .manga-reader-container {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                background-color: var(--background-primary);
            }
            
            .manga-reader-image {
                max-width: 100%;
                max-height: 100vh;
                object-fit: contain;
                display: block;
            }
        `;
		document.head.appendChild(styleEl);
	}
}
