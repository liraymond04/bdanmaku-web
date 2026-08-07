<script lang="ts">
	import { page, navigating } from '$app/state';
	import NotePopover from '$lib/components/NotePopover.svelte';
	import GoogleAnalytics from '$lib/components/GoogleAnalytics.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<GoogleAnalytics measurementId="G-9RZ0WKK781" />

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
