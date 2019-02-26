export interface Extension {
	/** `Extension`s with the following tags may be accessible */
	uses: string[],
	/** `Extension`s with the following tags are requried for operation */
	needs: string[],

	/** This `Extension` should be first, or one of the first, to execute */
	first: boolean,
	/** This `Extension` should be last, or one of the last, to execute */
	last: boolean,

	/** Tags associated with this `Extension` to be recognized in `uses` and `needs` */
	provides: string[],

	/**
	 * `Extension`s with the following tags *must not* be set before this `Extension`
	 *
	 * Useful for enforcing an `Extension` to be a singleton.
	 */
	excludes: string[]
}

export default Extension;
