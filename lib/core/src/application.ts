import http from 'http';

import { Context } from './context';
import { dispatch } from './dispatch';
import { Extension, Extensions } from './extensions';

export type RequestContext = {
	request: http.IncomingMessage,
	response: http.ServerResponse
};

export type Endpoint = (context: RequestContext) => any; // Writable chunk = Buffer | string

export interface ApplicationConfig {
	readonly extensions?: Extension[]
}

export interface AppServerConfig {
	readonly port?: number
}

export class Application {
	public config: ApplicationConfig;
	private context: Context;

	private configure = (config: ApplicationConfig): ApplicationConfig => {
		const { extensions = [] } = config;
		return { ...config, extensions };
	}

	/**
	 * 
	 * @param root Object to use as the starting point of dispatch on each request
	 * @param config 
	 */
	public constructor(root: any, config: ApplicationConfig = {}) {
		this.config = this.configure(config);
		this.context = new Map();

		this.context.set('app', this);
		this.context.set('root', root);

		const extensions = new Extensions(this.context);
		this.context.set('extensions', extensions);

		this.context.set('dispatch', dispatch);

		extensions.start(this.context);
	}

	private execute = (context: RequestContext, endpoint: Endpoint) => {
		const isCallable = endpoint instanceof Function;
		if (!isCallable) return endpoint; // To be written into response

		try {
			return endpoint(context);
		}
		catch (error) {
			// TODO: Throw 500 error type
			throw error;
		}
	}

	private respond: http.RequestListener = (request, response) => {
		const context: RequestContext = { request, response };

		const extensions = (this.context as Context<Extensions>).get('extensions');
		if (!extensions) throw new Error('Extensions missing');

		extensions.prepare(this.context);
		extensions.before(this.context);

		const root = this.context.get('root');
		const dispatch = this.context.get('dispatch');

		if (!root) throw new Error('Applicaiton root is missing');
		if (!dispatch) throw new Error('Application dispatch is missing');

		const endpoint = dispatch(root);

		if (!endpoint) {
			context.response.writeHead(404);
			context.response.end();
			return;
		}

		let result;
		try {
			context.response.setHeader('Context-Type', 'text/plain');
			result = this.execute(context, endpoint);
		}
		catch (error) {
			console.error(error);
			context.response.writeHead(500);
			context.response.end();
			return;
		}

		extensions.after(this.context);

		context.response.writeHead(200);
		context.response.write(Buffer.isBuffer(result)
			? result
			: new String(result).valueOf()
		);
		context.response.end();

		// TODO: on 'finish' event on response, send 'done' signal'
		//   - Finish event indicates the response has been sent completely, client may or may have not received

		// TODO: on 'close' event on response, send 'after' signal?
		//   - Close event indicates the HTTP connection was terminated
	}

	/**
	 * Dispatches a request, response pair
	 */
	private handle: http.RequestListener = (request, response) => {
		let buffer: any[] = [];
		request
			.on('error', error => console.error(error.stack))
			.on('data', chunk => buffer.push(chunk))
			.on('end', () => {
				const body = Buffer.concat(buffer).toString();
				// Do something...
				response.on('error', error => console.error(error.stack));
				this.respond(request, response);
			});
	};

	/**
	 * Start HTTP server and listen for connections
	 */
	public listen(config: AppServerConfig = {}) {
		const { port = 8080 } = config;

		const server = http.createServer(this.handle)
			.on('close', () => {
				console.log('Closing server...');
			})
			.on('clientError', (error: Error, socket) => {
				console.error(`Client Error:\n${error.stack}`);
				socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
			})
			.on('error', (error: Error) => {
				// Close event will not be emitted, unless server.close() is manually called here
				// @ts-ignore
				if (error.code === 'EADDRINUSE') {
					console.error('Address in use');
					return;
				}
				console.error(`Server(?) Error:\n${error.stack}`);
			});

		console.log(`Listening on port ${port}...`);
		return server.listen(port);
	}
}
