<script lang="ts">
	import type { PageServerData } from './$types';
	import type { ParsedDanmakuLine } from '$lib/danmaku/ass-parser';
	import DanmakuOverlay from '$lib/components/DanmakuOverlay.svelte';
	import { parseAssContent } from '$lib/danmaku/ass-parser';

	let { data } = $props();

	let youtubePlayer: YT.Player | null = $state(null);
	let playerReady = $state(false);
	let parsedLines: ParsedDanmakuLine[] = $derived(
		data.assContent ? parseAssContent(data.assContent, 1920, 1080) :
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

	function onYouTubeReady() {
		playerReady = true;
	}

	$effect(() => {
		if (!playerReady) return;

		const tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		const firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

		(window as any).onYouTubeIframeAPIReady = () => {
			youtubePlayer = new (window as any).YT.Player('youtube-player', {
				events: {
					onReady: () => {},
				},
			});
		};

		return () => {
			delete (window as any).onYouTubeIframeAPIReady;
		};
	});
</script>

<svelte:head>
	<title>{data.vod.title} — bdanmaku</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="text-xl font-bold text-white">{data.vod.title}</h1>

	<div class="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden">
		<iframe
			id="youtube-player"
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
			offsetMs={data.timingOffsetMs}
		/>
	</div>

	{#if data.uploads.length > 0}
		<div class="flex flex-col gap-2 text-sm text-gray-400">
			<div class="flex items-center gap-4">
				<span>Upload: {data.uploads[0].bilibiliBv}</span>
				<span>Offset: {data.timingOffsetMs}ms</span>
				<span>{parsedLines.length} danmaku lines</span>
			</div>
			{#if data.uploads[0].sourceLabel}
				<div class="text-xs text-gray-500">
					Source: {data.uploads[0].sourceLabel}
					{#if data.uploads[0].sourceNote} — {data.uploads[0].sourceNote}{/if}
				</div>
			{/if}
		</div>
	{/if}

	{#if data.uploads.length === 0}
		<p class="text-gray-400">No danmaku uploads linked to this VOD yet.</p>
	{/if}
</div>
