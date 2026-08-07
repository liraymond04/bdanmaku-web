<script lang="ts">
	import type { ParsedDanmakuLine } from '$lib/danmaku/ass-parser';
	import type { ActiveLine } from '$lib/danmaku/renderer';
	import { createDanmakuRenderer } from '$lib/danmaku/renderer';
	import DanmakuLine from './DanmakuLine.svelte';

	interface Props {
		lines: ParsedDanmakuLine[];
		youtubePlayer: YT.Player | null;
		offsetMs?: number;
		adminMode?: boolean;
		onselect?: (line: ParsedDanmakuLine) => void;
		onjump?: (line: ParsedDanmakuLine) => void;
	}

	let { lines, youtubePlayer, offsetMs = 0, adminMode = false, onselect, onjump }: Props = $props();

	let activeLines: ActiveLine[] = $state([]);
	let containerEl = $state<HTMLDivElement>();

	let renderer = $derived.by(() => {
		if (!youtubePlayer) return null;

		const r = createDanmakuRenderer(
			lines,
			() => youtubePlayer.getCurrentTime() * 1000,
			() => {
				if (!containerEl) return { w: 0, h: 0 };
				return { w: containerEl.clientWidth, h: containerEl.clientHeight };
			},
			offsetMs,
		);

		r.onUpdate((lines) => {
			activeLines = lines;
		});

		return r;
	});

	$effect(() => {
		if (!renderer) return;
		renderer.start();
		return () => renderer.destroy();
	});
</script>

{#if youtubePlayer}
	<div bind:this={containerEl} class="absolute inset-0 overflow-hidden pointer-events-none z-10">
		{#each activeLines as al (al.line.index)}
			<DanmakuLine {al} {adminMode} {onselect} {onjump} />
		{/each}
	</div>
{/if}
