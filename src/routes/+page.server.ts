import db, { schema } from '$lib/server/db';
import { sql, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const vods = await db
		.select({
			id: schema.vods.id,
			title: schema.vods.title,
			description: schema.vods.description,
			thumbnailUrl: schema.vods.thumbnailUrl,
			uploadCount: sql<number>`count(${schema.uploads.id})`.mapWith(Number),
		})
		.from(schema.vods)
		.leftJoin(schema.uploads, sql`${schema.vods.id} = ${schema.uploads.vodId}`)
		.where(eq(schema.vods.visible, 1))
		.groupBy(schema.vods.id)
		.orderBy(schema.vods.sortOrder, sql`${schema.vods.createdAt} DESC`);

	return { vods };
};
