import { compareSync } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import db, { schema } from '$lib/server/db';
import { createSession } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = String(data.get('username') || '');
		const password = String(data.get('password') || '');

		const user = await db.query.users.findFirst({
			where: eq(schema.users.username, username),
		});

		if (!user || !compareSync(password, user.passwordHash)) {
			return { error: 'Invalid credentials' };
		}

		const session = createSession(username);
		cookies.set('bd_session', session, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 7,
		});

		return { success: true };
	},
} satisfies Actions;
