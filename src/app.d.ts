declare namespace YT {
	class Player {
		constructor(elementId: string, options?: PlayerOptions);
		getCurrentTime(): number;
		seekTo(seconds: number, allowSeekAhead: boolean): void;
		playVideo(): void;
		pauseVideo(): void;
		destroy(): void;
	}

	interface PlayerOptions {
		events?: PlayerEvents;
	}

	interface PlayerEvents {
		onReady?: () => void;
	}
}

declare global {
	interface Window {
		dataLayer: unknown[];
		gtag?: (
			command: 'js' | 'config' | 'event',
			target: string | Date,
			parameters?: Record<string, unknown>
		) => void;
	}
}

export {};
