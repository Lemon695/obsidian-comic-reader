import { I18nDict } from '../locale';

interface NoticesStrings {
	noImageToCopy: string;
	imageCopied: string;
	copyFailed: string;
	noImagesFound: string;
	loadError: string;
	bookmarkAdded: string;
}

export const noticesI18n: I18nDict<NoticesStrings> = {
	zh: {
		noImageToCopy: '没有可复制的图片',
		imageCopied: '图片已复制到剪贴板',
		copyFailed: '复制图片失败',
		noImagesFound: 'ZIP 文件中没有找到图片',
		loadError: '加载 ZIP 文件出错',
		bookmarkAdded: '书签已添加',
	},
	en: {
		noImageToCopy: 'No image to copy',
		imageCopied: 'Image copied to clipboard',
		copyFailed: 'Failed to copy image',
		noImagesFound: 'No images found in ZIP file',
		loadError: 'Error loading ZIP file',
		bookmarkAdded: 'Bookmark added',
	},
};
