<script lang="ts">
	import { page, navigating } from '$app/state';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import NotePopover from '$lib/components/NotePopover.svelte';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		(window as any).dataLayer = (window as any).dataLayer || [];
		(window as any).gtag = function gtag(...args: unknown[]) {
			(window as any).dataLayer.push(args);
		};
		(window as any).gtag('js', new Date());
	});

	$effect(() => {
		if (browser) {
			page.url.pathname;
			(window as any).gtag?.('config', 'G-9RZ0WKK781', {
				page_title: document.title,
				page_path: page.url.pathname,
			});
		}
	});
</script>

<svelte:head>
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-9RZ0WKK781"></script>
</svelte:head>

<nav class="border-b border-gray-700 bg-gray-900">
	<div class="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
		<a href="/" class="text-lg font-bold text-white">bdanmaku</a>
		<div class="flex gap-4 text-sm text-gray-400">
			<a href="/" class="hover:text-white transition">Library</a>
			{#if page.data.isAdmin}
				<a href="/admin" class="hover:text-white transition">Dashboard</a>
				<a href="/admin/settings" class="hover:text-white transition">Settings</a>
				<a href="/admin/logout" class="hover:text-white transition">Logout</a>
			{/if}
		</div>
	</div>
</nav>

{#if navigating.to}
	<div class="fixed top-0 left-0 right-0 z-50 h-0.5 bg-blue-500 animate-pulse"></div>
{/if}

<main class="mx-auto max-w-6xl px-4 py-6">
	{@render children()}
</main>

<NotePopover />
