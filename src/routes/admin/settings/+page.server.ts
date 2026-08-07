import { compareSync, hashSync } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import db, { schema } from '$lib/server/db';
import type { Actions } from './$types';

export const actions = {
	changePassword: async ({ request }) => {
		const data = await request.formData();
		const current = String(data.get('current') || '');
		const newPass = String(data.get('new') || '');
		const confirm = String(data.get('confirm') || '');

		if (!current || !newPass) return { error: 'All fields are required' };
		if (newPass.length < 4) return { error: 'Password must be at least 4 characters' };
		if (newPass !== confirm) return { error: 'Passwords do not match' };

		const user = await db.query.users.findFirst({
			where: eq(schema.users.username, 'admin'),
		});
		if (!user || !compareSync(current, user.passwordHash)) {
			return { error: 'Current password is incorrect' };
		}

		await db
			.update(schema.users)
			.set({ passwordHash: hashSync(newPass, 10) })
			.where(eq(schema.users.id, user.id));

		return { success: true };
	},
} satisfies Actions;
