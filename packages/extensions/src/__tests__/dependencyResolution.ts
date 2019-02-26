import { tarjan, topologicalSort, robustTopologicalSort } from '../dependencyResolution';

const VALID = new Map([
	['foo', ['bar']],
	['bar', []],
	['baz', ['foo']]
]);

const CYCLE = new Map([
	['foo', ['bar']],
	['bar', ['baz']],
	['baz', ['bar']]
]);

const MISSING = new Map([
	['foo', ['bar']],
	['bar', ['baz']]
]);

const stringComparator = (a: string, b: string) => {
	const aValue = a.toLowerCase();
	const bValue = b.toLowerCase();
	if (aValue < bValue) { return -1; }
	if (aValue > bValue) { return 1; }
	return 0;
}

describe('tarjan', () => {
	it('sorts valid graph', () => {
		expect(tarjan(VALID)).toEqual([['bar'], ['foo'], ['baz']]);
	});

	it('groups cycles', () => {
		expect(tarjan(CYCLE).map(tuple => tuple.sort(stringComparator))).toEqual([['bar', 'baz'], ['foo']]);
	});

	it('throws when a dependency is missing', () => {
		expect(() => tarjan(MISSING)).toThrowError();
	});
});

describe('topologicalSort', () => {
	it('sorts valid graph', () => {
		expect(topologicalSort(VALID)).toEqual(['baz', 'foo', 'bar']);
	});

	it('sorts graph with tuple keys', () => {
		// NOTE: Map key comparison is based on object instance,
		// otherwise comparisons will fail during key lookup
		const foo = ['foo'];
		const bar = ['bar'];
		const baz = ['baz'];

		expect(topologicalSort(new Map([
			[ foo, [ bar ] ],
			[ bar, [] ],
			[ baz, [ foo ] ]
		]))).toEqual([['baz'], ['foo'], ['bar']]);
	});

	it('removes cycles', () => {
		expect(topologicalSort(CYCLE)).toEqual(['foo']);
	});

	it('throws when a dependency is missing', () => {
		expect(() => topologicalSort(MISSING)).toThrowError();
	});
});

describe('robustTopologicalSort', () => {
	it('sorts valid graph', () => {
		expect(robustTopologicalSort(VALID)).toEqual([['baz'], ['foo'], ['bar']]);
	});

	it('groups cycles', () => {
		expect(robustTopologicalSort(CYCLE).map(tuple => tuple.sort(stringComparator))).toEqual([['foo'], ['bar', 'baz']]);
	});

	it('throw when a dependency is missing', () => {
		expect(() => robustTopologicalSort(MISSING)).toThrowError();
	});
});
