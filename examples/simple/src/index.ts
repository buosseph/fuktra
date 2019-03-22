import { Application, Extension } from '@fuktra/core';

const root = () => 'Testing';
const extensions: Extension[] = [
	{
		provides: ['example'],
		uses: [],
		needs: [],
		first: true,
		last: false,
		excludes: [],

		start: () => console.log('Start signal'),
		prepare: () => console.log('Prepare signal'),
		before: () => console.log('Before signal'),
		run: () => console.log('Run signal'),
		after: () => console.log('After signal'),
		stop: () => console.log('Stop signal')
	}
];

const app = new Application(root, { extensions });
app.listen();
