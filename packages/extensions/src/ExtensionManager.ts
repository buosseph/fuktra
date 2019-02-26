import Extension from './Extension';
import ExtensionRegistry from './ExtensionRegistry';
import { robustTopologicalSort } from './dependencyResolution';

const isSuperset = <T = any>(set: Set<T>, subset: Set<T>): boolean => {
	for (const item of subset) {
		if (!set.has(item)) {
			return false;
		}
	}

	return true;
}

const intersection = <T = any>(setA: Set<T>, setB: Set<T>): Set<T> => {
	const _intersection = new Set();
	for (const item of setB) {
		if (setA.has(item)) {
			_intersection.add(item);
		}
	}

	return _intersection;
}

const difference = <T = any>(setA: Set<T>, setB: Set<T>): Set<T> => {
	var _difference = new Set(setA);
	for (const item of setB) {
			_difference.delete(item);
	}
	return _difference;
}

/**
 * Extension management based on configuration properties
 *
 * Extensions describe their dependencies using an expressive syntax:
 *
 * - `provides` — declare tags describing the features offered by the plugin
 * - `needs` — delcare the tags that must be present for this extension to function
 * - `uses` — declare the tags that must be evaluated prior to this extension, but aren't hard requirements
 * - `first` — declare that this extension is a dependency of all other non-first extensions
 * - `last` — declare that this extension depends on all other non-last extensions
 */
export class ExtensionManager<Ext extends Extension> extends ExtensionRegistry<Ext> {
	public order(): Ext[] {
		const extensions = this.registry;

		// Identify what features have been provided and need by the extension tags

		const provided = new Set<string>();
		const needed = new Set<string>();

		extensions.forEach(extension => {
			extension.provides.forEach(tag => provided.add(tag));
			extension.needs.forEach(tag => needed.add(tag));
		});

		// Check if all features needed are provided by confirming provided is a superset of needed
		if (!isSuperset(provided, needed)) {
			throw new Error(`Extensions providing the following features must be configured:\n${Array.from(difference(needed, provided)).join(', ')}`);
		}

		// Create mapping of feature names to extensions

		let universal: Ext[] = [];
		let inverse: Ext[] = [];
		let provides: { [feature: string]: Ext } = {};
		let excludes: { [feature: string]: Ext[] } = {};

		extensions.forEach(extension => {
			// Identify all provided features by the extension
			extension.provides.forEach(feature => {
				provides = { ...provides, [feature]: extension };
			});

			// Identify all features that must be excluded in the extension
			extension.excludes.forEach(feature => {
				const { [feature]: knownExclusion = [] } = excludes;
				excludes = { ...excludes, [feature]: [ ...knownExclusion, extension ] };
			});

			if (extension.first) {
				universal = [ ...universal, extension ];
			}
			else if (extension.last) {
				inverse = [ ...inverse, extension ];
			}
		});

		// Verify there are no conflicts by confirming provides and excludes share no items
		const providedFeatureSet = new Set<string>();
		const excludedFeatureSet = new Set<string>();

		Object.keys(provides).forEach(key => providedFeatureSet.add(key));
		Object.keys(excludes).forEach(key => excludedFeatureSet.add(key));

		intersection(providedFeatureSet, excludedFeatureSet).forEach(conflict => {
			throw new Error(`${excludes[conflict]} requires that the ${conflict} feature to not exist, but is defined by ${provides[conflict]}`);
		});

		// Build initial graph
		let dependencies: Map<string, string[]> = new Map();

		extensions.forEach(extension => {
			// Get the requrie features from the needs and uses attributes

			const requirements = new Set<string>();
			extension.needs.forEach(feature => requirements.add(feature));

			const used = new Set<string>();
			extension.uses.forEach(feature => used.add(feature));

			const additionalRequirements = intersection(used, provided);
			additionalRequirements.forEach(requirement => requirements.add(requirement));

			const extensionDependencies = new Set<string>();
			requirements.forEach(requirement => {
				extensionDependencies.add(provides[requirement].provides[0]);
			});

			dependencies.set(extension.provides[0], Array.from(extensionDependencies));

			if (universal.length > 0 && !universal.find(ext => ext === extension)) {
				universal.forEach(ext => {
					const knownDependencies = dependencies.get(extension.provides[0]);
					const updatedDependencies = knownDependencies
						? [ ...knownDependencies, ext.provides[0] ]
						: [ ext.provides[0] ];
					dependencies.set(extension.provides[0], updatedDependencies);
				});
			}

			if (inverse.length > 0 && inverse.find(ext => ext === extension)) {
				const inverseDependencies: Set<Ext> = difference(new Set<Ext>(extensions), new Set<Ext>(inverse));
				const knownDependencies = dependencies.get(extension.provides[0]);

				let updatedDependencies: string[];

				if (knownDependencies) {
					updatedDependencies = Array.from(knownDependencies);
					inverseDependencies.forEach(ext => {
						updatedDependencies.push(ext.provides[0]);
					});
				}
				else {
					updatedDependencies = [];
					inverseDependencies.forEach(ext => {
						updatedDependencies.push(ext.provides[0]);
					});
				}

				dependencies.set(extension.provides[0], updatedDependencies);
			}
		});

		const orderedDependencies: string[][] = robustTopologicalSort(dependencies);

		// Identify cycles and collect extensions for result
		let result: Ext[] = [];
		orderedDependencies.forEach(ext => {
			if (ext.length > 1) { // If tuple found, then circular dependency
				throw new Error(`Circular dependency found: ${ext}`);
			}

			const feature = ext[0];
			const found = this.registry.find(ext => ext.provides[0] === feature);

			if (!found) {
				throw new Error(`Cannot find expected extension: ${feature}`);
			}

			result.push(found);
		});

		return result.reverse();
	}
}

export default ExtensionManager;
