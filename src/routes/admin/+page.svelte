<script lang="ts">
	import type { PageServerData } from './$types';
	import { enhance } from '$app/forms';
	import { submitting } from '$lib/stores';

	let { data } = $props();

	let deleteTarget = $state<{ id: number; title: string } | null>(null);
</script>

<svelte:head>
	<title>Admin Dashboard — bdanmaku</title>
</svelte:head>

<h1 class="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each data.vods as vod}
		<div class="rounded-lg border border-gray-700 bg-gray-800 p-4 relative group">
			<a href="/admin/vod/{vod.id}" class="block">
				<h2 class="text-lg font-semibold text-white hover:text-blue-400 transition">
					{#if !vod.visible}
						<span class="text-gray-500">[hidden]</span>
					{/if}
					{vod.title}
				</h2>
			</a>
			<p class="text-xs text-gray-500 mt-1">youtube.com/watch?v={vod.youtubeId}</p>
			<div class="flex items-center justify-between mt-3">
				<div class="flex items-center gap-2">
					<span class="text-xs text-gray-400">{vod.uploadCount} upload{vod.uploadCount !== 1 ? 's' : ''}</span>
					<span class="text-xs text-gray-500">#{vod.sortOrder}</span>
				</div>
				<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
					<form method="POST" action="?/moveUp" use:enhance={() => { submitting.set(true); return async ({ update }) => { await update(); submitting.set(false); }; }} class="inline">
						<input type="hidden" name="id" value={vod.id} />
						<button type="submit" class="cursor-pointer text-xs text-gray-400 hover:text-white px-1">▲</button>
					</form>
					<form method="POST" action="?/moveDown" use:enhance={() => { submitting.set(true); return async ({ update }) => { await update(); submitting.set(false); }; }} class="inline">
						<input type="hidden" name="id" value={vod.id} />
						<button type="submit" class="cursor-pointer text-xs text-gray-400 hover:text-white px-1">▼</button>
					</form>
					<form method="POST" action="?/toggleVisible" use:enhance={() => { submitting.set(true); return async ({ update }) => { await update(); submitting.set(false); }; }} class="inline">
						<input type="hidden" name="id" value={vod.id} />
						<input type="hidden" name="visible" value={vod.visible} />
						<button type="submit" class="cursor-pointer text-xs px-1" class:text-green-400={!!vod.visible} class:text-gray-500={!vod.visible}>
							{vod.visible ? 'Visible' : 'Hidden'}
						</button>
					</form>
					<button
						type="button"
						class="cursor-pointer text-xs text-red-500 hover:text-red-400 px-1"
						onclick={() => deleteTarget = { id: vod.id, title: vod.title }}
					>
						✕
					</button>
				</div>
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

{#if deleteTarget}
	<div class="fixed inset-0 z-50" onkeydown={(e) => { if (e.key === 'Escape') deleteTarget = null; }} role="dialog" aria-modal="true" tabindex="-1">
		<button class="absolute inset-0 bg-black/50 cursor-default" onclick={() => deleteTarget = null} aria-label="Close dialog" tabindex={-1}></button>
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
			<div class="rounded-lg border border-gray-700 bg-gray-800 p-6 max-w-sm w-full space-y-4 pointer-events-auto">
				<h3 class="text-lg font-semibold text-white">Delete VOD?</h3>
				<p class="text-sm text-gray-400">
					This will permanently delete "<span class="text-white">{deleteTarget.title}</span>" and all its uploads and danmaku lines.
				</p>
				<div class="flex justify-end gap-2">
					<button type="button" class="cursor-pointer rounded bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-500" onclick={() => deleteTarget = null}>Cancel</button>
					<form method="POST" action="?/deleteVod" use:enhance={() => { submitting.set(true); return async ({ update }) => { deleteTarget = null; await update(); submitting.set(false); }; }}>
						<input type="hidden" name="id" value={deleteTarget.id} />
						<button type="submit" class="cursor-pointer rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Delete</button>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}
