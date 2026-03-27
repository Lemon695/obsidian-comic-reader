import { App, TFile } from 'obsidian';
import type { ComicSource, ComicFormat } from '../types';
import { getComicFormat } from '../types';
import { getComicMimeType } from './comic-parser';

export class ComicSourceService {
	constructor(private readonly app: App) {}

	createExternalSource(fileName: string): ComicSource {
		return {
			kind: 'external',
			fileName,
		};
	}

	createVaultSource(path: string, fileName: string): ComicSource {
		return {
			kind: 'vault',
			path,
			fileName,
		};
	}

	canRestore(source: ComicSource | undefined): boolean {
		return source?.kind === 'vault';
	}

	async resolveFile(source: ComicSource): Promise<File | null> {
		if (source.kind !== 'vault') {
			return null;
		}

		const abstractFile = this.app.vault.getAbstractFileByPath(source.path);
		if (!(abstractFile instanceof TFile)) {
			return null;
		}

		const arrayBuffer = await this.app.vault.readBinary(abstractFile);
		return new File([arrayBuffer], source.fileName, {
			type: this.getMimeType(getComicFormat(source.fileName)),
		});
	}

	private getMimeType(format: ComicFormat | null): string {
		return getComicMimeType(format);
	}
}
