import JSZip from 'jszip';

export function isImageFile(filename: string): boolean {
	return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
}

export function sortNumeric(filenames: string[]): string[] {
	return [...filenames].sort((a, b) => {
		const numA = parseInt(a.match(/\d+/)?.[0] ?? '0');
		const numB = parseInt(b.match(/\d+/)?.[0] ?? '0');
		return numA - numB;
	});
}

export function sortAlpha(filenames: string[]): string[] {
	return [...filenames].sort((a, b) => a.localeCompare(b));
}

export function extractImages(zip: JSZip, order: 'numeric' | 'alpha' = 'numeric'): string[] {
	const raw = Object.entries(zip.files)
		.filter(([name, file]) => isImageFile(name) && !file.dir)
		.map(([name]) => name);
	return order === 'numeric' ? sortNumeric(raw) : sortAlpha(raw);
}

export function getThumbnailRange(current: number, total: number, count: number): number[] {
	const half = Math.floor(count / 2);
	let start = Math.max(0, current - half);
	const end = Math.min(total - 1, start + count - 1);
	start = Math.max(0, end - count + 1);
	const result: number[] = [];
	for (let i = start; i <= end; i++) result.push(i);
	return result;
}
