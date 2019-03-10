import { Symbols } from '@fuktra/dispatch';
import { dispatch } from '..';

// E.g. "/foo/bar/baz" => ["foo", "bar", "baz"]
const path = (path: string) => path.split('/').filter(value => value !== '');

describe('Given an empty object', () => {
	const EMPTY_OBJECT = {};

	it('resolves incomplete path', () => {
		const result = Array.from(dispatch(path('/foo'), EMPTY_OBJECT));
		expect(result.length).toEqual(1);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(EMPTY_OBJECT);
	});

	it('resolves insecure path', () => {
		const result = Array.from(dispatch(path('/hasOwnProperty'), EMPTY_OBJECT));
		expect(result.length).toEqual(1);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(EMPTY_OBJECT);
	});
});

describe('Given a shallow object', () => {
	const SHALLOW_OBJECT = {
		[Symbols.dispatch]: 'root',
		foo: 'foo',
		bar: () => 'bar'
	};

	it('resolves insecure path', () => {
		const result = Array.from(dispatch(path('/hasOwnProperty'), SHALLOW_OBJECT));
		expect(result.length).toEqual(1);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(Reflect.get(SHALLOW_OBJECT, Symbols.dispatch));
	});

	describe('resolves shallow path', () => {
		it('to dispatch symbol', () => {
			const result = Array.from(dispatch(path('/'), SHALLOW_OBJECT));
			expect(result.length).toEqual(1);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(true);
			expect(result[0].handler).toEqual(Reflect.get(SHALLOW_OBJECT, Symbols.dispatch));
		});

		it('to static property', () => {
			const result = Array.from(dispatch(path('/foo'), SHALLOW_OBJECT));
			expect(result.length).toEqual(2);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(false);
			expect(result[0].handler).toEqual(SHALLOW_OBJECT);

			expect(result[1].path).toEqual('foo');
			expect(result[1].endpoint).toEqual(true);
			expect(result[1].handler).toEqual(SHALLOW_OBJECT.foo);
		});

		it('to function property', () => {
			const result = Array.from(dispatch(path('/bar'), SHALLOW_OBJECT));
			expect(result.length).toEqual(2);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(false);
			expect(result[0].handler).toEqual(SHALLOW_OBJECT);

			expect(result[1].path).toEqual('bar');
			expect(result[1].endpoint).toEqual(true);
			expect(result[1].handler).toEqual(SHALLOW_OBJECT.bar);
		});
	});

	it('resolves incomplete path', () => {
		const result = Array.from(dispatch(path('/diz'), SHALLOW_OBJECT, null));
		expect(result.length).toEqual(1);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(Reflect.get(SHALLOW_OBJECT, Symbols.dispatch));
	});

	it('resolves path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/foo/diz'), SHALLOW_OBJECT, null));
		expect(result.length).toEqual(2);
	
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(SHALLOW_OBJECT);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(SHALLOW_OBJECT.foo);
	});
});

describe('Given a deep object', () => {
	const DEEP_OBJECT = {
		foo: {
			bar: {
				[Symbols.dispatch]: () => 'bar',
				baz: 'baz',
				qux: () => 'qux'
			}
		}
	};

	it('resolves insecure path', () => {
		const result = Array.from(dispatch(path('/hasOwnProperty'), DEEP_OBJECT));
		expect(result.length).toEqual(1);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(DEEP_OBJECT);
	});

	it('resolves a shallow path', () => {
		const result = Array.from(dispatch(path('/foo'), DEEP_OBJECT));
		expect(result.length).toEqual(2);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(DEEP_OBJECT);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(DEEP_OBJECT.foo);
	});

	describe('resolves a deep path', () => {
		it('to dispatch symbol', () => {
			const result = Array.from(dispatch(path('/foo/bar'), DEEP_OBJECT));
			expect(result.length).toEqual(3);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(false);
			expect(result[0].handler).toEqual(DEEP_OBJECT);

			expect(result[1].path).toEqual('foo');
			expect(result[1].endpoint).toEqual(false);
			expect(result[1].handler).toEqual(DEEP_OBJECT.foo);

			expect(result[2].path).toEqual('bar');
			expect(result[2].endpoint).toEqual(true);
			expect(result[2].handler).toEqual(Reflect.get(DEEP_OBJECT.foo.bar, Symbols.dispatch));
		});

		it('to static property', () => {
			const result = Array.from(dispatch(path('/foo/bar/baz'), DEEP_OBJECT));
			expect(result.length).toEqual(4);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(false);
			expect(result[0].handler).toEqual(DEEP_OBJECT);

			expect(result[1].path).toEqual('foo');
			expect(result[1].endpoint).toEqual(false);
			expect(result[1].handler).toEqual(DEEP_OBJECT.foo);

			expect(result[2].path).toEqual('bar');
			expect(result[2].endpoint).toEqual(false);
			expect(result[2].handler).toEqual(DEEP_OBJECT.foo.bar);

			expect(result[3].path).toEqual('baz');
			expect(result[3].endpoint).toEqual(true);
			expect(result[3].handler).toEqual(DEEP_OBJECT.foo.bar.baz);
		});

		it('to function property', () => {
			const result = Array.from(dispatch(path('/foo/bar/qux'), DEEP_OBJECT));
			expect(result.length).toEqual(4);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(false);
			expect(result[0].handler).toEqual(DEEP_OBJECT);

			expect(result[1].path).toEqual('foo');
			expect(result[1].endpoint).toEqual(false);
			expect(result[1].handler).toEqual(DEEP_OBJECT.foo);

			expect(result[2].path).toEqual('bar');
			expect(result[2].endpoint).toEqual(false);
			expect(result[2].handler).toEqual(DEEP_OBJECT.foo.bar);

			expect(result[3].path).toEqual('qux');
			expect(result[3].endpoint).toEqual(true);
			expect(result[3].handler).toEqual(DEEP_OBJECT.foo.bar.qux);
		});
	});

	it('resolves incomplete path', () => {
		const result = Array.from(dispatch(path('/foo/diz'), DEEP_OBJECT, null));
		expect(result.length).toEqual(2);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(DEEP_OBJECT);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(DEEP_OBJECT.foo);
	});

	it('resolves path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/foo/bar/baz/qux'), DEEP_OBJECT, null));
		expect(result.length).toEqual(4);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(DEEP_OBJECT);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(DEEP_OBJECT.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(false);
		expect(result[2].handler).toEqual(DEEP_OBJECT.foo.bar);

		expect(result[3].path).toEqual('baz');
		expect(result[3].endpoint).toEqual(true);
		expect(result[3].handler).toEqual(DEEP_OBJECT.foo.bar.baz);
	});
});
