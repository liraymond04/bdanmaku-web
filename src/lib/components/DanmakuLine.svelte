<script lang="ts">
	import type { ActiveLine } from '$lib/danmaku/renderer';
	import type { ParsedDanmakuLine } from '$lib/danmaku/ass-parser';

	interface Props {
		al: ActiveLine;
		adminMode: boolean;
		onselect?: (line: ParsedDanmakuLine) => void;
		onjump?: (line: ParsedDanmakuLine) => void;
	}

	let { al, adminMode, onselect, onjump }: Props = $props();

	const tx = $derived(al.transform || 'translateX(0%)');
	const noteColor = '#FFFF80';
	const textShadow = '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)';
	let clickTimer: ReturnType<typeof setTimeout> | null = $state(null);

	function handleClick(e: MouseEvent) {
		if (!adminMode) return;
		e.stopPropagation();
		if (clickTimer) {
			clearTimeout(clickTimer);
			clickTimer = null;
			onjump?.(al.line);
		} else {
			clickTimer = setTimeout(() => {
				clickTimer = null;
				onselect?.(al.line);
			}, 250);
		}
	}
</script>

<div
	class="absolute select-none z-10 {al.line.note ? 'danmaku-note-bg' : ''}"
	class:pointer-events-auto={adminMode}
	class:cursor-pointer={adminMode}
	style="left: {al.left}; top: {al.top}; transform: {tx}; display: inline-block;"
	onclick={handleClick}
	onmouseover={() => { if (al.line.note) (window as any).__bdNoteText = al.line.note; }}
	onfocus={() => {}}
	role={adminMode ? 'button' : undefined}
>
	<div style="font-size: {al.fontSize}; color: white; text-shadow: {textShadow}; line-height: 1.1; white-space: nowrap;">
		{al.line.originalText}
	</div>
	{#if al.line.translatedText}
		<div style="font-size: {al.transFontSize}; color: {noteColor}; text-shadow: {textShadow}; line-height: 1.1; white-space: nowrap;">
			{al.line.translatedText}
		</div>
	{/if}
</div>
