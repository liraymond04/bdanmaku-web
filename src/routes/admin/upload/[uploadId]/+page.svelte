<script lang="ts">
	import type { PageServerData, ActionData } from './$types';
	import type { ParsedDanmakuLine } from '$lib/danmaku/ass-parser';
	import DanmakuOverlay from '$lib/components/DanmakuOverlay.svelte';
	import { enhance } from '$app/forms';
	import SvelteMarkdown from '@humanspeak/svelte-markdown';
	import { markdownRenderers } from '$lib/markdown/renderers';

	let { data, form } = $props();

	let selectedLineId = $state<number | null>(null);
	let editedText = $state('');
	let noteText = $state('');
	let saving = $state(false);
	let importing = $state(false);
	let importStep = $state('');
	let importCurrent = $state(0);
	let importTotal = $state(0);
	let importError = $state('');
	let importResult = $state<{ inserted: number; updated: number; total: number } | null>(null);
	let searchFilter = $state('');
	let showUntranslated = $state(false);
	let youtubePlayer: YT.Player | null = $state(null);

	let editingOffset = $state(false);
	let offsetInput = $state(0);
	let effectiveOffset = $state(0);

	$effect(() => {
		effectiveOffset = data.upload.timingOffsetMs ?? 0;
		offsetInput = data.upload.timingOffsetMs ?? 0;
	});



	const parsedLines: ParsedDanmakuLine[] = $derived(
		data.lines.map(l => {
			const ov = lineOverrides.get(l.id);
			return {
			index: l.id,
			layer: l.layer,
			startMs: l.startMs,
			endMs: l.endMs,
			originalText: l.originalText,
			translatedText: ov?.editedText ?? l.editedText ?? l.translatedText ?? '',
			note: ov?.note ?? l.noteMarkdown ?? l.note,
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
		}})
	);

	const filteredLines = $derived(
		parsedLines.filter(l => {
			if (showUntranslated && l.translatedText) return false;
			if (searchFilter && !l.originalText.includes(searchFilter) && !l.translatedText.includes(searchFilter))
				return false;
			return true;
		})
	);

	function jumpTo(line: ParsedDanmakuLine) {
		if (!youtubePlayer) return;
		const seekTime = (line.startMs - effectiveOffset) / 1000;
		youtubePlayer.seekTo(Math.max(0, seekTime), true);
		selectLine(line);
	}

	function selectLine(line: ParsedDanmakuLine) {
		selectedLineId = line.index;
		const ov = lineOverrides.get(line.index);
		const dbLine = data.lines.find(l => l.startMs === line.startMs && l.originalText === line.originalText);
		editedText = ov?.editedText ?? dbLine?.editedText ?? dbLine?.translatedText ?? '';
		noteText = ov?.note ?? dbLine?.noteMarkdown ?? dbLine?.note ?? '';
	}

	function handleOverlaySelect(line: ParsedDanmakuLine) {
		selectLine(line);
	}

	function handleOverlayJump(line: ParsedDanmakuLine) {
		selectLine(line);
		jumpTo(line);
	}

	async function saveLine() {
		if (selectedLineId === null) return;
		const dbLine = data.lines.find(l => l.id === selectedLineId);
		if (!dbLine) return;

		saving = true;
		await fetch(`/api/danmaku/${dbLine.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ editedText: editedText, note: noteText, noteMarkdown: noteText }),
		});
		dbLine.editedText = editedText || null;
		dbLine.note = noteText || null;
		dbLine.noteMarkdown = noteText || null;
		lineOverrides = new Map(lineOverrides.set(dbLine.id, { editedText: editedText || undefined, note: noteText || undefined }));
		saving = false;
	}

	let notePreview = $state(false);
	let clickTimer: ReturnType<typeof setTimeout> | null = $state(null);
	let lineOverrides = $state(new Map<number, { editedText?: string; note?: string }>());



	function handleLineClick(line: ParsedDanmakuLine) {
		if (clickTimer) {
			clearTimeout(clickTimer);
			clickTimer = null;
			jumpTo(line);
		} else {
			clickTimer = setTimeout(() => {
				clickTimer = null;
				selectLine(line);
			}, 250);
		}
	}

	async function doImport(file: File) {
		importing = true;
		importError = '';
		importResult = null;
		importStep = 'uploading';
		importCurrent = 0;
		importTotal = 0;

		const fd = new FormData();
		fd.append('file', file);

		const res = await fetch(`/api/upload/${data.upload.id}/import-stream`, { method: 'POST', body: fd });
		const reader = res.body?.getReader();
		if (!reader) { importError = 'No response'; importing = false; return; }

		const decoder = new TextDecoder();
		let buf = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buf += decoder.decode(value, { stream: true });

			const lines = buf.split('\n');
			buf = lines.pop() || '';

			for (const line of lines) {
				if (!line.trim()) continue;
				try {
					const evt = JSON.parse(line);
					importStep = evt.step;
					if (evt.step === 'importing') { importCurrent = evt.current; importTotal = evt.total; }
					if (evt.step === 'done') { importResult = evt; importing = false; if (data.lines.length === 0) window.location.reload(); }
					if (evt.step === 'error') { importError = evt.message; importing = false; }
				} catch {}
			}
		}
		if (importing) importing = false;
	}

	function formatMs(ms: number): string {
		const s = Math.floor(ms / 1000);
		const m = Math.floor(s / 60);
		const sec = s % 60;
		const frac = Math.floor((ms % 1000) / 10);
		return `${m}:${String(sec).padStart(2, '0')}.${String(frac).padStart(2, '0')}`;
	}

	$effect(() => {
		if ((window as any).YT?.Player) {
			const player = new (window as any).YT.Player('youtube-player-admin', {
				videoId: data.vod.youtubeId,
				playerVars: { origin: window.location.origin },
				events: { onReady: () => { youtubePlayer = player; } },
			});
			return () => { player.destroy(); youtubePlayer = null; };
		}

		const tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		document.head.appendChild(tag);

		(window as any).onYouTubeIframeAPIReady = () => {
			const player = new (window as any).YT.Player('youtube-player-admin', {
				videoId: data.vod.youtubeId,
				playerVars: { origin: window.location.origin },
				events: { onReady: () => { youtubePlayer = player; } },
			});
		};

		return () => {
			delete (window as any).onYouTubeIframeAPIReady;
			if (youtubePlayer) youtubePlayer.destroy();
			youtubePlayer = null;
		};
	});
</script>

<svelte:head>
	<title>Edit: {data.vod.title} - bdanmaku-web</title>
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
					{@const selLine = parsedLines.find(l => l.index === selectedLineId)}
					{#if selLine}
					<button
						type="button"
						class="cursor-pointer text-xs text-blue-400 hover:text-blue-300"
						onclick={() => {
							const videoMs = youtubePlayer!.getCurrentTime() * 1000;
							offsetInput = Math.round(selLine.startMs - videoMs);
							if (!editingOffset) editingOffset = true;
						}}
					>
						sync selected line to player
					</button>
					{/if}
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

			{#if importError}
				<p class="text-sm text-red-400">{importError}</p>
			{/if}
			{#if importResult}
				<div class="text-sm text-green-400 space-y-2">
					<p class="font-medium">Import complete — {importResult.inserted} new, {importResult.updated} updated, {importResult.total} total</p>
					<div class="w-full bg-gray-700 rounded-full h-2.5">
						<div class="bg-green-500 h-2.5 rounded-full" style="width: 100%;"></div>
					</div>
				</div>
			{/if}

			{#if importing}
				<div class="text-sm text-blue-400 space-y-2">
					<div class="flex items-center justify-center gap-2">
						<span class="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
						{importStep === 'uploading' ? 'Uploading file...' :
						 importStep === 'parse' ? 'Parsing ASS...' :
						 importStep === 'checking' ? 'Checking existing lines...' :
						 importStep === 'importing' ? `Importing ${importCurrent} / ${importTotal}` :
						 importStep === 'saving' ? 'Saving to database...' :
						 'Processing...'}
					</div>
					{#if importTotal > 0}
						<div class="w-full bg-gray-700 rounded-full h-2.5">
							<div class="bg-blue-400 h-2.5 rounded-full transition-all" style="width: {Math.round((importCurrent / importTotal) * 100)}%;"></div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="flex items-center justify-center gap-2">
					<input
						type="file"
						accept=".ass"
						onchange={(e) => {
							const f = (e.target as HTMLInputElement).files?.[0];
							if (f) doImport(f);
						}}
						class="text-sm text-gray-400 file:mr-2 file:rounded file:bg-gray-700 file:border-0 file:px-3 file:py-1.5 file:text-sm file:text-white file:cursor-pointer"
					/>
				</div>
			{/if}
		</div>
	{:else}
		<div class="flex gap-4" style="height: calc(100vh - 180px);">
			<div class="w-1/2 flex flex-col space-y-2 overflow-y-auto">
				<div class="relative w-full aspect-video bg-black rounded-lg overflow-hidden shrink-0">
					<div
						id="youtube-player-admin"
						class="absolute inset-0 w-full h-full"
					></div>

					<DanmakuOverlay
						lines={parsedLines}
						{youtubePlayer}
						offsetMs={effectiveOffset}
						adminMode={true}
						onselect={handleOverlaySelect}
						onjump={handleOverlayJump}
					/>
				</div>

				<div class="flex items-center gap-2 shrink-0">
					{#if importing}
						<div class="text-xs text-blue-400 flex items-center gap-1">
							<span class="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
							{importStep === 'importing' ? `${importCurrent}/${importTotal}` : importStep}
						</div>
						{#if importTotal > 0}
							<div class="flex-1 bg-gray-700 rounded-full h-1.5 max-w-32">
								<div class="bg-blue-400 h-1.5 rounded-full transition-all" style="width: {Math.round((importCurrent / importTotal) * 100)}%;"></div>
							</div>
						{/if}
					{:else if importResult}
						<span class="text-xs text-green-400">{importResult.inserted} new, {importResult.updated} updated</span>
					{:else if importError}
						<span class="text-xs text-red-400">{importError}</span>
					{/if}
					<input
						type="file"
						accept=".ass"
						onchange={(e) => {
							const f = (e.target as HTMLInputElement).files?.[0];
							if (f) doImport(f);
						}}
						class="text-xs text-gray-400 file:mr-2 file:rounded file:bg-gray-700 file:border-0 file:px-2 file:py-1 file:text-xs file:text-white file:cursor-pointer"
					/>
				</div>

				{#if selectedLineId !== null}
					{@const selLine = parsedLines.find(l => l.index === selectedLineId)}
					<div class="rounded-lg border border-gray-700 bg-gray-800 p-3 space-y-3 shrink-0">
						<div class="flex items-center justify-between">
							<span class="text-xs text-white">
								Editing <span class="text-gray-400">{selLine?.originalText ?? ''}</span>
								<span class="text-gray-500"> at {selLine ? formatMs(selLine.startMs) : ''}</span>
							</span>
							<div class="flex gap-2">
								<button
									onclick={saveLine}
									disabled={saving}
									class="cursor-pointer rounded bg-green-600 px-2 py-0.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
								>
									{saving ? 'Saving...' : 'Save'}
								</button>
								<button
									onclick={() => { selectedLineId = null; notePreview = false; }}
									class="cursor-pointer rounded bg-gray-600 px-2 py-0.5 text-xs text-white hover:bg-gray-500"
								>
									✕
								</button>
							</div>
						</div>

						<label class="block">
							<span class="text-xs text-gray-400">Translation</span>
							<textarea
								bind:value={editedText}
								rows={2}
								class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm text-white resize-none"
								placeholder="Edit translation..."
							></textarea>
						</label>

						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-xs text-gray-400">Note</span>
								<button
									class="cursor-pointer text-xs text-blue-400 hover:text-blue-300"
									onclick={() => notePreview = !notePreview}
								>
									{notePreview ? 'Edit' : 'Preview'}
								</button>
							</div>
							{#if notePreview}
								<div class="rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-xs text-gray-300 min-h-12 max-w-none">
									{#if noteText}
										<SvelteMarkdown source={noteText} renderers={markdownRenderers as any} />
									{:else}
										<span class="text-gray-500 italic">Nothing to preview</span>
									{/if}
								</div>
							{:else}
								<textarea
									bind:value={noteText}
									rows={3}
									class="w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-xs text-white resize-none font-mono"
									placeholder="Add context or translation notes (markdown)..."
								></textarea>
							{/if}
						</div>
					</div>
				{/if}
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
							{#each filteredLines as line (line.index)}
								{@const dbLine = data.lines.find(l => l.startMs === line.startMs && l.originalText === line.originalText)}
								<tr
									class="border-b border-gray-700 hover:bg-gray-700 cursor-pointer"
								class:bg-gray-700={selectedLineId === line.index}
								onclick={() => handleLineClick(line)}
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
	{/if}
</div>
