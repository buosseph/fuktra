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
			console.log(`HTTP ${request.httpVersion} ${request.method} ${request.url}\n${JSON.stringify(request.headers, undefined, '\t')}`);
		},
		before: () => console.log('Dispatching...'),
		after: () => console.log('Sending response...')
	}
];

const index = () => 'Hello world';

const context = ({ context: { request } }: any) => {
	const response = `HTTP ${request.httpVersion} ${request.method} ${request.url}`;
	console.log(response);
	return response;
};

const args = ({ args }: any) => {
	const response = `Path arguments: ${args}`;
	console.log(response);
	return response;
};

const parameters = ({ parameters }: any) => {
	const response = `Parameters: ${JSON.stringify(parameters, undefined, '\t')}`;
	console.log(response);
	return response;
};

const root = {
	[Symbols.dispatch]: index,
	context,
	'arguments': args,
	parameters
};

const app = new Application(root, { extensions });
app.listen({ port: 8888 });
