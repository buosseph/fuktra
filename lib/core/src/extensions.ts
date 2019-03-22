import { ExtensionManager, Extension as BaseExtension } from 'kuspe';

import { Application } from './application';
import { Context } from './context';

export interface Extension extends BaseExtension {
	start?: (context: Context) => void,
	prepare?: (context: Context) => void,
	before?: (context: Context) => void,
	run?: (context: Context) => void,
	after?: (context: Context) => void,
	stop?: (context: Context) => void
}

export type SignalType = 'start' | 'prepare' | 'before' | 'run' | 'after' | 'stop';
export type SignalHandler = (context: Context) => void;

type SignalHandlers = { [Name in SignalType]: SignalHandler[] };

export class Extensions extends ExtensionManager<Extension> {
	/** Supported signals */
	public static SIGNALS = new Set<SignalType>([
		'start',
		'prepare',
		'before',
		'run',
		'after',
		'stop'
	]);

	/** Dependency-resolved extensions */
	public all: Extension[];

	/** All signal callbacks provided by extensions */
	public signals: SignalHandlers;

	public constructor(context: Context<Application>) {
		super();

		// Register configured extensions from Context
		const app = context.get('app');
		if (!app) { throw new Error('Application not found in context'); }

		const { extensions: configuredExtensions = [] } = app.config;
		for (const ext of configuredExtensions) {
			this.register(ext);
		}

		// Set active, dependency ordered extensions
		this.all = this.order();

		// Initialize signal handlers map
		this.signals = Array.from(Extensions.SIGNALS)
			.reduce((signals, signal) => ({ ...signals, [signal]: [] }), {}) as SignalHandlers;

		// Add signal handlers provided by each extension, in dependency order
		for (const extension of this.all) {
			for (const signal of (Object.keys(this.signals) as SignalType[])) {
				// Dynamically look up signal in extension and attach
				const handler: SignalHandler | undefined = extension[signal];

				if (handler !== undefined) {
					// Bind extension as execution context for handler
					this.signals[signal].push(handler.bind(extension));
				}
			}
		}
	}

	public start(context: Context) {
		for (const handler of this.signals.start) {
			handler(context);
		}
	}

	public prepare(context: Context) {
		for (const handler of this.signals.prepare) {
			handler(context);
		}
	}

	public before(context: Context) {
		for (const handler of this.signals.before) {
			handler(context);
		}
	}

	public run(context: Context) {
		for (const handler of this.signals.run) {
			handler(context);
		}
	}

	public after(context: Context) {
		for (const handler of this.signals.after) {
			handler(context);
		}
	}

	public stop(context: Context) {
		for (const handler of this.signals.stop) {
			handler(context);
		}
	}
}