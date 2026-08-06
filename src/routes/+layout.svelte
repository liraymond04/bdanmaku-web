<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();
</script>

<nav class="border-b border-gray-700 bg-gray-900">
	<div class="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
		<a href="/" class="text-lg font-bold text-white">bdanmaku</a>
		<div class="flex gap-4 text-sm text-gray-400">
			<a href="/" class="hover:text-white transition">Library</a>
			{#if page.data.isAdmin}
				<a href="/admin" class="hover:text-white transition">Dashboard</a>
				<a href="/admin/logout" class="hover:text-white transition">Logout</a>
			{/if}
		</div>
	</div>
</nav>

<main class="mx-auto max-w-6xl px-4 py-6">
	{@render children()}
</main>
