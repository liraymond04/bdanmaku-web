import { SESSION_SECRET } from '$env/static/private';
import crypto from 'crypto';

const SECRET = SESSION_SECRET || 'dev-secret-change-in-prod';

export function createSession(username: string): string {
	const payload = Buffer.from(JSON.stringify({ username, ts: Date.now() })).toString('base64url');
	const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
	return `${payload}.${signature}`;
}

export function verifySession(cookie: string | undefined): string | null {
	if (!cookie) return null;
	try {
		const [payload, signature] = cookie.split('.');
		if (!payload || !signature) return null;
		const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
		if (signature !== expected) return null;
		const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
		return data.username || null;
	} catch {
		return null;
	}
}
