import type { PluginModule } from './types';
import type ComicReaderPlugin from '../main';

export class ModuleManager {
	private readonly registry: Map<string, PluginModule> = new Map();
	private readonly loaded: Set<string> = new Set();

	constructor(private readonly plugin: ComicReaderPlugin) {}

	register(module: PluginModule): void {
		if (this.registry.has(module.id)) {
			throw new Error(`[comic-reader] Module '${module.id}' is already registered.`);
		}
		this.registry.set(module.id, module);
	}

	async loadAll(): Promise<void> {
		for (const [id, module] of this.registry) {
			if (this.isEnabled(id)) {
				await this.loadModule(module);
			}
		}
	}

	unloadAll(): void {
		for (const id of [...this.loaded]) {
			this.unloadModule(id);
		}
	}

	async enableModule(id: string): Promise<void> {
		const module = this.registry.get(id);
		if (!module) return;

		this.plugin.settings.moduleEnabled[id] = true;
		await this.plugin.saveSettings();
		if (!this.loaded.has(id)) {
			await this.loadModule(module);
		}
	}

	async disableModule(id: string): Promise<void> {
		this.plugin.settings.moduleEnabled[id] = false;
		await this.plugin.saveSettings();
		this.unloadModule(id);
	}

	getAll(): PluginModule[] {
		return [...this.registry.values()];
	}

	get(id: string): PluginModule | undefined {
		return this.registry.get(id);
	}

	isEnabled(id: string): boolean {
		return this.plugin.settings.moduleEnabled[id] !== false;
	}

	private async loadModule(module: PluginModule): Promise<void> {
		try {
			await module.onload();
			this.loaded.add(module.id);
			console.debug(`[comic-reader] Loaded module: ${module.id}`);
		} catch (error) {
			console.error(`[comic-reader] Failed to load module '${module.id}':`, error);
		}
	}

	private unloadModule(id: string): void {
		const module = this.registry.get(id);
		if (!module || !this.loaded.has(id)) return;

		try {
			module.onunload();
			this.loaded.delete(id);
			console.debug(`[comic-reader] Unloaded module: ${id}`);
		} catch (error) {
			console.error(`[comic-reader] Failed to unload module '${id}':`, error);
		}
	}
}
