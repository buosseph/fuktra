import Extension from './Extension';

/** Tracks registered extensions */
export class ExtensionRegistry<Ext extends Extension> {
	protected registry: Ext[] = [];

	public register(extension: Ext) {
		this.registry = [ ...this.registry, extension ];
	}

	public *[Symbol.iterator]() {
		for (let extension of this.registry) {
			yield extension;
		}
	}
}

export default ExtensionRegistry;
