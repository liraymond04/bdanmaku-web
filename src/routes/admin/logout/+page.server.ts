import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	cookies.delete('bd_session', { path: '/' });
	throw redirect(303, '/admin/login');
};
