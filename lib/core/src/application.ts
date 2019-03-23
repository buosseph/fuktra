import Http from 'http';
import Url from 'url';
import Querystring from 'querystring';

import { ApplicationContext, RequestContext } from './context';
import { dispatch } from './dispatch';
import { Extension, Extensions } from './extensions';

export type Endpoint = (context: RequestContext) => any; // Writable chunk = Buffer | string

export interface ApplicationConfig {
	readonly extensions?: Extension[]
}

export interface AppServerConfig {
	readonly port?: number
}

export class Application {
	public config: ApplicationConfig;
	private context: ApplicationContext;

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
		this.context = new Map<string, any>();

		this.context.set('app', this);
		this.context.set('root', root);

		const extensions = new Extensions(this.context);
		this.context.set('extensions', extensions);

		extensions.start(this.context);
	}

	private execute = (context: RequestContext, endpoint: any) => {
		// Endpoints can be functions or primitive values that can be cast into strings for a response.
		const isCallable = endpoint instanceof Function;
		if (!isCallable) return endpoint; // To be written into response

		try {
			return (endpoint as Endpoint)(context);
		}
		catch (error) {
			console.error('Error thrown while executing endpoint');
			// TODO: Throw 500 error type
			throw error;
		}
	}

	private arguments = (context: RequestContext) => {
		// 1. Request context is first positional argument
		let args: any[] = [ context ];

		// 2. Remaining path elements are the following positional arguments
		// TODO: Track unconsumed path elements

		const { request: { headers, method }, query = '', body = '' } = context;
		let parameters = {};

		// 3. Query string values are merged into parameters object
		if (method === 'GET') {
			parameters = { ...Querystring.parse(query) };
		}

		// 4. Form-encoded or MIME multipart arguments are merged into parameters object
		if (method === 'POST' && headers['content-type'] === 'multipart/form-data') {
			parameters = { ...parameters, ...Querystring.parse(body) };
		}

		// 5. JSON-encoded arguments in the request body are merged into parameters object
		if (headers['content-type'] === 'application/json') {
			parameters = { ...parameters, ...JSON.parse(body) };
		}

		args = [ ...args, parameters ];

		console.log(args);
	};

	private respond = (context: RequestContext) => {
		const { path, request, response } = context;

		this.context.set('request', request);
		this.context.set('response', response);

		const extensions = (this.context as ApplicationContext<Extensions>).get('extensions');
		if (!extensions) throw new Error('Extensions missing');

		const root = this.context.get('root');
		if (!root) throw new Error('Applicaiton root missing');

		extensions.prepare(this.context);
		extensions.before(this.context);

		const args = this.arguments(context); // TODO: Track unconsumed path elements
		const { isEndpoint, handler } = dispatch(path, root, this.context);

		if (!isEndpoint) {
			console.log('Dispatch failed, responding with HTTP 404 Not Found');
			context.response.writeHead(404);
			context.response.end();
			return;
		}

		let result;
		try {
			context.response.setHeader('Context-Type', 'text/plain');
			result = this.execute(context, handler);
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
	private handle: Http.RequestListener = (request, response) => {
		let buffer: any[] = [];
		request
			.on('error', error => console.error(error.stack))
			.on('data', chunk => buffer.push(chunk))
			.on('end', () => {
				response.on('error', error => console.error(error.stack));

				if (!request.url) throw new Error('Request did not provide path');

				const { pathname = '', query } = Url.parse(request.url);
				const body = Buffer.concat(buffer).toString();

				const context: RequestContext = {
					request,
					response,
					path: pathname,
					query: query || '',
					body
				};

				this.respond(context);
			});
	};

	/**
	 * Start HTTP server and listen for connections
	 */
	public listen(config: AppServerConfig = {}) {
		const { port } = config;

		const server = Http.createServer(this.handle)
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
