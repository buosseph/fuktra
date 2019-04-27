import { Application } from '@fuktra/core';

/**
 * Endpoint accessing request parameters
 *
 * The following CURL commands will have the same parameters accessible
 * in the endpoint, `{ foo: 'bar' }`:
 *
 * Query string parameters
 * `curl -i -X GET http://localhost:8888/parameters?foo=bar`
 *
 * Form-encoded parameters ('Content-Type: application/x-www-form-urlencoded')
 * `curl -i -X POST -H "Content-Type: application/x-www-form-urlencoded" http://localhost:8888/parameters -d 'foo=bar'`
 * `curl -i -X POST http://localhost:8888/parameters -F 'foo=bar'` for `multipart/form-data`
 *
 * JSON-encoded parameters ('Content-Type: application/json')
 * `curl -i -X POST -H "Content-Type: application/json" http://localhost:8888/parameters -d '{ "foo": "bar" }'`
 */
const parameters = ({ parameters }: any) => {
	const response = JSON.stringify(parameters, undefined, '\t');
	console.log(response);
	return response;
};

const app = new Application(parameters);
app.listen({ port: 8888 });
