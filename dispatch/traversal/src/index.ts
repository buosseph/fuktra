import { Crumb, DispatcherIter, peek } from '@fuktra/dispatch';

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

	let current: string | null = null;
	let previous: string | null = null;

	// If an attempt to access a blacklisted property is made, then ensure the next
	// yielded dispatch event signifies an endpoint. No further dispatch allowed.
	let accessedBlacklist = false;

	// The "no-bail" branch also handles the case where `path` is an empty array
	let bail = false;
	for ([ previous, current ] of peek(path)) {
		if (blacklist.includes(current)) {
			bail = true;
			accessedBlacklist = true;
			break;
		}

		const found: any = current && obj && obj[current];
		if (!found) {
			bail = true; break;
		}

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
			handler: obj
		};

		return;
	}

	// We've bailed. Here we can dispatch no further becuase a property in the `path` was
	// not found. Because we bailed, `current` is still in the `path`, `previous` is the
	// path element that matches `obj`, and `obj` is the last found property.
	if (obj instanceof Function || accessedBlacklist) {
		yield { dispatcher, origin, path: previous, endpoint: true, handler: obj };
	}
	else {
		yield { dispatcher, origin, path: previous, endpoint: false, handler: obj };
	}
};