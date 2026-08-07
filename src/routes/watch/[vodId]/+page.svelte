<script lang="ts">
	import type { PageServerData } from './$types';
	import type { ParsedDanmakuLine } from '$lib/danmaku/ass-parser';
	import DanmakuOverlay from '$lib/components/DanmakuOverlay.svelte';

	let { data } = $props();

	let youtubePlayer: YT.Player | null = $state(null);

	let parsedLines: ParsedDanmakuLine[] = $derived(
		data.lines.map(l => ({
			index: l.id,
			layer: l.layer,
			startMs: l.startMs,
			endMs: l.endMs,
			originalText: l.originalText,
			translatedText: l.editedText ?? l.translatedText ?? '',
			note: l.noteMarkdown ?? l.note,
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

	$effect(() => {
		const tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		document.head.appendChild(tag);

		(window as any).onYouTubeIframeAPIReady = () => {
			const player = new (window as any).YT.Player('youtube-player', {
				videoId: data.vod.youtubeId,
				playerVars: { origin: window.location.origin },
				events: {
					onReady: () => { youtubePlayer = player; },
				},
			});
		};

		return () => {
			delete (window as any).onYouTubeIframeAPIReady;
			if (youtubePlayer) youtubePlayer.destroy();
		};
	});
</script>

<svelte:head>
	<title>{data.vod.title} - bdanmaku-web</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="text-xl font-bold text-white">{data.vod.title}</h1>

	<div class="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
		<div
			id="youtube-player"
			class="absolute inset-0 w-full h-full"
		></div>

		<DanmakuOverlay
			lines={parsedLines}
			{youtubePlayer}
			offsetMs={data.timingOffsetMs}
		/>
	</div>

	{#if data.activeUpload}
		<div class="flex flex-col gap-2 text-sm text-gray-400">
			<div class="flex items-center gap-4 flex-wrap">
				{#if data.uploads.length > 1}
					<div class="flex items-center gap-1">
						<span class="text-gray-500">Upload:</span>
						<select
							class="rounded bg-gray-700 border border-gray-600 px-2 py-0.5 text-xs text-white"
							onchange={(e) => window.location.search = 'upload=' + (e.target as HTMLSelectElement).value}
						>
							{#each data.uploads as u}
								<option value={u.id} selected={u.id === data.activeUpload?.id}>
									{u.bilibiliBv}
								</option>
							{/each}
						</select>
					</div>
				{:else}
					<a
						href={data.activeUpload.bilibiliUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="text-blue-400 hover:text-blue-300 hover:underline"
					>
						{data.activeUpload.bilibiliBv} ↗
					</a>
				{/if}
				<span>Offset: {data.timingOffsetMs}ms</span>
				<span>{parsedLines.length} danmaku lines</span>
			</div>
			{#if data.activeUpload.sourceLabel}
				<div class="text-xs text-gray-500">
					Source: {data.activeUpload.sourceLabel}
					{#if data.activeUpload.sourceNote} — {data.activeUpload.sourceNote}{/if}
				</div>
			{/if}
			{#if parsedLines.length === 0}
				<p class="text-xs text-yellow-400">
					No danmaku lines imported yet. Import an ASS file from the admin panel.
				</p>
			{/if}
		</div>
	{:else}
		<p class="text-gray-400">No danmaku uploads linked to this VOD yet.</p>
	{/if}
</div>
