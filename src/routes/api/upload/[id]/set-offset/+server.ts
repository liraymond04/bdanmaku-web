import { json } from '@sveltejs/kit';
import db, { schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const uploadId = parseInt(params.id);
	const { offsetMs } = await request.json();

	await db
		.update(schema.uploads)
		.set({ timingOffsetMs: offsetMs, updatedAt: new Date().toISOString() })
		.where(eq(schema.uploads.id, uploadId));

	return json({ success: true });
};
