<script lang="ts">
	import type { PageServerData } from './$types';

	let { data } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard — bdanmaku</title>
</svelte:head>

<h1 class="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each data.vods as vod}
		<div class="rounded-lg border border-gray-700 bg-gray-800 p-4 relative group">
			<a href="/admin/vod/{vod.id}" class="block">
				<h2 class="text-lg font-semibold text-white hover:text-blue-400 transition">{vod.title}</h2>
			</a>
			<p class="text-xs text-gray-500 mt-1">youtube.com/watch?v={vod.youtubeId}</p>
			<div class="flex items-center justify-between mt-3">
				<span class="text-xs text-gray-400">{vod.uploadCount} upload{vod.uploadCount !== 1 ? 's' : ''}</span>
				<form method="POST" action="?/deleteVod">
					<input type="hidden" name="id" value={vod.id} />
					<button
						type="submit"
						class="text-xs text-red-500 hover:text-red-400 hover:cursor-pointer opacity-0 group-hover:opacity-100 transition"
						onclick={(e) => { if (!confirm('Delete VOD and all its uploads?')) e.preventDefault(); }}
					>
						Delete
					</button>
				</form>
			</div>
		</div>
	{/each}
</div>

<div class="mt-8">
	<a
		href="/admin/vod/new"
		class="inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition"
	>
		+ Add VOD
	</a>
</div>
