<script lang="ts">
	import type { PageServerData, ActionData } from './$types';
	import type { ParsedDanmakuLine } from '$lib/danmaku/ass-parser';
	import DanmakuOverlay from '$lib/components/DanmakuOverlay.svelte';

	let { data, form } = $props();

	let selectedLineId = $state<number | null>(null);
	let editedText = $state('');
	let noteText = $state('');
	let saving = $state(false);
	let importing = $state(false);
	let searchFilter = $state('');
	let showUntranslated = $state(false);
	let youtubePlayer: YT.Player | null = $state(null);
	let playerReady = $state(false);

	let editingOffset = $state(false);
	let offsetInput = $state(0);
	let effectiveOffset = $state(0);

	$effect(() => {
		effectiveOffset = data.upload.timingOffsetMs ?? 0;
		offsetInput = data.upload.timingOffsetMs ?? 0;
	});



	const parsedLines: ParsedDanmakuLine[] = $derived(
		data.lines.map(l => ({
			layer: l.layer,
			startMs: l.startMs,
			endMs: l.endMs,
			originalText: l.originalText,
			translatedText: l.editedText ?? l.translatedText ?? '',
			positionType: l.positionType as 'move' | 'pos',
			posX: l.posX ?? 0,
			posY: l.posY ?? 0,
			posX2: l.posX2 ?? undefined,
			posY2: l.posY2 ?? undefined,
			anchor: l.anchor ?? 2,
			fontSize: l.fontSize ?? 42,
			translatedFontSize: l.translatedFontSize ?? 29,
			color: l.color ?? '&H66FFFFFF',
			styleTags: l.styleTags ?? '',
		}))
	);

	const filteredLines = $derived(
		parsedLines.filter(l => {
			if (showUntranslated && l.translatedText) return false;
			if (searchFilter && !l.originalText.includes(searchFilter) && !l.translatedText.includes(searchFilter))
				return false;
			return true;
		})
	);

	function seekTo(line: ParsedDanmakuLine) {
		if (!youtubePlayer) return;
		const offsetMs = effectiveOffset;
		const seekTime = (line.startMs - offsetMs) / 1000;
		youtubePlayer.seekTo(Math.max(0, seekTime), true);
		selectLine(line);
	}

	function selectLine(line: ParsedDanmakuLine) {
		selectedLineId = line.startMs;
		const dbLine = data.lines.find(l => l.startMs === line.startMs && l.originalText === line.originalText);
		editedText = dbLine?.editedText ?? dbLine?.translatedText ?? '';
		noteText = dbLine?.noteMarkdown ?? dbLine?.note ?? '';
	}

	function handleOverlaySelect(line: ParsedDanmakuLine) {
		selectLine(line);
		seekTo(line);
	}

	async function saveLine() {
		if (selectedLineId === null) return;
		const dbLine = data.lines.find(l => l.startMs === selectedLineId);
		if (!dbLine) return;

		saving = true;
		await fetch(`/api/danmaku/${dbLine.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ editedText: editedText, note: noteText, noteMarkdown: noteText }),
		});
		saving = false;
	}

	function onYouTubeReady() {
		playerReady = true;
	}

	function formatMs(ms: number): string {
		const s = Math.floor(ms / 1000);
		const m = Math.floor(s / 60);
		const sec = s % 60;
		const frac = Math.floor((ms % 1000) / 10);
		return `${m}:${String(sec).padStart(2, '0')}.${String(frac).padStart(2, '0')}`;
	}

	$effect(() => {
		if (!playerReady) return;

		const tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		document.getElementsByTagName('script')[0]?.parentNode?.insertBefore(tag, document.getElementsByTagName('script')[0]);

		(window as any).onYouTubeIframeAPIReady = () => {
			youtubePlayer = new (window as any).YT.Player('youtube-player-admin', {
				events: { onReady: () => {} },
			});
		};

		return () => {
			delete (window as any).onYouTubeIframeAPIReady;
		};
	});
</script>

<svelte:head>
	<title>Edit: {data.vod.title} — Admin</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold text-white">{data.vod.title}</h1>
			<p class="text-sm text-gray-400">
				Upload:
				<a href={data.upload.bilibiliUrl} target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 hover:underline">
					{data.upload.bilibiliBv} ↗
				</a>
			</p>
			<div class="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
				<span>Offset:</span>
				{#if editingOffset}
					<div class="flex items-center gap-1">
						<input
							type="number"
							bind:value={offsetInput}
							class="w-20 rounded bg-gray-700 border border-gray-600 px-1.5 py-0.5 text-xs text-white"
						/>
						<span class="text-xs">ms</span>
						<button
							type="button"
							class="cursor-pointer rounded bg-green-600 px-1.5 py-0.5 text-xs text-white hover:bg-green-700"
							onclick={async () => {
								await fetch(`/api/upload/${data.upload.id}/set-offset`, {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ offsetMs: offsetInput }),
								});
								effectiveOffset = offsetInput;
								editingOffset = false;
							}}
						>Save</button>
						<button type="button" class="cursor-pointer rounded bg-gray-600 px-1.5 py-0.5 text-xs text-white hover:bg-gray-500" onclick={() => { editingOffset = false; offsetInput = effectiveOffset; }}>
							✕
						</button>
					</div>
				{:else}
					<button class="cursor-pointer text-gray-400 hover:text-white" onclick={() => { editingOffset = true; offsetInput = effectiveOffset; }}>
						{effectiveOffset}ms
					</button>
				{/if}
				{#if selectedLineId !== null && youtubePlayer}
					<button
						type="button"
						class="cursor-pointer text-xs text-blue-400 hover:text-blue-300"
						onclick={() => {
							const videoMs = (youtubePlayer!).getCurrentTime() * 1000;
							offsetInput = Math.round(selectedLineId! - videoMs);
							if (!editingOffset) editingOffset = true;
						}}
					>
						sync selected line to player
					</button>
				{/if}
			</div>
		</div>
		<div class="flex gap-2">
			<a href="/admin/vod/{data.vod.id}" class="text-sm text-blue-400 hover:text-blue-300">← Uploads</a>
		</div>
	</div>

	{#if data.lines.length === 0}
		<div class="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center space-y-4">
			<h2 class="text-lg font-semibold text-white">No danmaku lines imported yet</h2>
			<p class="text-sm text-gray-400">
				Export a translated ASS file from mpv (Ctrl+E), then import it here to populate danmaku lines.
			</p>

			{#if form?.error}
				<p class="text-sm text-red-400">{form.error}</p>
			{/if}
			{#if form?.success}
				<div class="text-sm text-green-400">
					<p>{form.inserted} new lines imported, {form.updated} updated out of {form.total} total.</p>
					<div class="mt-2 w-full bg-gray-700 rounded-full h-2">
						<div class="bg-green-500 h-2 rounded-full" style="width: 100%;"></div>
					</div>
					<a href="." class="underline mt-2 inline-block">Reload to view</a>
				</div>
			{/if}

			<form
				method="POST"
				action="?/importAss"
				enctype="multipart/form-data"
				class="flex items-center justify-center gap-2"
				onsubmit={() => importing = true}
			>
				<input
					type="file"
					name="file"
					accept=".ass"
					required
					disabled={importing}
					class="text-sm text-gray-400 file:mr-2 file:rounded file:bg-gray-700 file:border-0 file:px-3 file:py-1.5 file:text-sm file:text-white"
				/>
				<button
					type="submit"
					disabled={importing}
					class="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{#if importing}
						<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 align-middle"></span>
						Importing...
					{:else}
						Import ASS
					{/if}
				</button>
			</form>
		</div>
	{:else}
		<div class="flex gap-4" style="height: calc(100vh - 180px);">
			<div class="w-1/2 flex flex-col space-y-2">
				<div class="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
					<iframe
						id="youtube-player-admin"
						class="absolute inset-0 w-full h-full"
						src="https://www.youtube.com/embed/{data.vod.youtubeId}?enablejsapi=1&controls=1"
						title={data.vod.title}
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
						onload={onYouTubeReady}
					></iframe>

					<DanmakuOverlay
						lines={parsedLines}
						{youtubePlayer}
						offsetMs={effectiveOffset}
						adminMode={true}
						onselect={handleOverlaySelect}
					/>
				</div>

				<form method="POST" action="?/importAss" enctype="multipart/form-data" class="flex items-center gap-2" onsubmit={() => importing = true}>
					<input
						type="file"
						name="file"
						accept=".ass"
						disabled={importing}
						class="text-xs text-gray-400 file:mr-2 file:rounded file:bg-gray-700 file:border-0 file:px-2 file:py-1 file:text-xs file:text-white"
					/>
					<button type="submit" disabled={importing} class="cursor-pointer rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50">
						{#if importing}
							Importing...
						{:else}
							Re-import ASS
						{/if}
					</button>
				</form>
			</div>

			<div class="w-1/2 flex flex-col space-y-2 overflow-hidden">
				<div class="flex items-center gap-3 text-xs">
					<label class="flex items-center gap-1 text-gray-400">
						<input type="checkbox" bind:checked={showUntranslated} class="rounded" />
						Untranslated only
					</label>
					<input
						type="text"
						bind:value={searchFilter}
						placeholder="Search..."
						class="w-40 rounded bg-gray-700 border border-gray-600 px-2 py-1 text-xs text-white"
					/>
					<span class="text-gray-500">{filteredLines.length} / {data.lines.length} lines</span>
				</div>

				<div class="flex-1 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800">
					<table class="w-full text-xs">
						<thead class="sticky top-0 bg-gray-800">
							<tr class="text-left text-gray-400 border-b border-gray-700">
								<th class="px-2 py-1.5 w-16">Time</th>
								<th class="px-2 py-1.5">Original</th>
								<th class="px-2 py-1.5">Translation</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredLines as line (line.startMs + '-' + line.originalText)}
								{@const dbLine = data.lines.find(l => l.startMs === line.startMs && l.originalText === line.originalText)}
								<tr
									class="border-b border-gray-700 hover:bg-gray-700 cursor-pointer"
									class:bg-gray-700={selectedLineId === line.startMs}
									onclick={() => seekTo(line)}
								>
									<td class="px-2 py-1 text-gray-500 font-mono">
										{formatMs(line.startMs)}
									</td>
									<td class="px-2 py-1 text-white">{line.originalText}</td>
									<td class="px-2 py-1">
										<span class:text-yellow-400={!!dbLine?.editedText} class="text-gray-300">
											{line.translatedText || '—'}
										</span>
										{#if dbLine?.note}
											<span class="ml-1" title={dbLine.note}>📝</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		{#if selectedLineId !== null}
			{@const selLine = parsedLines.find(l => l.startMs === selectedLineId)}
			<div class="rounded-lg border border-gray-700 bg-gray-800 p-3 space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-sm text-white">
						Editing: <span class="text-gray-400">{selLine?.originalText ?? ''}</span>
						at {selLine ? formatMs(selLine.startMs) : ''}
					</span>
					<div class="flex gap-2">
						<button
							onclick={saveLine}
							disabled={saving}
							class="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
						>
							{saving ? 'Saving...' : 'Save'}
						</button>
						<button
							onclick={() => selectedLineId = null}
							class="rounded bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-500"
						>
							Close
						</button>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<label class="block">
						<span class="text-xs text-gray-400">Translation</span>
						<input
							type="text"
							bind:value={editedText}
							class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm text-white"
							placeholder="Edit translation..."
						/>
					</label>
					<label class="block">
						<span class="text-xs text-gray-400">Note (markdown)</span>
						<textarea
							bind:value={noteText}
							rows={2}
							class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm text-white resize-none"
							placeholder="Translation note..."
						></textarea>
					</label>
				</div>
			</div>
		{/if}
	{/if}
</div>
