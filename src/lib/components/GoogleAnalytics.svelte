<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	interface Props {
		measurementId: string;
	}

	let { measurementId }: Props = $props();

	function initializeAnalytics() {
		window.dataLayer = window.dataLayer || [];

		function gtag(
			command: 'js' | 'config' | 'event',
			target: string | Date,
			parameters?: Record<string, unknown>
		) {
			window.dataLayer.push(arguments);
		}

		window.gtag = gtag;

		gtag('js', new Date());
		gtag('config', measurementId, {
			page_path: page.url.pathname
		});
	}

	function loadScript() {
		if (window.gtag) return;

		const existing = document.querySelector<HTMLScriptElement>(
			`script[data-ga-id="${measurementId}"]`
		);

		if (existing) {
			if (existing.dataset.loaded === 'true') {
				initializeAnalytics();
			} else {
				existing.addEventListener('load', initializeAnalytics, {
					once: true
				});
			}
			return;
		}

		const script = document.createElement('script');
		script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
		script.async = true;
		script.dataset.gaId = measurementId;

		script.addEventListener(
			'load',
			() => {
				script.dataset.loaded = 'true';
				initializeAnalytics();
			},
			{ once: true }
		);

		document.head.appendChild(script);
	}

	onMount(() => {
		loadScript();
	});

	$effect(() => {
		const pathname = page.url.pathname;

		if (!window.gtag) return;

		window.gtag('config', measurementId, {
			page_path: pathname
		});
	});
</script>