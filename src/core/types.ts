export interface ReaderSettings {
	thumbnailCount: number;
	sortOrder: 'numeric' | 'alpha';
}

export interface ComicSettings {
	reader: ReaderSettings;
}

export const DEFAULT_SETTINGS: ComicSettings = {
	reader: {
		thumbnailCount: 9,
		sortOrder: 'numeric',
	}
};
