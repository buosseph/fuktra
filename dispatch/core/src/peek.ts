export function* peek(segments: string[]) {
	// Will be undefined when there are no more segments to yield
	let last: string | null | undefined = null;

	// NOTE: Not really a concern of the iterator, move elsewhere
	// Handle trailing slashes, which will add empty strings to path segments
	while (segments.length && segments[segments.length - 1] === '') {
		segments.pop();
	}

	while (segments.length) {
		yield [ last, segments[0] ] as [string | null, string];
		last = segments.shift();
	}
}
