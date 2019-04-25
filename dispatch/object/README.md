# Object Dispatch

Dispatcher that resolves plain objects by lookup up the instance's own properties.

Supports the `dispatch` symbol on object from `@fuktra/dispatch`

```ts
import { Symbols } from '@fuktra/dispatch';

const dispatchable = {
	[Symbols.dispatch]: 'foo'
}
```

Intended for use with plain objects, resolving using it's own properties, rather than lookup the prototype chain.

```ts
const dispatchable = {
	foo: 'foo',
	bar: () => 'bar',
	baz: { [Symbols.dispatch]: 'baz' }
}
```

Will not work with classes unless the properties available for dispatch are associated with the class instance. This
dispatcher will not look up properties in the class constructor or prototype.

```ts
class Dispatchable {
	// Private fields are dispatchable, they are still public after transpilation
	private foo = 'foo';
	public bar = () => 'bar';
	public baz = { [Symbols.dispatch]: 'baz' }
}

class Incorrect {
	// Static properites are in the class constructor, is not an instance property
	static foo = 'foo';

	// Method properties are in the class constructor prototype.
	// Additionally; methods are non-enumerable in Node.js, and enumerable in browsers.
	bar() { return 'bar' }
}
```
