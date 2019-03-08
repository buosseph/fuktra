import { Symbols } from '@fuktra/dispatch';
import { dispatch } from '..';

// E.g. "/foo/bar/baz" => ["foo", "bar", "baz"]
const path = (path: string) => path.split('/').filter(value => value);

describe('Given a function', () => {
	const FUNCTION = (...args: any[]) => `function /${args.join('/')}`;

	it('resolves root path', () => {
		const result = Array.from(dispatch(path('/'), FUNCTION, null));
		expect(result.length).toEqual(1); 
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(FUNCTION);
	});

	it('resolves deep path', () => {
		const result = Array.from(dispatch(path('/foo/bar/baz'), FUNCTION, null));
		expect(result.length).toEqual(1); 
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(FUNCTION);
	});
});

describe('Given an object with functions', () => {
	const OBJECT_SIMPLE = {
		property: 'property',
		foo: { bar: { baz: () => 'baz' } }
	};

	it('resolves property', () => {
		const result = Array.from(dispatch(path('/property'), OBJECT_SIMPLE, null));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(OBJECT_SIMPLE);

		expect(result[1].path).toEqual('property');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(OBJECT_SIMPLE.property);
	});

	it('resolves shallow path', () => {
		const result = Array.from(dispatch(path('/foo'), OBJECT_SIMPLE, null));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(OBJECT_SIMPLE);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(OBJECT_SIMPLE.foo);
	});

	it('resolves deep path', () => {
		const result = Array.from(dispatch(path('/foo/bar'), OBJECT_SIMPLE, null));
		expect(result.length).toEqual(3);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(OBJECT_SIMPLE);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(OBJECT_SIMPLE.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(true);
		expect(result[2].handler).toEqual(OBJECT_SIMPLE.foo.bar);
	});

	it('resolves incomplete deep path', () => {
		const result = Array.from(dispatch(path('/foo/bar/diz'), OBJECT_SIMPLE, null));
		expect(result.length).toEqual(3);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(OBJECT_SIMPLE);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(OBJECT_SIMPLE.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(false);
		expect(result[2].handler).toEqual(OBJECT_SIMPLE.foo.bar);
	});

	it('resolves deep path with callable', () => {
		const result = Array.from(dispatch(path('/foo/bar/baz'), OBJECT_SIMPLE, null));
		expect(result.length).toEqual(4);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(OBJECT_SIMPLE);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(OBJECT_SIMPLE.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(false);
		expect(result[2].handler).toEqual(OBJECT_SIMPLE.foo.bar);

		expect(result[3].path).toEqual('baz');
		expect(result[3].endpoint).toEqual(true);
		expect(result[3].handler).toEqual(OBJECT_SIMPLE.foo.bar.baz);
	});
});

describe('Given an object with protocol', () => {
	const bar = () => 'bar'; // Workaround TS not liking Symbols as keys
	const OBJECT_PROTOCOL_DEEP = {
		foo: {
			bar: {
				[Symbols.dispatch]: bar
			}
		}
	};

	it('resolves shallow path', () => {
		const result = Array.from(dispatch(path('/foo'), OBJECT_PROTOCOL_DEEP, null));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(OBJECT_PROTOCOL_DEEP);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(OBJECT_PROTOCOL_DEEP.foo);
	});

	it('resolves deep path', () => {
		const result = Array.from(dispatch(path('/foo/bar'), OBJECT_PROTOCOL_DEEP, null));
		expect(result.length).toEqual(3);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(OBJECT_PROTOCOL_DEEP);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(OBJECT_PROTOCOL_DEEP.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(true);
		expect(result[2].handler).toEqual(bar);
	});

	it('resolves incomplete deep path', () => {
		const result = Array.from(dispatch(path('/foo/diz'), OBJECT_PROTOCOL_DEEP, null));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(OBJECT_PROTOCOL_DEEP);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(OBJECT_PROTOCOL_DEEP.foo);
	});

	it('resolves deep path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/foo/bar/baz'), OBJECT_PROTOCOL_DEEP, null));
		expect(result.length).toEqual(3);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(OBJECT_PROTOCOL_DEEP);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(OBJECT_PROTOCOL_DEEP.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(true);
		expect(result[2].handler).toEqual(bar);
	});
});

describe('Given an object with functions and protocol', () => {
	const root = () => 'root'; // Workaround TS not liking Symbols as keys
	const CALLABLE_DEEP = {
		[Symbols.dispatch]: root,
		foo: {
			bar: {
				baz: () => 'baz'
			}
		}
	};

	it('resolves root path to protocol', () => {
		const result = Array.from(dispatch(path('/'), CALLABLE_DEEP, null));
		expect(result.length).toEqual(1);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(root);
	});

	it('resolves shallow path', () => {
		const result = Array.from(dispatch(path('/foo'), CALLABLE_DEEP, null));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(CALLABLE_DEEP);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(CALLABLE_DEEP.foo);
	});

	it('resolves deep path to object', () => {
		const result = Array.from(dispatch(path('/foo/bar'), CALLABLE_DEEP, null));
		expect(result.length).toEqual(3);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(CALLABLE_DEEP);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(CALLABLE_DEEP.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(true);
		expect(result[2].handler).toEqual(CALLABLE_DEEP.foo.bar);
	});

	it('resolves incomplete path', () => {
		const result = Array.from(dispatch(path('/foo/diz'), CALLABLE_DEEP, null));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(CALLABLE_DEEP);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(CALLABLE_DEEP.foo);
	});

	it('resolves deep path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/foo/bar/baz'), CALLABLE_DEEP, null));
		expect(result.length).toEqual(4);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(CALLABLE_DEEP);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(CALLABLE_DEEP.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(false);
		expect(result[2].handler).toEqual(CALLABLE_DEEP.foo.bar);

		expect(result[3].path).toEqual('baz');
		expect(result[3].endpoint).toEqual(true);
		expect(result[3].handler()).toEqual('baz');
	});
});

describe('Given a mixed object', () => {
	const MIXED = {
		[Symbols.dispatch]: () => 'root',
		foo: {
			bar: {
				baz: () => 'baz'
			}
		}
	};

	it('resolves root path', () => {
		const result = Array.from(dispatch(path('/'), MIXED, null));
		expect(result.length).toEqual(1);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual((MIXED as any)[Symbols.dispatch]);
	});

	it('resolves shallow path', () => {
		const result = Array.from(dispatch(path('/foo'), MIXED, null));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(MIXED);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(MIXED.foo);
	});

	it('resolves deep path', () => {
		const result = Array.from(dispatch(path('/foo/bar'), MIXED, null));
		expect(result.length).toEqual(3);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(MIXED);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(MIXED.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(true);
		expect(result[2].handler).toEqual(MIXED.foo.bar);
	});

	it('resolves incomplete deep path', () => {
		const result = Array.from(dispatch(path('/foo/diz'), MIXED, null));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(MIXED);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(MIXED.foo);
	});

	it('resolves deep path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/foo/bar/baz'), MIXED, null));
		expect(result.length).toEqual(4);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(MIXED);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(MIXED.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(false);
		expect(result[2].handler).toEqual(MIXED.foo.bar);

		expect(result[3].path).toEqual('baz');
		expect(result[3].endpoint).toEqual(true);
		expect(result[3].handler).toEqual(MIXED.foo.bar.baz);
	});
});
