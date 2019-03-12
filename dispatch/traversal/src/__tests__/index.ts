import { Symbols } from '@fuktra/dispatch';
import { dispatch } from '..';

// E.g. "/foo/bar/baz" => ["foo", "bar", "baz"]
const path = (path: string) => path.split('/').filter(value => value !== '');

describe('Given a function', () => {
	const FUNCTION = (...args: any[]) => `function /${args.join('/')}`;

	it('resolves empty path', () => {
		const result = Array.from(dispatch(path('/'), FUNCTION));
		expect(result.length).toEqual(1); 
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(FUNCTION);
	});

	it('resolves insecure path', () => {
		const result = Array.from(dispatch(path('/call'), FUNCTION));
		expect(result.length).toEqual(1);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(FUNCTION);
	});

	it('resolves path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/diz'), FUNCTION));
		expect(result.length).toEqual(1); 
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(FUNCTION);
	});
});

describe('Given an array', () => {
	const ARRAY = [ 'foo' ];

	it('resolves empty path', () => {
		const result = Array.from(dispatch(path('/'), ARRAY));
		expect(result.length).toEqual(1); 
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(ARRAY);
	});

	it('resolves insecure path', () => {
		const result = Array.from(dispatch(path('/0'), ARRAY));
		expect(result.length).toEqual(2);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(ARRAY);

		expect(result[1].path).toEqual('0');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(ARRAY[0]);
	});

	it('resolves path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/diz'), ARRAY));
		expect(result.length).toEqual(1); 
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(ARRAY);
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

describe('Given a shallow class declaration', () => {
	class ShallowClass {
		public foo = 'foo';
		public bar = () => 'bar';
		[Symbols.dispatch]() { return 'root'; }
	};

	const SHALLOW_CLASS = new ShallowClass();

	it('resolves insecure path', () => {
		const result = Array.from(dispatch(path('/hasOwnProperty'), SHALLOW_CLASS));
		expect(result.length).toEqual(1);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(Reflect.get(SHALLOW_CLASS, Symbols.dispatch));
	});

	describe('resolves shallow path', () => {
		it('to dispatch symbol', () => {
			const result = Array.from(dispatch(path('/'), SHALLOW_CLASS));
			expect(result.length).toEqual(1);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(true);
			expect(result[0].handler).toEqual(Reflect.get(SHALLOW_CLASS, Symbols.dispatch));
		});

		it('to static property', () => {
			const result = Array.from(dispatch(path('/foo'), SHALLOW_CLASS));
			expect(result.length).toEqual(2);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(false);
			expect(result[0].handler).toEqual(SHALLOW_CLASS);

			expect(result[1].path).toEqual('foo');
			expect(result[1].endpoint).toEqual(true);
			expect(result[1].handler).toEqual(SHALLOW_CLASS.foo);
		});

		it('to function property', () => {
			const result = Array.from(dispatch(path('/bar'), SHALLOW_CLASS));
			expect(result.length).toEqual(2);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(false);
			expect(result[0].handler).toEqual(SHALLOW_CLASS);

			expect(result[1].path).toEqual('bar');
			expect(result[1].endpoint).toEqual(true);
			expect(result[1].handler).toEqual(SHALLOW_CLASS.bar);
		});
	});

	it('resolves incomplete path', () => {
		const result = Array.from(dispatch(path('/diz'), SHALLOW_CLASS, null));
		expect(result.length).toEqual(1);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(Reflect.get(SHALLOW_CLASS, Symbols.dispatch));
	});

	it('resolves path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/foo/diz'), SHALLOW_CLASS, null));
		expect(result.length).toEqual(2);
	
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(SHALLOW_CLASS);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(SHALLOW_CLASS.foo);
	});
});

describe('Given a deep class declaration', () => {
	class DeepClass {
		public foo = new class {
			public bar = new class {
				public baz = 'baz';
				public qux = () => 'qux';
				[Symbols.dispatch]() { return 'bar'; }
			}
		}
	};

	const DEEP_CLASS = new DeepClass();

	it('resolves insecure path', () => {
		const result = Array.from(dispatch(path('/hasOwnProperty'), DEEP_CLASS));
		expect(result.length).toEqual(1);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(DEEP_CLASS);
	});

	it('resolves a shallow path', () => {
		const result = Array.from(dispatch(path('/foo'), DEEP_CLASS));
		expect(result.length).toEqual(2);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(DEEP_CLASS);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(DEEP_CLASS.foo);
	});

	describe('resolves a deep path', () => {
		it('to dispatch symbol', () => {
			const result = Array.from(dispatch(path('/foo/bar'), DEEP_CLASS));
			expect(result.length).toEqual(3);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(false);
			expect(result[0].handler).toEqual(DEEP_CLASS);

			expect(result[1].path).toEqual('foo');
			expect(result[1].endpoint).toEqual(false);
			expect(result[1].handler).toEqual(DEEP_CLASS.foo);

			expect(result[2].path).toEqual('bar');
			expect(result[2].endpoint).toEqual(true);
			expect(result[2].handler).toEqual(Reflect.get(DEEP_CLASS.foo.bar, Symbols.dispatch));
		});

		it('to static property', () => {
			const result = Array.from(dispatch(path('/foo/bar/baz'), DEEP_CLASS));
			expect(result.length).toEqual(4);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(false);
			expect(result[0].handler).toEqual(DEEP_CLASS);

			expect(result[1].path).toEqual('foo');
			expect(result[1].endpoint).toEqual(false);
			expect(result[1].handler).toEqual(DEEP_CLASS.foo);

			expect(result[2].path).toEqual('bar');
			expect(result[2].endpoint).toEqual(false);
			expect(result[2].handler).toEqual(DEEP_CLASS.foo.bar);

			expect(result[3].path).toEqual('baz');
			expect(result[3].endpoint).toEqual(true);
			expect(result[3].handler).toEqual(DEEP_CLASS.foo.bar.baz);
		});

		it('to function property', () => {
			const result = Array.from(dispatch(path('/foo/bar/qux'), DEEP_CLASS));
			expect(result.length).toEqual(4);

			expect(result[0].path).toEqual(null);
			expect(result[0].endpoint).toEqual(false);
			expect(result[0].handler).toEqual(DEEP_CLASS);

			expect(result[1].path).toEqual('foo');
			expect(result[1].endpoint).toEqual(false);
			expect(result[1].handler).toEqual(DEEP_CLASS.foo);

			expect(result[2].path).toEqual('bar');
			expect(result[2].endpoint).toEqual(false);
			expect(result[2].handler).toEqual(DEEP_CLASS.foo.bar);

			expect(result[3].path).toEqual('qux');
			expect(result[3].endpoint).toEqual(true);
			expect(result[3].handler).toEqual(DEEP_CLASS.foo.bar.qux);
		});
	});

	it('resolves incomplete path', () => {
		const result = Array.from(dispatch(path('/foo/diz'), DEEP_CLASS, null));
		expect(result.length).toEqual(2);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(DEEP_CLASS);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(DEEP_CLASS.foo);
	});

	it('resolves path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/foo/bar/baz/qux'), DEEP_CLASS, null));
		expect(result.length).toEqual(4);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(DEEP_CLASS);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(DEEP_CLASS.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(false);
		expect(result[2].handler).toEqual(DEEP_CLASS.foo.bar);

		expect(result[3].path).toEqual('baz');
		expect(result[3].endpoint).toEqual(true);
		expect(result[3].handler).toEqual(DEEP_CLASS.foo.bar.baz);
	});
});








describe('Given a class declaration', () => {
	class ClassDeclaration {
		foo = { bar: { baz: () => 'baz' } }

		method() { return 'method'; }
	};

	const CLASS_DECLARATION = new ClassDeclaration();

	it('does not resolve blacklisted property', () => {
		const result = Array.from(dispatch(path('/foo/bar/getPrototypeOf'), CLASS_DECLARATION));
		expect(result.length).toEqual(3);

		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(CLASS_DECLARATION);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(CLASS_DECLARATION.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(false);
		expect(result[2].handler).toEqual(CLASS_DECLARATION.foo.bar);
	});

	it('resolves method', () => {
		const result = Array.from(dispatch(path('/method'), CLASS_DECLARATION));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(CLASS_DECLARATION);

		expect(result[1].path).toEqual('method');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(CLASS_DECLARATION.method);
	});

	it('resolves shallow path', () => {
		const result = Array.from(dispatch(path('/foo'), CLASS_DECLARATION));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(CLASS_DECLARATION);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(CLASS_DECLARATION.foo);
	});

	it('resolves deep path', () => {
		const result = Array.from(dispatch(path('/foo/bar'), CLASS_DECLARATION));
		expect(result.length).toEqual(3);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(CLASS_DECLARATION);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(CLASS_DECLARATION.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(true);
		expect(result[2].handler).toEqual(CLASS_DECLARATION.foo.bar);
	});

	it('resolves incomplete deep path', () => {
		const result = Array.from(dispatch(path('/foo/bar/diz'), CLASS_DECLARATION));
		expect(result.length).toEqual(3);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(CLASS_DECLARATION);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(CLASS_DECLARATION.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(false);
		expect(result[2].handler).toEqual(CLASS_DECLARATION.foo.bar);
	});

	it('resolves deep path with callable', () => {
		const result = Array.from(dispatch(path('/foo/bar/baz'), CLASS_DECLARATION));
		expect(result.length).toEqual(4);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(CLASS_DECLARATION);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(CLASS_DECLARATION.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(false);
		expect(result[2].handler).toEqual(CLASS_DECLARATION.foo.bar);

		expect(result[3].path).toEqual('baz');
		expect(result[3].endpoint).toEqual(true);
		expect(result[3].handler).toEqual(CLASS_DECLARATION.foo.bar.baz);
	});

	it('resolves deep path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/foo/bar/baz/qux'), CLASS_DECLARATION));
		expect(result.length).toEqual(4);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(CLASS_DECLARATION);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(false);
		expect(result[1].handler).toEqual(CLASS_DECLARATION.foo);

		expect(result[2].path).toEqual('bar');
		expect(result[2].endpoint).toEqual(false);
		expect(result[2].handler).toEqual(CLASS_DECLARATION.foo.bar);

		expect(result[3].path).toEqual('baz');
		expect(result[3].endpoint).toEqual(true);
		expect(result[3].handler).toEqual(CLASS_DECLARATION.foo.bar.baz);
	});
});