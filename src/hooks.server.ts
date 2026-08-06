import { redirect, type Handle } from '@sveltejs/kit';
import { verifySession } from '$lib/server/auth';

const SESSION_COOKIE = 'bd_session';

export const handle: Handle = async ({ event, resolve }) => {
	const isAdminRoute = event.url.pathname.startsWith('/admin');

	if (isAdminRoute && event.url.pathname !== '/admin/login') {
		const session = event.cookies.get(SESSION_COOKIE);
		if (!verifySession(session)) {
			throw redirect(303, '/admin/login');
		}
	}

	return await resolve(event);
};
