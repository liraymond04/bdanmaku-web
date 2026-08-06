import db, { schema } from '$lib/server/db';
import { sql, eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const vods = await db
		.select({
			id: schema.vods.id,
			title: schema.vods.title,
			youtubeId: schema.vods.youtubeId,
			createdAt: schema.vods.createdAt,
			uploadCount: sql<number>`count(${schema.uploads.id})`.mapWith(Number),
		})
		.from(schema.vods)
		.leftJoin(schema.uploads, sql`${schema.vods.id} = ${schema.uploads.vodId}`)
		.groupBy(schema.vods.id)
		.orderBy(sql`${schema.vods.createdAt} DESC`);

	return { vods };
};

export const actions = {
	deleteVod: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(String(data.get('id') || '0'));
		if (id) {
			await db.delete(schema.uploads).where(eq(schema.uploads.vodId, id));
			await db.delete(schema.vods).where(eq(schema.vods.id, id));
		}
		throw redirect(303, '/admin');
	},
} satisfies Actions;
