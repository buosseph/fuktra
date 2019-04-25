import { ExtensionManager, Extension as BaseExtension } from 'kuspe';

import { Application } from './application';
import { ApplicationContext } from './context';

export type SignalType = 'start' | 'prepare' | 'before' | 'run' | 'after' | 'stop';
export type SignalHandler = (context: ApplicationContext) => void | Promise<void>;

export interface Extension extends BaseExtension {
	start?: SignalHandler,
	prepare?: SignalHandler,
	before?: SignalHandler,
	run?: SignalHandler,
	after?: SignalHandler,
	stop?: SignalHandler
}

type SignalHandlers = { [Name in SignalType]: SignalHandler[] };

/** All signal handlers are resolved sequentially; meaning any async handlers will block its following handlers */
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

	public constructor(context: ApplicationContext<Application>) {
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

	// TODO: Test, all promises must resolve sequentially and block following handlers
	// Look at this: https://gist.github.com/anvk/5602ec398e4fdc521e2bf9940fd90f84
	public start(context: ApplicationContext) {
		this.signals.start.reduce((promise, handler) => {
			return promise
				.then(() => { handler(context); })
				.catch(console.error);
		}, Promise.resolve());
	}

	public async prepare(context: ApplicationContext) {
		for await (const handler of this.signals.prepare) {
			handler(context);
		}
	}

	public async before(context: ApplicationContext) {
		for await (const handler of this.signals.before) {
			handler(context);
		}
	}

	public async run(context: ApplicationContext) {
		for await (const handler of this.signals.run) {
			handler(context);
		}
	}

	public async after(context: ApplicationContext) {
		for await (const handler of this.signals.after) {
			handler(context);
		}
	}

	public async stop(context: ApplicationContext) {
		for await (const handler of this.signals.stop) {
			handler(context);
		}
	}
}