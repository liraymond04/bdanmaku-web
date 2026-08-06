import db, { schema } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const vodId = parseInt(params.vodId);
	if (isNaN(vodId)) throw error(400, 'Invalid VOD ID');

	const vod = await db.query.vods.findFirst({ where: eq(schema.vods.id, vodId) });
	if (!vod) throw error(404, 'VOD not found');

	const uploads = await db
		.select({
			id: schema.uploads.id,
			vodId: schema.uploads.vodId,
			bilibiliUrl: schema.uploads.bilibiliUrl,
			bilibiliBv: schema.uploads.bilibiliBv,
			timingOffsetMs: schema.uploads.timingOffsetMs,
			status: schema.uploads.status,
			sourceLabel: schema.uploads.sourceLabel,
			sourceNote: schema.uploads.sourceNote,
			createdAt: schema.uploads.createdAt,
			updatedAt: schema.uploads.updatedAt,
			lineCount: sql<number>`(SELECT count(*) FROM ${schema.danmakuLines} WHERE ${schema.danmakuLines.uploadId} = ${schema.uploads.id})`.mapWith(Number),
		})
		.from(schema.uploads)
		.where(eq(schema.uploads.vodId, vodId))
		.orderBy(sql`${schema.uploads.createdAt} DESC`);

	return { vod, uploads };
};

export const actions = {
	editVod: async ({ params, request }) => {
		const vodId = parseInt(params.vodId);
		const data = await request.formData();
		const youtubeUrl = String(data.get('youtubeUrl') || '');
		const youtubeId = extractYoutubeId(youtubeUrl) || youtubeUrl;
		await db
			.update(schema.vods)
			.set({
				title: String(data.get('title') || ''),
				youtubeUrl,
				youtubeId,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(schema.vods.id, vodId));
	},

	addUpload: async ({ params, request }) => {
		const vodId = parseInt(params.vodId);
		const data = await request.formData();
		const now = new Date().toISOString();

		await db.insert(schema.uploads).values({
			vodId,
			bilibiliUrl: String(data.get('bilibiliUrl') || ''),
			bilibiliBv: String(data.get('bilibiliBv') || ''),
			timingOffsetMs: parseInt(String(data.get('timingOffsetMs') || '0')) || 0,
			sourceLabel: String(data.get('sourceLabel') || ''),
			sourceNote: String(data.get('sourceNote') || ''),
			status: 'pending',
			createdAt: now,
			updatedAt: now,
		});
	},

	updateUpload: async ({ request }) => {
		const data = await request.formData();
		const uploadId = parseInt(String(data.get('uploadId') || '0'));
		const now = new Date().toISOString();

		await db
			.update(schema.uploads)
			.set({
				bilibiliUrl: String(data.get('bilibiliUrl') || ''),
				bilibiliBv: String(data.get('bilibiliBv') || ''),
				timingOffsetMs: parseInt(String(data.get('timingOffsetMs') || '0')) || 0,
				sourceLabel: String(data.get('sourceLabel') || ''),
				sourceNote: String(data.get('sourceNote') || ''),
				updatedAt: now,
			})
			.where(eq(schema.uploads.id, uploadId));
	},

	deleteUpload: async ({ request }) => {
		const data = await request.formData();
		const uploadId = parseInt(String(data.get('uploadId') || '0'));
		await db.delete(schema.danmakuLines).where(eq(schema.danmakuLines.uploadId, uploadId));
		await db.delete(schema.uploads).where(eq(schema.uploads.id, uploadId));
	},
} satisfies Actions;

function extractYoutubeId(url: string): string | null {
	const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
	return m ? m[1] : null;
}
