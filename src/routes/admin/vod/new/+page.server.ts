import db, { schema } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const youtubeUrl = String(data.get('youtubeUrl') || '');
		const title = String(data.get('title') || '');
		const now = new Date().toISOString();

		const youtubeId = extractYoutubeId(youtubeUrl) || youtubeUrl;

		const result = await db.insert(schema.vods).values({
			title,
			youtubeUrl,
			youtubeId,
			description: String(data.get('description') || ''),
			thumbnailUrl: String(data.get('thumbnailUrl') || ''),
			createdAt: now,
			updatedAt: now,
		});

		throw redirect(303, `/admin/vod/${result.lastInsertRowid}`);
	},
} satisfies Actions;

function extractYoutubeId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
	];
	for (const p of patterns) {
		const m = url.match(p);
		if (m) return m[1];
	}
	return null;
}
