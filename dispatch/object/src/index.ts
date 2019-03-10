import { Crumb, DispatcherIter, Symbols, peek } from '@fuktra/dispatch';

/**
 * Dispatches plain objects
 *
 * Dispatching does not account for class expressions or declarations, unless the
 * expected properties are associated with the class instance.
 */
export const dispatch: DispatcherIter<Crumb> = function*(path, obj) {
	// @ts-ignore
	const dispatcher = this;
	const origin = obj;

	// Gets the objects own properties and symbols, while
	// handling the case where the given `obj` is not an `Object`.
	const getProperty = (obj: any, key: string): any => {
		let exists: boolean;
		try {
			exists = Reflect.ownKeys(obj).includes(key);
		}
		catch (error) {
			// Attempted to use Reflect on a non-Object target type,
			// i.e. string, number, symbol
			exists = false;
		}

		return exists
			? Reflect.get(obj, key)
			: undefined;
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

		const isCallableObject: boolean = (obj as Record<string, any>).hasOwnProperty(Symbols.dispatch);
		const handler = isCallableObject ? obj[Symbols.dispatch] : obj;

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

	const isCallableObject: boolean = (obj as Record<string, any>).hasOwnProperty(Symbols.dispatch);
	const isCallable: boolean = isCallableObject || !(obj instanceof Object);

	if (isCallable) {
		const handler = isCallableObject ? obj[Symbols.dispatch] : obj;
		yield { dispatcher, origin, path: previous, endpoint: true, handler };
	}
	else {
		yield { dispatcher, origin, path: previous, endpoint: false, handler: obj };
	}
};