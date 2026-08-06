import db, { schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { parseAssContent } from '$lib/danmaku/ass-parser';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const uploadId = parseInt(params.uploadId);
	if (isNaN(uploadId)) throw error(400, 'Invalid upload ID');

	const upload = await db.query.uploads.findFirst({
		where: eq(schema.uploads.id, uploadId),
	});
	if (!upload) throw error(404, 'Upload not found');

	const vod = await db.query.vods.findFirst({
		where: eq(schema.vods.id, upload.vodId),
	});
	if (!vod) throw error(404, 'VOD not found');

	const lines = await db
		.select()
		.from(schema.danmakuLines)
		.where(eq(schema.danmakuLines.uploadId, uploadId))
		.orderBy(schema.danmakuLines.startMs);

	return { vod, upload, lines };
};

export const actions = {
	importAss: async ({ params, request }) => {
		const uploadId = parseInt(params.uploadId);
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		if (!file) return { error: 'No file selected' };

		const content = await file.text();
		const parsed = parseAssContent(content, 1920, 1080);
		if (parsed.length === 0) return { error: 'No danmaku lines found in file' };

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

		return { success: true, inserted, updated, total: parsed.length };
	},

	setOffset: async ({ params, request }) => {
		const uploadId = parseInt(params.uploadId);
		const data = await request.formData();
		const offset = parseInt(String(data.get('offsetMs') || '0')) || 0;
		await db
			.update(schema.uploads)
			.set({ timingOffsetMs: offset, updatedAt: new Date().toISOString() })
			.where(eq(schema.uploads.id, uploadId));
	},
} satisfies Actions;
