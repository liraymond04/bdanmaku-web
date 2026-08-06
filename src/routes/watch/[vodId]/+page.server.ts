import db, { schema } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const vodId = parseInt(params.vodId);
	if (isNaN(vodId)) throw error(400, 'Invalid VOD ID');

	const vod = await db.query.vods.findFirst({ where: eq(schema.vods.id, vodId) });
	if (!vod) throw error(404, 'VOD not found');

	const uploads = await db
		.select()
		.from(schema.uploads)
		.where(eq(schema.uploads.vodId, vodId))
		.orderBy(sql`${schema.uploads.createdAt} DESC`);

	const activeUploadId = uploads[0]?.id ?? null;

	let lines: typeof schema.danmakuLines.$inferSelect[] = [];
	if (activeUploadId) {
		lines = await db
			.select()
			.from(schema.danmakuLines)
			.where(eq(schema.danmakuLines.uploadId, activeUploadId));
	}

	return {
		vod,
		uploads,
		activeUploadId,
		lines,
		timingOffsetMs: activeUploadId ? uploads[0].timingOffsetMs : 0,
	};
};
