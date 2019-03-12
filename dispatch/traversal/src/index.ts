import { Crumb, DispatcherIter, Symbols, peek } from '@fuktra/dispatch';

const blacklist = [
	...Object.getOwnPropertyNames(Object.prototype),
	...Object.getOwnPropertyNames(Object),
	...Object.getOwnPropertyNames(Array.prototype),
	...Object.getOwnPropertyNames(Array),
	...Object.getOwnPropertyNames(Function.prototype),
	...Object.getOwnPropertyNames(Function)
];

/**
 * Traverses the given object by using property accessors to look up path elements
 *
 * Properties defined in the built-in `Object`, `Array`, and `Function`
 * types are excluded from traversal, and with throw an error if
 * found in the path during dispatch.
 */
export const dispatch: DispatcherIter<Crumb> = function*(path, obj) {
	// @ts-ignore
	const dispatcher = this;
	const origin = obj;

	const hasPropertyInChain = (obj: any, key: string | symbol) => {
		try {
			// Look up key in prototype chain
			return Reflect.has(obj, key);
		}
		catch (error) {
			// Attempted to use Reflect on a non-Object target type
			return false;
		}
	};

	const getProperty = (obj: any, key: string): any => {
		// If an attempt to access a blacklisted property is made, bail and end dispatch
		if (blacklist.includes(key)) { return undefined; }

		// Find property in object or its prototype chain
		const exists: boolean = hasPropertyInChain(obj, key);
		return exists ? Reflect.get(obj, key) : undefined;
	};

	let current: string | null = null;
	let previous: string | null = null;

	let bail = false;
	for ([ previous, current ] of peek(path)) {
		const found = getProperty(obj, current);

		// Unable to find next dispatch context for current path element, time to bail!
		if (!found) { bail = true; break; }

		// Found property, yield event then continue dispatch
		yield { dispatcher, origin, path: previous, endpoint: false, handler: obj };
		obj = found;
	}
	if (!bail) {
		// We've consumed the entire path, or the given path was empty, and are unable to
		// iterate any further with this dispatcher.
		//
		// If the current `obj` is callable, by including a value keyed using
		// `Symbols.dispatch`, then return the value as the endpoint handler.

		// Look up dispatch symbol in prototype chain
		const isCallableObject: boolean = hasPropertyInChain(obj, Symbols.dispatch);
		const handler = isCallableObject ? Reflect.get(obj, Symbols.dispatch) : obj;

		yield { dispatcher, origin, path: current, endpoint: true, handler };

		return;
	}

	// We've bailed, which means we are unable to iterate any further with this dispatcher.
	// This means `obj` is the last found property, `previous` is the path element that
	// matches `obj`, and `current` is still in `path`.
	//
	// If `obj` is callable, by including a value keyed using `Symbols.dispatch`, then
	// return the value as the endpoint.
	//
	// Because `path` is not consumed completely, further dispatch may be possible with
	// another dispatcher, but that is not a concern here.

	// Look up dispatch symbol in prototype chain
	const isCallableObject: boolean = hasPropertyInChain(obj, Symbols.dispatch);
	const isCallable: boolean = isCallableObject || obj instanceof Function || !(obj instanceof Object);

	if (isCallable) {
		const handler = isCallableObject ? Reflect.get(obj, Symbols.dispatch) : obj;
		yield { dispatcher, origin, path: previous, endpoint: true, handler };
	}
	else {
		yield { dispatcher, origin, path: previous, endpoint: false, handler: obj };
	}
};