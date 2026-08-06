import { json } from '@sveltejs/kit';
import db, { schema } from '$lib/server/db';
import { parseAssContent } from '$lib/danmaku/ass-parser';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const uploadId = parseInt(params.id);
	if (isNaN(uploadId)) return json({ error: 'Invalid upload ID' }, { status: 400 });

	const upload = await db.query.uploads.findFirst({
		where: eq(schema.uploads.id, uploadId),
	});
	if (!upload) return json({ error: 'Upload not found' }, { status: 404 });

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const assContent = formData.get('content') as string | null;

	let content: string;
	if (file) {
		content = await file.text();
	} else if (assContent) {
		content = assContent;
	} else {
		return json({ error: 'No file or content provided' }, { status: 400 });
	}

	const parsed = parseAssContent(content, 1920, 1080);
	if (parsed.length === 0) {
		return json({ error: 'No danmaku lines found in ASS content' }, { status: 400 });
	}

	const now = new Date().toISOString();
	let inserted = 0;
	let updated = 0;

	for (const line of parsed) {
		const existing = await db.query.danmakuLines.findFirst({
			where: (fields) =>
				eq(fields.uploadId, uploadId) &&
				eq(fields.startMs, line.startMs) &&
				eq(fields.originalText, line.originalText),
		});

		if (existing) {
			await db
				.update(schema.danmakuLines)
				.set({
					translatedText: line.translatedText || existing.translatedText,
					positionType: line.positionType,
					posX: line.posX,
					posY: line.posY,
					posX2: line.posX2 ?? null,
					posY2: line.posY2 ?? null,
					anchor: line.anchor,
					fontSize: line.fontSize,
					translatedFontSize: line.translatedFontSize,
					color: line.color,
					styleTags: line.styleTags,
					updatedAt: now,
				})
				.where(eq(schema.danmakuLines.id, existing.id));
			updated++;
		} else {
			await db.insert(schema.danmakuLines).values({
				uploadId,
				layer: line.layer,
				startMs: line.startMs,
				endMs: line.endMs,
				originalText: line.originalText,
				translatedText: line.translatedText || null,
				positionType: line.positionType,
				posX: line.posX,
				posY: line.posY,
				posX2: line.posX2 ?? null,
				posY2: line.posY2 ?? null,
				anchor: line.anchor,
				fontSize: line.fontSize,
				translatedFontSize: line.translatedFontSize,
				color: line.color,
				styleTags: line.styleTags,
				createdAt: now,
				updatedAt: now,
			});
			inserted++;
		}
	}

	await db
		.update(schema.uploads)
		.set({ status: 'ready', updatedAt: now })
		.where(eq(schema.uploads.id, uploadId));

	return json({ inserted, updated, total: parsed.length });
};
