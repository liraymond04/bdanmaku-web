import { json } from '@sveltejs/kit';
import db, { schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) return json({ error: 'Invalid line ID' }, { status: 400 });

	const body = await request.json();
	const now = new Date().toISOString();

	const updateData: Record<string, unknown> = { updatedAt: now };

	if (body.editedText !== undefined) updateData.editedText = body.editedText || null;
	if (body.note !== undefined) updateData.note = body.note || null;
	if (body.noteMarkdown !== undefined) updateData.noteMarkdown = body.noteMarkdown || null;

	await db
		.update(schema.danmakuLines)
		.set(updateData)
		.where(eq(schema.danmakuLines.id, id));

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) return json({ error: 'Invalid line ID' }, { status: 400 });

	await db.delete(schema.danmakuLines).where(eq(schema.danmakuLines.id, id));

	return json({ success: true });
};
