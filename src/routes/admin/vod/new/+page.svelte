<svelte:head>
	<title>Add VOD — Admin</title>
</svelte:head>

<div class="max-w-lg">
	<h1 class="text-2xl font-bold text-white mb-6">Add VOD</h1>

	<form method="POST" action="?/create" class="space-y-4">
		<label class="block">
			<span class="text-sm text-gray-400">YouTube URL</span>
			<input
				type="url"
				name="youtubeUrl"
				required
				class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white"
				placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
			/>
		</label>
		<label class="block">
			<span class="text-sm text-gray-400">Title</span>
			<input
				type="text"
				name="title"
				required
				class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white"
			/>
		</label>
		<label class="block">
			<span class="text-sm text-gray-400">Description</span>
			<textarea
				name="description"
				rows={2}
				class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white resize-none"
			></textarea>
		</label>
		<label class="block">
			<span class="text-sm text-gray-400">Thumbnail URL (optional)</span>
			<input
				type="url"
				name="thumbnailUrl"
				class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white"
			/>
		</label>
		<div class="flex gap-3">
			<button type="submit" class="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">
				Create VOD
			</button>
			<a href="/admin" class="rounded bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-500">
				Cancel
			</a>
		</div>
	</form>
</div>
