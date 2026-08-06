import type { ParsedDanmakuLine } from './ass-parser';

const ASS_RES_X = 1920;
const ASS_RES_Y = 1080;

export interface ActiveLine {
	line: ParsedDanmakuLine;
	elapsedFraction: number;
	fontSize: string;
	transFontSize: string;
	left: string;
	top: string;
	transform: string;
}

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

		const scale = Math.min(w / ASS_RES_X, h / ASS_RES_Y);

		for (const line of lines) {
			if (now >= line.startMs && now <= line.endMs && !active.has(line.index)) {
				const duration = line.endMs - line.startMs;
				const elapsed = Math.max(0, now - line.startMs);
				const elapsedFraction = duration > 0 ? Math.min(1, elapsed / duration) : 0;
				active.set(line.index, computeActiveLine(line, elapsedFraction, w, h, scale));
			}
		}

		for (const [key, al] of active) {
			const duration = al.line.endMs - al.line.startMs;
			const elapsed = Math.max(0, now - al.line.startMs);
			const elapsedFraction = duration > 0 ? Math.min(1, elapsed / duration) : 0;

			if (al.line.positionType === 'move') {
				if (now > al.line.endMs && elapsedFraction >= 1) {
					active.delete(key);
					continue;
				}
			} else {
				if (now > al.line.endMs) {
					active.delete(key);
					continue;
				}
			}

			const updated = computeActiveLine(al.line, elapsedFraction, w, h, scale);
			al.elapsedFraction = updated.elapsedFraction;
			al.fontSize = updated.fontSize;
			al.transFontSize = updated.transFontSize;
			al.left = updated.left;
			al.top = updated.top;
			al.transform = updated.transform;
		}

		if (listener) {
			listener(Array.from(active.values()));
		}

		rafId = requestAnimationFrame(tick);
	}

	function computeActiveLine(line: ParsedDanmakuLine, fraction: number, w: number, h: number, scale: number): ActiveLine {
		const origFs = Math.round(line.fontSize * scale);
		const transFs = Math.round(line.translatedFontSize * scale);

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
				fontSize: `${origFs}px`,
				transFontSize: `${transFs}px`,
				left: `${x}px`,
				top: `${y}px`,
				transform: '',
			};
		} else {
			const xpct = `${100 - line.posX * 100}%`;
			const ypct = `${line.posY * 100}%`;

			return {
				line,
				elapsedFraction: fraction,
				fontSize: `${origFs}px`,
				transFontSize: `${transFs}px`,
				left: xpct,
				top: ypct,
				transform: '',
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
