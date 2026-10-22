import { env } from '$env/dynamic/private';
import type { DocumentFormat } from '$lib/data/types';

/**
 * Minimal Google Drive v3 client for a service account (read-only scope).
 * GOOGLE_SERVICE_ACCOUNT_JSON holds the key file from Google Cloud, as raw JSON or base64.
 * Share the root folder (or shared drive) with the service account's email as Viewer.
 */

export type DriveItem = {
	id: string;
	name: string;
	mimeType: string;
	modifiedTime: string;
	webViewLink: string;
	/** true = "Anyone with the link" can view; false = restricted; null = could not tell. */
	isPublic: boolean | null;
};

type ServiceAccount = { client_email: string; private_key: string };

const FOLDER = 'application/vnd.google-apps.folder';
const SHORTCUT = 'application/vnd.google-apps.shortcut';
const API = 'https://www.googleapis.com/drive/v3';

function serviceAccount(): ServiceAccount | null {
	const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
	if (!raw) return null;
	try {
		const json = raw.startsWith('{') ? raw : atob(raw);
		const parsed = JSON.parse(json) as ServiceAccount;
		return parsed.client_email && parsed.private_key ? parsed : null;
	} catch {
		return null;
	}
}

export function driveConfigured(): boolean {
	return serviceAccount() !== null;
}

/** The email to share folders with, shown in the admin. */
export function serviceAccountEmail(): string | null {
	return serviceAccount()?.client_email ?? null;
}

const b64url = (bytes: ArrayBuffer | Uint8Array | string) => {
	const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : new Uint8Array(bytes);
	let binary = '';
	for (const byte of data) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

let cached: { token: string; expires: number } | null = null;

async function accessToken(): Promise<string> {
	if (cached && cached.expires > Date.now() + 60_000) return cached.token;

	const account = serviceAccount();
	if (!account) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set.');

	const now = Math.floor(Date.now() / 1000);
	const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(
		JSON.stringify({
			iss: account.client_email,
			scope: 'https://www.googleapis.com/auth/drive.readonly',
			aud: 'https://oauth2.googleapis.com/token',
			iat: now,
			exp: now + 3600
		})
	)}`;

	const pem = account.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
	const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
	const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
	const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));

	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: `${unsigned}.${b64url(signature)}`
		})
	});
	const body = (await response.json()) as { access_token?: string; expires_in?: number; error_description?: string };
	if (!response.ok || !body.access_token) throw new Error(`Google sign-in failed: ${body.error_description ?? response.status}`);

	cached = { token: body.access_token, expires: Date.now() + (body.expires_in ?? 3600) * 1000 };
	return cached.token;
}

async function drive<T>(path: string, params: Record<string, string>): Promise<T> {
	const url = new URL(`${API}${path}`);
	for (const [key, value] of Object.entries({ supportsAllDrives: 'true', ...params })) url.searchParams.set(key, value);

	const response = await fetch(url, { headers: { authorization: `Bearer ${await accessToken()}` }, signal: AbortSignal.timeout(15_000) });
	if (!response.ok) {
		const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
		const reason = response.status === 404 ? 'not found, or not shared with the service account' : body?.error?.message;
		throw new Error(`Drive ${response.status}: ${reason ?? response.statusText}`);
	}
	return (await response.json()) as T;
}

type RawFile = {
	id: string;
	name: string;
	mimeType: string;
	modifiedTime: string;
	webViewLink: string;
	permissions?: { type: string; role: string }[];
	shortcutDetails?: { targetId: string; targetMimeType: string };
};

const anyoneCanView = (permissions: { type: string; role: string }[]) =>
	permissions.some((permission) => permission.type === 'anyone');

async function publicAccess(file: RawFile): Promise<boolean | null> {
	if (file.permissions) return anyoneCanView(file.permissions);
	// Files in shared drives do not return permissions in a list call; ask per file.
	try {
		const { permissions } = await drive<{ permissions: { type: string; role: string }[] }>(`/files/${file.id}/permissions`, {
			fields: 'permissions(type,role)'
		});
		return anyoneCanView(permissions);
	} catch {
		return null;
	}
}

/** Direct children of a folder (files and subfolders), not trashed. */
export async function listFolder(folderId: string, options: { checkAccess?: boolean } = {}): Promise<DriveItem[]> {
	const items: RawFile[] = [];
	let pageToken = '';

	do {
		const page = await drive<{ files: RawFile[]; nextPageToken?: string }>('/files', {
			q: `'${folderId}' in parents and trashed = false`,
			fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink, permissions(type, role), shortcutDetails)',
			includeItemsFromAllDrives: 'true',
			orderBy: 'folder, name_natural',
			pageSize: '1000',
			...(pageToken ? { pageToken } : {})
		});
		items.push(...page.files);
		pageToken = page.nextPageToken ?? '';
	} while (pageToken);

	return Promise.all(
		items.map(async (file) => {
			// A shortcut stands in for its target.
			const mimeType = file.mimeType === SHORTCUT ? (file.shortcutDetails?.targetMimeType ?? file.mimeType) : file.mimeType;
			return {
				id: file.id,
				name: file.name,
				mimeType,
				modifiedTime: file.modifiedTime,
				webViewLink: file.webViewLink,
				isPublic: options.checkAccess ? await publicAccess(file) : null
			};
		})
	);
}

export async function folderName(folderId: string): Promise<string> {
	const file = await drive<{ name: string; mimeType: string }>(`/files/${folderId}`, { fields: 'name, mimeType' });
	if (file.mimeType !== FOLDER) throw new Error('That link is a file, not a folder.');
	return file.name;
}

export const isFolder = (item: DriveItem) => item.mimeType === FOLDER;

export function formatFromMime(mimeType: string): DocumentFormat {
	if (mimeType === FOLDER) return 'folder';
	if (mimeType === 'application/pdf') return 'pdf';
	if (/google-apps\.document|msword|wordprocessingml/.test(mimeType)) return 'docx';
	if (/google-apps\.spreadsheet|ms-excel|spreadsheetml/.test(mimeType)) return 'xlsx';
	if (/google-apps\.presentation|ms-powerpoint|presentationml/.test(mimeType)) return 'pptx';
	return 'link';
}

/** Accepts a folder URL (drive/folders/ID, ?id=ID) or a bare id. */
export function folderIdFrom(input: string): string | null {
	const value = input.trim();
	const fromUrl = value.match(/\/folders\/([A-Za-z0-9_-]{10,})/) ?? value.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
	if (fromUrl) return fromUrl[1];
	return /^[A-Za-z0-9_-]{10,}$/.test(value) ? value : null;
}
