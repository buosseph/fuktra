export * from './peek';

/**
 * Dispatch events are 3-tuples with following properties:
 * - The `path` element or elements being used during the current step of dispatch
 * - The `dispatcher` object, representing the current dispatch context or endpoint,
 *   to be passed to the next dispatcher in the event of a transition
 * - An `endpoint` flag indicating if the object is the final object matching the
 *   initial `path` and completes dispatch
 */
export type DispatchEvent = {
	path: string | string[] | null,
	dispatcher: any,
	endpoint: boolean
}

type ProcessingContext = any;
type DispatchContext = any;

export type DispatcherFn<E extends DispatchEvent = DispatchEvent> =
	(path: string[], obj: DispatchContext, context?: ProcessingContext) => E[];

export type DispatcherIter<E extends DispatchEvent = DispatchEvent> =
	(path: string[], obj: DispatchContext, context?: ProcessingContext) => IterableIterator<E>;

export type DispatcherObject<E extends DispatchEvent = DispatchEvent> =
	{ dispatch: DispatcherFn<E> | DispatcherIter<E> };

/**
 * Dispatchers, or dispatch event producers, are callable objects that:
 * - **Must** accept only two required positional arguments
 *   - An object representing the current processing context, i.e. the framework context or request object
 *   - The object to begin dispatch on. For some configuraitons this may be `null`. Generally referred to as the *dispatch context*
 *   - An `string[]` of remaining path elements.
 * - **Must** return an iterable of tuples that can be read as a `DispatchEvent`
 * - **May** be a generator function
 */
export type Dispatcher<E extends DispatchEvent = DispatchEvent> =
	DispatcherFn<E> | DispatcherIter<E> | DispatcherObject<E>;

type CrumbDispatcher = any;

export interface Crumb extends DispatchEvent {
	/** The dispatch root object */
	origin: CrumbDispatcher,
	/** The dispatcher instance that generated this `DispatchEvent` */
	dispatcher: CrumbDispatcher,
	/** The path element or sequence represented by this `Crumb` */
	path: string | string[] | null, // = null
	/** If this is an endpoint or a midpoint in dispatch */
	endpoint: boolean, // = false
	/** The associated handler for the path; may be `null` in some circumstances */
	handler?: any | null, // = null
	/** A set of valid HTTP verbs for this endpoint, if applicable */
	options?: any | null // = null
};

/**
 * Dispatch symbols
 *
 * @example
 * const dispatchable = { [Symbols.dispatch]: () => 'foo' };
 *
 * @example
 * class Dispatchable { [Symbols.dispatch]() { return 'foo'; } }
 */
export const Symbols = {
	/** Indicates the object instance is available as a dispatch midpoint */
	dispatch: Symbol('dispatch')
};
