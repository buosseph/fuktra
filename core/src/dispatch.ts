import Path from 'path';

import { Symbols } from '@fuktra/dispatch';
import { dispatch as ObjectDispatch } from '@fuktra/dispatch-object';
import { dispatch as TraversalDispatch } from '@fuktra/dispatch-traversal';

export const preparePath = (path: string): string[] => {
	// 1. Normalize path, or throw when the path isn't a URI (e.g. '/foo/bar/..')
	const normalized = Path.normalize(path);
	// 2. Split path into parts for consumption, do not return the root as part of the collection
	const parts = normalized.split(Path.sep).filter(value => value !== '');
	return parts;
};

export const dispatch = (path: string, handler: any, context: any) => {
	console.debug('Dispatch start');
	// Search until an endpoint is found
	let isEndpoint = false;

	// TODO: Track callbacks to notify extensions of dispatch step

	let dispatcher = null; // Object dispatch by default
	let pathElements = preparePath(path);
	console.debug('\tpathElements', pathElements);
	try {
		while (!isEndpoint) {
			dispatcher = ObjectDispatch;

			const starting = handler;

			for (const { handler: dispatchedHandler, endpoint } of dispatcher(pathElements, handler, context)) {
				handler = dispatchedHandler;
				isEndpoint = endpoint;
				console.debug('\tDispatch step');
				console.debug('\t\tHandler: ', handler);
				console.debug('\t\tEndpoint: ', isEndpoint);

				// Callable is a function, string, number, or symbol; or if object includes `dispatch` symbol
				const callable = handler instanceof Function
					|| !(handler instanceof Object)
					|| Reflect.has(handler, Symbols.dispatch);

				console.log('\t\tis callable?', callable);
				if (isEndpoint && !callable) {
					isEndpoint = false;
				}

				// TODO: Notify extensions of dispatch step
			}

			// pathElements = ...

			if (!isEndpoint && starting === handler) { // Didn't go anywhere
				console.debug('Breaking...');
				break;
			}
		}
	}
	catch (error) {
		// isEndpoint can only be false here
		console.debug('Error caught during dispatch', error);
	}

	console.debug('Dispatch end');
	console.debug('\tHandler: ', handler);
	console.debug('\tEndpoint: ', isEndpoint);
	return { isEndpoint, handler: isEndpoint ? handler : null };
};
