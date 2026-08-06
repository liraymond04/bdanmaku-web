<script lang="ts">
	import type { PageServerData } from './$types';

	let { data } = $props();
	let { vod, uploads } = data;
</script>

<svelte:head>
	<title>Manage: {vod.title} — Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-white">{vod.title}</h1>
			<p class="text-sm text-gray-400">youtube.com/watch?v={vod.youtubeId}</p>
		</div>
		<a href="/admin" class="text-sm text-blue-400 hover:text-blue-300">← Dashboard</a>
	</div>

	<div class="space-y-4">
		<h2 class="text-lg font-semibold text-white">Uploads</h2>

		{#each uploads as upload}
			<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
				<div class="flex items-start justify-between">
					<div class="space-y-1">
						<p class="text-white font-medium">{upload.bilibiliBv}</p>
						<p class="text-xs text-gray-500">{upload.bilibiliUrl}</p>
						<div class="flex gap-4 text-xs text-gray-400 mt-2">
							<span>Offset: {upload.timingOffsetMs}ms</span>
							<span>Lines: {upload.lineCount}</span>
							<span>Status: {upload.status}</span>
						</div>
						{#if upload.sourceLabel}
							<p class="text-xs text-gray-500 mt-1">Source: {upload.sourceLabel}</p>
						{/if}
					</div>
					<div class="flex gap-2">
						<a
							href="/admin/upload/{upload.id}"
							class="hover:cursor-pointer rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
						>
							Edit Lines
						</a>
						<form method="POST" class="inline">
							<input type="hidden" name="uploadId" value={upload.id} />
							<button
								formaction="?/deleteUpload"
								class="hover:cursor-pointer rounded bg-red-700 px-3 py-1 text-xs text-white hover:bg-red-600"
							>
								Delete
							</button>
						</form>
					</div>
				</div>
			</div>
		{/each}

		{#if uploads.length === 0}
			<p class="text-gray-400">No uploads yet.</p>
		{/if}
	</div>

	<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
		<h3 class="text-white font-medium mb-3">Add Upload</h3>
		<form method="POST" action="?/addUpload" class="space-y-3">
			<div class="grid grid-cols-2 gap-3">
				<label class="block">
					<span class="text-xs text-gray-400">Bilibili URL</span>
					<input
						type="url"
						name="bilibiliUrl"
						required
						class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm text-white"
						placeholder="https://www.bilibili.com/video/BV..."
					/>
				</label>
				<label class="block">
					<span class="text-xs text-gray-400">BV ID</span>
					<input
						type="text"
						name="bilibiliBv"
						required
						class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm text-white"
						placeholder="BV1U2ju6SEoM"
					/>
				</label>
				<label class="block">
					<span class="text-xs text-gray-400">Timing Offset (ms)</span>
					<input
						type="number"
						name="timingOffsetMs"
						value="0"
						class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm text-white"
					/>
				</label>
				<label class="block">
					<span class="text-xs text-gray-400">Source Label</span>
					<input
						type="text"
						name="sourceLabel"
						class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm text-white"
						placeholder="Bilibili re-upload by @user"
					/>
				</label>
			</div>
			<label class="block">
				<span class="text-xs text-gray-400">Source Note</span>
				<input
					type="text"
					name="sourceNote"
					class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm text-white"
					placeholder="Auto-translated from Chinese danmaku"
				/>
			</label>
			<button type="submit" class="hover:cursor-pointer rounded bg-green-600 px-4 py-1.5 text-sm text-white hover:bg-green-700">
				Add Upload
			</button>
		</form>
	</div>
</div>
