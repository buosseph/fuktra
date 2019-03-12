import { peek } from '..';

describe('peek', () => {
	it('handles empty path', () => {
		// '/' => []
		expect(Array.from(peek([])).length).toEqual(0);
	});

	it('handles empty path iterator assignment', () => {
		let prev;
		let curr = null;
		for ([ prev, curr ] of peek([])) { continue; }
		expect([ prev, curr ]).toEqual([ undefined, null ]);
	});

	it('handles tailing slashes', () => {
		// '/foo///' => ['foo', '', '']
		expect(Array.from(peek(['foo', '', ''])).length).toEqual(1);
	});

	it('returns previous path element', () => {
		// '/foo/bar' => ['foo', 'bar']
		const result = Array.from(peek(['foo', 'bar']));
		expect(result.length).toEqual(2); 
		expect(result[0]).toEqual([null, 'foo']);
		expect(result[1]).toEqual(['foo', 'bar']);
	});
});
