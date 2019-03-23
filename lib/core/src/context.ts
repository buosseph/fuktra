import http from 'http';

export type ApplicationContext<V = any> = Map<string, V>;

export type RequestContext = {
	request: http.IncomingMessage,
	response: http.ServerResponse
};
