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
	class="absolute whitespace-nowrap select-none"
	class:pointer-events-auto={adminMode}
	class:cursor-pointer={adminMode}
	style="left: {al.left}; top: {al.top}; transform: {al.transform};"
	onclick={handleClick}
	role={adminMode ? 'button' : undefined}
	tabindex={adminMode ? 0 : undefined}
>
	<div style="font-size: {al.fontSize}; color: white; text-shadow: {textShadow}; line-height: 1.1;">
		{al.line.originalText}
	</div>
	{#if al.line.translatedText}
		<div style="font-size: {al.transFontSize}; color: {noteColor}; text-shadow: {textShadow}; line-height: 1.1;">
			{al.line.translatedText}
		</div>
	{/if}
</div>
