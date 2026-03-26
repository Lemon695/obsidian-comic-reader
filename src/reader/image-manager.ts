import JSZip from 'jszip';

export class ImageManager {
	private currentUrl: string | null = null;
	private currentBlob: Blob | null = null;

	async loadImage(zip: JSZip, filename: string): Promise<{ url: string; blob: Blob }> {
		this.revokeCurrentUrl();
		const file = zip.file(filename);
		if (!file) throw new Error(`File not found in ZIP: ${filename}`);
		const blob = await file.async('blob');
		const url = URL.createObjectURL(blob);
		this.currentUrl = url;
		this.currentBlob = blob;
		return { url, blob };
	}

	async loadThumbnail(zip: JSZip, filename: string): Promise<string> {
		const file = zip.file(filename);
		if (!file) return '';
		const blob = await file.async('blob');
		return URL.createObjectURL(blob);
	}

	revokeThumbnailUrl(url: string): void {
		if (url) URL.revokeObjectURL(url);
	}

	getCurrentBlob(): Blob | null {
		return this.currentBlob;
	}

	revokeCurrentUrl(): void {
		if (this.currentUrl) {
			URL.revokeObjectURL(this.currentUrl);
			this.currentUrl = null;
		}
	}

	dispose(): void {
		this.revokeCurrentUrl();
		this.currentBlob = null;
	}
}
