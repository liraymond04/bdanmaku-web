<script lang="ts">
	import type { ActiveLine } from '$lib/danmaku/renderer';
	import type { ParsedDanmakuLine } from '$lib/danmaku/ass-parser';

	interface Props {
		al: ActiveLine;
		adminMode: boolean;
		onselect?: (line: ParsedDanmakuLine) => void;
	}

	let { al, adminMode, onselect }: Props = $props();

	const noteColor = '#FFFF80';
	const textShadow = '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)';

	function handleClick(e: MouseEvent) {
		if (!adminMode || !onselect) return;
		e.stopPropagation();
		onselect(al.line);
	}
</script>

<div
	class="absolute whitespace-nowrap select-none"
	class:pointer-events-auto={adminMode}
	class:cursor-pointer={adminMode}
	class:hover:opacity-80={adminMode}
	style="left: {al.left}; top: {al.top}; transform: {al.transform};"
	onclick={handleClick}
	role={adminMode ? 'button' : undefined}
	tabindex={adminMode ? 0 : undefined}
>
	<div style="font-size: {al.line.fontSize}px; color: white; text-shadow: {textShadow}; line-height: 1.1;">
		{al.line.originalText}
	</div>
	{#if al.line.translatedText}
		<div style="font-size: {al.line.translatedFontSize}px; color: {noteColor}; text-shadow: {textShadow}; line-height: 1.1;">
			{al.line.translatedText}
		</div>
	{/if}
</div>
