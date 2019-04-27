# Traversal Dispatch

Dispatcher that resolves objects by using property accessors. Using property accessors means properties in the prototype chain are availble in an object; however, if dispatch is attempted on a property provided by a
[standard built-in object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects)
then dispatch will end at the last found object.

```ts
const dispatchable = {
	foo: 'foo',
	bar: {
		baz: () => 'baz'
	},
	qux: [ 'qux' ]
}
```

Supports the `dispatch` symbol provided by `@fuktra/dispatch` to resolve objects.

```ts
import { Symbols } from '@fuktra/dispatch';

const dispatchable = {
	[Symbols.dispatch]: 'root',
	foo: {
		[Symbols.dispatch]: 'foo',
		bar: 'bar'
	}
}
```
