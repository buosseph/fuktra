import Http from 'http';
import Url from 'url';
import Querystring from 'querystring';
import MimeType from 'whatwg-mimetype';

import { ApplicationContext, RequestContext } from './context';
import { dispatch } from './dispatch';
import { Extension, Extensions } from './extensions';

export type Endpoint = (args: {
	context: RequestContext,
	args?: string[],
	parameters?: { [key: string]: string }
}) => any; // Writable chunk = Buffer | string

/** Parses the given `RequestContext` for parameter provided by the query string and request body */
const parseParameters = (context: RequestContext) => {
	const { request: { headers, method }, query = '', body = '' } = context;
	const mime = MimeType.parse(headers['content-type'] || '');
	let parameters = {};

	// TODO: Update querystring paring to support arrays and objects

	// 1. Query string values are merged into parameters object
	if (method === 'GET') {
		parameters = { ...Querystring.parse(query) };
	}

	if (mime === null) { return parameters; }

	// 2. Form-encoded or MIME multipart arguments are merged into parameters object
	if (
		method === 'POST'
		&& [
			'multipart/form-data',
			'application/x-www-form-urlencoded',
			'text/plain'
		].includes(mime.essence)
	) {
		// TODO: Debug multipart/form-data, using curl -F …
		parameters = { ...parameters, ...Querystring.parse(body) };
	}

	// 3. JSON-encoded arguments in the request body are merged into parameters object
	if (mime.essence === 'application/json') {
		parameters = { ...parameters, ...JSON.parse(body) };
	}

	return parameters;
};

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
		if (!(endpoint instanceof Function)) return endpoint; // To be written into response

		try {
			// TODO: Get args from unconsumed path elements
			const args: string[] = [];
			const parameters = parseParameters(context);
			return (endpoint as Endpoint)({ context, args, parameters });
		}
		catch (error) {
			console.error('Error thrown while executing endpoint');
			// TODO: Throw 500 error type
			throw error;
		}
	}

	private respond = async (context: RequestContext) => {
		const { path, request, response } = context;

		this.context.set('request', request);
		this.context.set('response', response);

		const extensions = (this.context as ApplicationContext<Extensions>).get('extensions');
		if (!extensions) throw new Error('Extensions missing');

		const root = this.context.get('root');
		if (!root) throw new Error('Applicaiton root missing');

		await extensions.prepare(this.context);
		await extensions.before(this.context);

		// NOTE: App dispatch can write remaining path elements into app context
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

		await extensions.after(this.context);

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
			.on('end', async () => {
				response.on('error', error => console.error(error.stack));

				if (!request.url) throw new Error('Request did not provide path');

				const { pathname = '', query } = Url.parse(request.url);
				const body = Buffer.concat(buffer).toString(); // NOTE: Keep as buffer type?

				const context: RequestContext = {
					request,
					response,
					path: pathname,
					query: query || '',
					body
				};

				await this.respond(context);
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
