import { dispatch } from '..';

// E.g. "/foo/bar/baz" => ["foo", "bar", "baz"]
const path = (path: string) => path.split('/').filter(value => value);

describe('Given a function', () => {
	const FUNCTION = (...args: any[]) => `function /${args.join('/')}`;

	it('resolves root path', () => {
		const result = Array.from(dispatch(path('/'), FUNCTION));
		expect(result.length).toEqual(1); 
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(FUNCTION);
	});

	it('resolves deep path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/foo/bar/baz'), FUNCTION));
		expect(result.length).toEqual(1); 
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(true);
		expect(result[0].handler).toEqual(FUNCTION);
	});
});

describe('Given an object', () => {
	const OBJECT_SIMPLE = {
		property: 'property',
		foo: { bar: { baz: () => 'baz' } }
	};

	it('does not resolve blacklisted property', () => {
		const result = Array.from(dispatch(path('/foo/bar/getPrototypeOf'), OBJECT_SIMPLE));
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

	it('resolves property', () => {
		const result = Array.from(dispatch(path('/property'), OBJECT_SIMPLE));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(OBJECT_SIMPLE);

		expect(result[1].path).toEqual('property');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(OBJECT_SIMPLE.property);
	});

	it('resolves shallow path', () => {
		const result = Array.from(dispatch(path('/foo'), OBJECT_SIMPLE));
		expect(result.length).toEqual(2);
		
		expect(result[0].path).toEqual(null);
		expect(result[0].endpoint).toEqual(false);
		expect(result[0].handler).toEqual(OBJECT_SIMPLE);

		expect(result[1].path).toEqual('foo');
		expect(result[1].endpoint).toEqual(true);
		expect(result[1].handler).toEqual(OBJECT_SIMPLE.foo);
	});

	it('resolves deep path', () => {
		const result = Array.from(dispatch(path('/foo/bar'), OBJECT_SIMPLE));
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
		const result = Array.from(dispatch(path('/foo/bar/diz'), OBJECT_SIMPLE));
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
		const result = Array.from(dispatch(path('/foo/bar/baz'), OBJECT_SIMPLE));
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

	it('resolves deep path beyond endpoint', () => {
		const result = Array.from(dispatch(path('/foo/bar/baz/qux'), OBJECT_SIMPLE));
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
		expect(result[2].endpoint).toEqual(true);
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