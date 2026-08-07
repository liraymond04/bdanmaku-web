<script lang="ts">
	import SvelteMarkdown from "@humanspeak/svelte-markdown";
	import { markdownRenderers } from "$lib/markdown/renderers";

	let visible = $state(false);
	let noteText = $state("");
	let anchorX = $state(0); // desired center x from the trigger element
	let y = $state(0);
	let maxH = $state(0);
	let below = $state(true);
	let popoverEl: HTMLDivElement | undefined = $state();

	let phase = $state<"idle" | "measuring" | "positioned">("idle");
	let naturalWidth = $state(0);
	let finalX = $state(0);

	let closeTimer: ReturnType<typeof setTimeout> | null = null;
	let overPopover = false;

	const EDGE_MARGIN = 12;

	function show(raw: string, cx: number, cy: number, isBelow: boolean) {
		if (closeTimer) {
			clearTimeout(closeTimer);
			closeTimer = null;
		}
		noteText = raw;
		anchorX = cx;
		y = cy;
		below = isBelow;
		maxH = isBelow ? window.innerHeight - cy - 16 : cy - 16;
		naturalWidth = 0;
		phase = "measuring";
		visible = true;
	}

	function scheduleClose() {
		if (closeTimer) clearTimeout(closeTimer);
		closeTimer = setTimeout(() => {
			closeTimer = null;
			if (!overPopover) visible = false;
		}, 300);
	}

	function onMouseOver(e: MouseEvent) {
		const target = (e.target as HTMLElement).closest?.(
			".danmaku-note-bg",
		) as HTMLElement | null;
		if (target) {
			if (closeTimer) {
				clearTimeout(closeTimer);
				closeTimer = null;
			}
			const raw = (window as any).__bdNoteText || "";
			const r = target.getBoundingClientRect();
			show(
				raw,
				r.left + r.width / 2,
				r.top <= window.innerHeight / 2 ? r.bottom + 8 : r.top - 8,
				r.top <= window.innerHeight / 2,
			);
		}
	}

	function onMouseOut(e: MouseEvent) {
		const target = (e.target as HTMLElement).closest?.(
			".danmaku-note-bg",
		) as HTMLElement | null;
		if (target && !overPopover) {
			scheduleClose();
		}
	}

	function onPopEnter() {
		overPopover = true;
		if (closeTimer) {
			clearTimeout(closeTimer);
			closeTimer = null;
		}
	}
	function onPopLeave() {
		overPopover = false;
		scheduleClose();
	}

	$effect(() => {
		document.addEventListener("mouseover", onMouseOver);
		document.addEventListener("mouseout", onMouseOut);
		return () => {
			document.removeEventListener("mouseover", onMouseOver);
			document.removeEventListener("mouseout", onMouseOut);
		};
	});

	// Phase 1 ("measuring"): pin left:0 so shrink-to-fit has the whole
	// viewport to work with — this is the box's TRUE natural width, capped
	// by max-width but never squeezed by edge proximity.
	// Phase 2 ("positioned"): lock that width explicitly and clamp x against it.
	$effect(() => {
		if (phase !== "measuring" || !popoverEl) return;

		const width = popoverEl.getBoundingClientRect().width;
		naturalWidth = width;

		const half = width / 2;
		let x = anchorX;
		if (x - half < EDGE_MARGIN) {
			x = half + EDGE_MARGIN;
		} else if (x + half > window.innerWidth - EDGE_MARGIN) {
			x = window.innerWidth - EDGE_MARGIN - half;
		}
		finalX = x;
		phase = "positioned";
	});
</script>

{#if visible}
	<div
		bind:this={popoverEl}
		role="tooltip"
		style="
        position:fixed;
        left:{phase === 'measuring' ? 0 : finalX}px;
        top:{y}px;
        transform:translate(-50%,{below ? '0' : '-100%'});
        max-height:{maxH}px;
        overflow-y:auto;
        width:{phase === 'measuring' ? 'auto' : naturalWidth + 'px'};
        visibility:{phase === 'measuring' ? 'hidden' : 'visible'};
    "
		class="note-popover z-9999 pointer-events-auto bg-[rgba(15,15,25,0.95)] border border-white/15 rounded-lg px-3 py-2 text-sm leading-relaxed text-[#e0e0e0] whitespace-normal shadow-lg max-w-120"
		onmouseenter={onPopEnter}
		onmouseleave={onPopLeave}
	>
		<SvelteMarkdown
			source={noteText}
			renderers={markdownRenderers as any}
		/>
	</div>
{/if}

<style>
	:global(.note-popover strong) {
		color: #fff;
		font-weight: 600;
	}
	:global(.note-popover em) {
		color: #ccc;
		font-style: italic;
	}
</style>
