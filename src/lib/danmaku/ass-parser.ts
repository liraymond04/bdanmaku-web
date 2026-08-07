export interface ParsedDanmakuLine {
	index: number;
	layer: number;
	startMs: number;
	endMs: number;
	originalText: string;
	translatedText: string;
	note?: string | null;
	positionType: 'move' | 'pos';
	posX: number;
	posY: number;
	posX2?: number;
	posY2?: number;
	anchor: number;
	fontSize: number;
	translatedFontSize: number;
	color: string;
	styleTags: string;
}

function parseAssTime(t: string): number {
	const parts = t.split(':');
	if (parts.length < 3) return 0;
	const h = parseInt(parts[0]) || 0;
	const m = parseInt(parts[1]) || 0;
	const sParts = (parts[2] || '0.00').split('.');
	const s = parseInt(sParts[0]) || 0;
	const frac = (sParts[1] || '00').padEnd(3, '0').slice(0, 3);
	return (h * 3600 + m * 60 + s) * 1000 + parseInt(frac) * 10;
}

function extractDisplayText(text: string): string {
	return text.replace(/\{[^}]*\}/g, '').trim();
}

function extractLastFontSize(text: string): number | null {
	const matches = [...text.matchAll(/\\fs(\d+)/g)];
	if (matches.length === 0) return null;
	return parseInt(matches[matches.length - 1][1]);
}

const DIALOGUE_RE = /^Dialogue:\s*(\d+),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),(.*)$/;
const MOVE_RE = /\\move\(([^)]+)\)/;
const POS_RE = /\\pos\(([^)]+)\)/;
const AN_RE = /\\an(\d+)/;
const C_RE = /\\c(&H[0-9A-Fa-f]+&)/;

export function parseAssContent(content: string, playResX: number, playResY: number): ParsedDanmakuLine[] {
	const lines: ParsedDanmakuLine[] = [];
	let inEvents = false;

	for (const rawLine of content.split('\n')) {
		const trimmed = rawLine.trim();

		if (trimmed === '[Events]') {
			inEvents = true;
			continue;
		}
		if (!inEvents) continue;
		if (trimmed.startsWith('Format:') || trimmed.startsWith(';')) continue;

		if (trimmed.startsWith('PlayResX:')) {
			playResX = parseInt(trimmed.split(':')[1]) || playResX;
			continue;
		}
		if (trimmed.startsWith('PlayResY:')) {
			playResY = parseInt(trimmed.split(':')[1]) || playResY;
			continue;
		}

		const m = DIALOGUE_RE.exec(rawLine);
		if (!m) continue;

		const layer = parseInt(m[1]) || 0;
		const startMs = parseAssTime(m[2]);
		const endMs = parseAssTime(m[3]);
		const text = m[10];

		// Parse inline-mode text: original \\N translated
		const parts = text.split('\\N');
		const originalPart = parts[0];
		const translatedPart = parts[1] || '';

		const originalText = extractDisplayText(originalPart);
		const translatedText = extractDisplayText(translatedPart);

		if (!originalText) continue;

		const moveMatch = MOVE_RE.exec(text);
		const posMatch = POS_RE.exec(text);
		const anMatch = AN_RE.exec(text);
		const anchor = anMatch ? parseInt(anMatch[1]) : 2;

		let positionType: 'move' | 'pos';
		let posX: number;
		let posY: number;
		let posX2: number | undefined;
		let posY2: number | undefined;

		if (moveMatch) {
			positionType = 'move';
			const coords = moveMatch[1].split(',').map(Number);
			posX = (coords[0] || 0) / playResX;
			posY = (coords[1] || 0) / playResY;
			posX2 = (coords[2] || 0) / playResX;
			posY2 = (coords[3] || 0) / playResY;
		} else if (posMatch) {
			positionType = 'pos';
			const coords = posMatch[1].split(',').map(Number);
			posX = (coords[0] || 0) / playResX;
			posY = (coords[1] || 0) / playResY;
		} else {
			continue;
		}

		const origFs = extractLastFontSize(originalPart) ?? 42;
		const transFs = extractLastFontSize(translatedPart) ?? 29;

		const cMatch = C_RE.exec(text);
		const color = cMatch ? cMatch[1] : '&H66FFFFFF';

		lines.push({
			index: lines.length,
			layer,
			startMs,
			endMs,
			originalText,
			translatedText,
			positionType,
			posX,
			posY,
			posX2,
			posY2,
			anchor,
			fontSize: origFs,
			translatedFontSize: transFs,
			color,
			styleTags: text,
		});
	}

	return lines;
}
