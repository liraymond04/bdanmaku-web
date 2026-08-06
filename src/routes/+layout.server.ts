import { verifySession } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const session = cookies.get('bd_session');
	const isAdmin = verifySession(session) !== null;

	return { isAdmin };
};
