import Http from 'http';

export type ApplicationContext<V = any> = Map<string, V>;

export type RequestContext = {
	request: Http.IncomingMessage,
	path: string,
	query?: string,
	body?: string,

	response: Http.ServerResponse
};
