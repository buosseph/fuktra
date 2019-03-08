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

	let current: string | null = null;
	let previous: string | null = null;

	// The "no-bail" branch also handles the case where `path` is an empty array
	let bail = false;
	for ([ previous, current ] of peek(path)) {
		const exists = Reflect.ownKeys(obj).includes(current);
		const found: any = exists && Reflect.get(obj, current);
		if (!found) { bail = true; break; }

		// Found property, yield event then continue dispatch
		yield { dispatcher, origin, path: previous, endpoint: false, handler: obj };
		obj = found;
	}
	if (!bail) {
		// If the object implements the dispatch protocol, using `Symbols.dispatch`,
		// then use the protocol value as the handler.
		yield {
			dispatcher,
			origin,
			path: current,
			endpoint: true,
			handler: obj[Symbols.dispatch] || obj
		};

		return;
	}

	// We've bailed. Here we can dispatch no further becuase a property in the `path` was
	// not found. Because we bailed, `current` is still in the `path`, `previous` is the
	// path element that matches `obj`, and `obj` is the last found property.
	//
	// If `obj` happens to implement the dispatch protocol, then the handler associated
	// with the object instance is the value keyed using `Symbols.dispatch`.
	if (obj instanceof Function) {
		yield { dispatcher, origin, path: previous, endpoint: true, handler: obj };
	}
	else if (obj[Symbols.dispatch]) {
		yield { dispatcher, origin, path: previous, endpoint: true, handler: obj[Symbols.dispatch] };
	}
	else {
		yield { dispatcher, origin, path: previous, endpoint: false, handler: obj };
	}
};