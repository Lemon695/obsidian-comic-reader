declare global {
	interface Window {
		showOpenFilePicker(options?: {
			types?: {
				description: string;
				accept: Record<string, string[]>;
			}[];
			excludeAcceptAllOption?: boolean;
			multiple?: boolean;
		}): Promise<FileSystemFileHandle[]>;
	}
}

export {};
