import db, { schema } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const vodId = parseInt(params.vodId);
	if (isNaN(vodId)) throw error(400, 'Invalid VOD ID');

	const vod = await db.query.vods.findFirst({ where: eq(schema.vods.id, vodId) });
	if (!vod) throw error(404, 'VOD not found');

	const uploads = await db
		.select()
		.from(schema.uploads)
		.where(eq(schema.uploads.vodId, vodId))
		.orderBy(sql`${schema.uploads.createdAt} DESC`);

	const requestedUploadId = parseInt(url.searchParams.get('upload') || '');
	const activeUpload = uploads.find(u => u.id === requestedUploadId) || uploads[0] || null;

	let lines: typeof schema.danmakuLines.$inferSelect[] = [];
	if (activeUpload) {
		lines = await db
			.select()
			.from(schema.danmakuLines)
			.where(eq(schema.danmakuLines.uploadId, activeUpload.id))
			.orderBy(schema.danmakuLines.startMs);
	}

	return {
		vod,
		uploads,
		activeUpload,
		lines,
		timingOffsetMs: activeUpload?.timingOffsetMs ?? 0,
	};
};
