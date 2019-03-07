import { peek } from '..';

// E.g. "/foo/bar/baz" => ["foo", "bar", "baz"]
const path = (path: string) => path.split('/');

describe('peek', () => {
	it('handles empty path', () => {
		expect(Array.from(peek([])).length).toEqual(0);
	});

	it('handles empty path iterator assignment', () => {
		let prev;
		let curr = null;
		for ([ prev, curr ] of peek([])) { continue; }
		expect([ prev, curr ]).toEqual([ undefined, null ]);
	});

	it('handles tailing slashes', () => {
		expect(Array.from(peek(path('foo///'))).length).toEqual(1);
	});

	it('returns previous path element', () => {
		const result = Array.from(peek(['a', 'b']));
		expect(result.length).toEqual(2); 
		expect(result[0]).toEqual([null, 'a']);
		expect(result[1]).toEqual(['a', 'b']);
	});
});
