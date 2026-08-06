<script lang="ts">
	import type { PageServerData } from './$types';

	let { data } = $props();
</script>

<svelte:head>
	<title>bdanmaku — Library</title>
</svelte:head>

<h1 class="text-2xl font-bold text-white mb-6">VOD Library</h1>

{#if data.vods.length === 0}
	<p class="text-gray-400">No VODs yet. Add one from the admin panel.</p>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.vods as vod}
			<a
				href="/watch/{vod.id}"
				class="block rounded-lg border border-gray-700 bg-gray-800 p-4 hover:border-gray-500 transition"
			>
				{#if vod.thumbnailUrl}
					<img src={vod.thumbnailUrl} alt={vod.title} class="w-full rounded mb-3" />
				{/if}
				<h2 class="text-lg font-semibold text-white">{vod.title}</h2>
				{#if vod.description}
					<p class="text-sm text-gray-400 mt-1 line-clamp-2">{vod.description}</p>
				{/if}
				<div class="flex items-center gap-2 mt-3 text-xs text-gray-500">
					<span>{vod.uploadCount} upload{vod.uploadCount !== 1 ? 's' : ''}</span>
				</div>
			</a>
		{/each}
	</div>
{/if}
