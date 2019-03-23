import { Application, Extension } from '@fuktra/core';
import { Symbols } from '@fuktra/dispatch';

const extensions: Extension[] = [
	{
		provides: ['example'],
		uses: [],
		needs: [],
		first: true,
		last: false,
		excludes: [],

		start: () => console.log('Configuring extension...'),
		prepare: context => {
			const request = context.get('request');
			console.log(`HTTP ${request.httpVersion} ${request.method} ${request.url}`);
		},
		before: () => console.log('Dispatching...'),
		after: () => console.log('Sending response...')
	}
];

const root = {
	[Symbols.dispatch]: 'root',
	foo: {
		[Symbols.dispatch]: 'foo',
		bar: () => 'bar'
	}
};

const app = new Application(root, { extensions });
app.listen({ port: 8888 });
