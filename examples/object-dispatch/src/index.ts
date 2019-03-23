import { Application } from '@fuktra/core';
import { Symbols } from '@fuktra/dispatch';

const app = new Application({
	[Symbols.dispatch]: 'root',
	foo: 'foo',
	bar: {
		[Symbols.dispatch]: {
			baz: {
				[Symbols.dispatch]: () => 'baz'
			}
		},
		qux: () => 'qux'
	}
});

app.listen({ port: 8888 });
