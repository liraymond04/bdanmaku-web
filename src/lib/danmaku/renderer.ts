import type { ParsedDanmakuLine } from './ass-parser';

export interface ActiveLine {
	line: ParsedDanmakuLine;
	elapsedFraction: number;
	left: string;
	top: string;
	transform: string;
	anchorClass: string;
}

const ANCHOR_MAP: Record<number, { x: string; y: string }> = {
	1: { x: '0%', y: '100%' },
	2: { x: '50%', y: '100%' },
	3: { x: '100%', y: '100%' },
	4: { x: '0%', y: '50%' },
	5: { x: '50%', y: '50%' },
	6: { x: '100%', y: '50%' },
	7: { x: '0%', y: '0%' },
	8: { x: '50%', y: '0%' },
	9: { x: '100%', y: '0%' },
};

export function createDanmakuRenderer(
	lines: ParsedDanmakuLine[],
	getCurrentTimeMs: () => number,
	getVideoDimensions: () => { w: number; h: number },
	offsetMs: number = 0,
) {
	const active = new Map<number, ActiveLine>();
	let rafId = 0;
	let listener: ((active: ActiveLine[]) => void) | null = null;

	function onUpdate(fn: (active: ActiveLine[]) => void) {
		listener = fn;
	}

	function tick() {
		const now = getCurrentTimeMs() + offsetMs;
		const { w, h } = getVideoDimensions();
		if (w === 0 || h === 0) {
			rafId = requestAnimationFrame(tick);
			return;
		}

		// Activate new lines
		for (const line of lines) {
			if (now >= line.startMs && now <= line.endMs && !active.has(line.layer * 100000 + line.startMs)) {
				const key = line.layer * 100000 + line.startMs;
				const duration = line.endMs - line.startMs;
				const elapsed = Math.max(0, now - line.startMs);
				const elapsedFraction = duration > 0 ? Math.min(1, elapsed / duration) : 0;

				active.set(key, computeActiveLine(line, elapsedFraction, w, h));
			}
		}

		for (const [key, al] of active) {
			if (now > al.line.endMs) {
				active.delete(key);
				continue;
			}
			const duration = al.line.endMs - al.line.startMs;
			const elapsed = Math.max(0, now - al.line.startMs);
			const elapsedFraction = duration > 0 ? Math.min(1, elapsed / duration) : 0;
			const updated = computeActiveLine(al.line, elapsedFraction, w, h);
			al.elapsedFraction = updated.elapsedFraction;
			al.left = updated.left;
			al.top = updated.top;
			al.transform = updated.transform;
		}

		if (listener) {
			listener(Array.from(active.values()));
		}

		rafId = requestAnimationFrame(tick);
	}

	function computeActiveLine(line: ParsedDanmakuLine, fraction: number, w: number, h: number): ActiveLine {
		if (line.positionType === 'move') {
			const x1 = line.posX * w;
			const y1 = line.posY * h;
			const x2 = (line.posX2 ?? line.posX) * w;
			const y2 = (line.posY2 ?? line.posY) * h;
			const x = x1 + (x2 - x1) * fraction;
			const y = y1 + (y2 - y1) * fraction;

			return {
				line,
				elapsedFraction: fraction,
				left: `${x}px`,
				top: `${y}px`,
				transform: '',
				anchorClass: '',
			};
		} else {
			const anchor = ANCHOR_MAP[line.anchor] ?? ANCHOR_MAP[2];
			const x = line.posX * w;
			const y = line.posY * h;

			return {
				line,
				elapsedFraction: fraction,
				left: `${x}px`,
				top: `${y}px`,
				transform: `translate(-${anchor.x}, -${anchor.y})`,
				anchorClass: `anchor-${line.anchor}`,
			};
		}
	}

	function start() {
		rafId = requestAnimationFrame(tick);
	}

	function stop() {
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
		active.clear();
	}

	function destroy() {
		stop();
		listener = null;
	}

	return { start, stop, destroy, onUpdate, active };
}
