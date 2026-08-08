import db, { schema } from '$lib/server/db';
import { sql, eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const vods = await db
		.select({
			id: schema.vods.id,
			title: schema.vods.title,
			youtubeId: schema.vods.youtubeId,
			visible: schema.vods.visible,
			sortOrder: schema.vods.sortOrder,
			createdAt: schema.vods.createdAt,
			uploadCount: sql<number>`count(${schema.uploads.id})`.mapWith(Number),
		})
		.from(schema.vods)
		.leftJoin(schema.uploads, sql`${schema.vods.id} = ${schema.uploads.vodId}`)
		.groupBy(schema.vods.id)
		.orderBy(schema.vods.sortOrder, sql`${schema.vods.createdAt} DESC`);

	return { vods };
};

export const actions = {
	toggleVisible: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(String(data.get('id') || '0'));
		const visible = parseInt(String(data.get('visible') || '0'));
		if (id) {
			await db.update(schema.vods).set({ visible: visible ? 0 : 1 }).where(eq(schema.vods.id, id));
		}
	},

	moveUp: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(String(data.get('id') || '0'));
		if (id) {
			await db.update(schema.vods).set({ sortOrder: sql`${schema.vods.sortOrder} - 1` }).where(eq(schema.vods.id, id));
		}
	},

	moveDown: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(String(data.get('id') || '0'));
		if (id) {
			await db.update(schema.vods).set({ sortOrder: sql`${schema.vods.sortOrder} + 1` }).where(eq(schema.vods.id, id));
		}
	},

	deleteVod: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(String(data.get('id') || '0'));
		if (id) {
			await db.delete(schema.uploads).where(eq(schema.uploads.vodId, id));
			await db.delete(schema.vods).where(eq(schema.vods.id, id));
		}
	},
} satisfies Actions;
