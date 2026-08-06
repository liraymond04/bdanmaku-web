import { error } from '@sveltejs/kit';
import db, { schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { parseAssContent } from '$lib/danmaku/ass-parser';
import type { RequestHandler } from './$types';

function send(data: Record<string, unknown>, controller: ReadableStreamDefaultController) {
	controller.enqueue(new TextEncoder().encode(JSON.stringify(data) + '\n'));
}

export const POST: RequestHandler = async ({ params, request }) => {
	const uploadId = parseInt(params.id);
	if (isNaN(uploadId)) throw error(400, 'Invalid upload ID');

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	if (!file) throw error(400, 'No file selected');

	const content = await file.text();

	const stream = new ReadableStream({
		async start(controller) {
			try {
				send({ step: 'parse' }, controller);

				const parsed = parseAssContent(content, 1920, 1080);
				if (parsed.length === 0) {
					send({ step: 'error', message: 'No danmaku lines found' }, controller);
					controller.close();
					return;
				}

				send({ step: 'parsed', total: parsed.length }, controller);

				const now = new Date().toISOString();

				// Fetch existing lines
				send({ step: 'checking', message: 'Checking existing lines...' }, controller);
				const existingLines = await db
					.select({ id: schema.danmakuLines.id, startMs: schema.danmakuLines.startMs, originalText: schema.danmakuLines.originalText })
					.from(schema.danmakuLines)
					.where(eq(schema.danmakuLines.uploadId, uploadId));

				const existingMap = new Map<string, number>();
				for (const el of existingLines) {
					existingMap.set(`${el.startMs}|${el.originalText}`, el.id);
				}

				// Process lines
				const toInsert: typeof schema.danmakuLines.$inferInsert[] = [];
				let updated = 0;
				let processed = 0;

				send({ step: 'importing', current: 0, total: parsed.length }, controller);

				for (const line of parsed) {
					const key = `${line.startMs}|${line.originalText}`;
					const existingId = existingMap.get(key);

					if (existingId !== undefined) {
						await db
							.update(schema.danmakuLines)
							.set({
								translatedText: line.translatedText || undefined,
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
							.where(eq(schema.danmakuLines.id, existingId));
						updated++;
					} else {
						toInsert.push({
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
					}

					processed++;
					if (processed % 10 === 0 || processed === parsed.length) {
						send({ step: 'importing', current: processed, total: parsed.length }, controller);
					}
				}

				// Batch insert
				if (toInsert.length > 0) {
					send({ step: 'saving', message: `Saving ${toInsert.length} new lines...` }, controller);
					await db.insert(schema.danmakuLines).values(toInsert);
				}

				await db
					.update(schema.uploads)
					.set({ status: 'ready', updatedAt: now })
					.where(eq(schema.uploads.id, uploadId));

				send({ step: 'done', inserted: toInsert.length, updated, total: parsed.length }, controller);
			} catch (e) {
				send({ step: 'error', message: String(e) }, controller);
			}
			controller.close();
		},
	});

	return new Response(stream, {
		headers: { 'Content-Type': 'application/x-ndjson' },
	});
};
