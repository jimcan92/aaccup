import type { EvidenceDocument } from '#lib/data/types.js';

/**
 * Documents live in Google Drive. A document counts as linked, and can be opened, only when
 * its link is a Drive or Docs file or folder that can be previewed in the site. Other links
 * (for example old Google Sites pages) show as "In preparation" until a Drive file replaces them.
 */

/** Google Drive / Docs URL → an embeddable preview URL, or null when it cannot be embedded. */
export function previewUrl(url: string | undefined): string | null {
	if (!url) return null;
	try {
		const parsed = new URL(url);
		const host = parsed.hostname;

		if (host === 'drive.google.com') {
			const folder = parsed.pathname.match(/\/folders\/([\w-]{10,})/)?.[1];
			if (folder) return `https://drive.google.com/embeddedfolderview?id=${folder}#list`;

			const file =
				parsed.pathname.match(/\/file\/d\/([\w-]{10,})/)?.[1] ??
				((parsed.pathname === '/open' || parsed.pathname === '/uc') ? parsed.searchParams.get('id') : null);
			if (file) return `https://drive.google.com/file/d/${file}/preview`;
		}

		if (host === 'docs.google.com') {
			const match = parsed.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([\w-]{10,})/);
			if (match) return `https://docs.google.com/${match[1]}/d/${match[2]}/preview`;
		}
	} catch {
		// Not a URL: fall through.
	}
	return null;
}

export function isLinked(document: Pick<EvidenceDocument, 'status' | 'driveUrl'>): boolean {
	return document.status === 'linked' && previewUrl(document.driveUrl) !== null;
}

/** The file id in a Google Drive or Docs file link (not a folder), or null. */
export function driveFileId(url: string | undefined): string | null {
	if (!url) return null;
	try {
		const parsed = new URL(url);
		if (parsed.hostname === 'drive.google.com') {
			return parsed.pathname.match(/\/file\/d\/([\w-]{10,})/)?.[1] ?? ((parsed.pathname === '/open' || parsed.pathname === '/uc') ? parsed.searchParams.get('id') : null);
		}
		if (parsed.hostname === 'docs.google.com') return parsed.pathname.match(/^\/(?:document|spreadsheets|presentation)\/d\/([\w-]{10,})/)?.[1] ?? null;
	} catch {
		// Not a URL.
	}
	return null;
}

/** Drive's picture of a file's first page, for files shared as "Anyone with the link"; null for folders. */
export function driveThumbnail(url: string | undefined, width = 800): string | null {
	const id = driveFileId(url);
	return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${width}` : null;
}

/** The folder id in a Google Drive folder link, or null when the link is not a folder. */
export function driveFolderId(url: string | undefined): string | null {
	if (!url) return null;
	try {
		const parsed = new URL(url);
		if (parsed.hostname !== 'drive.google.com') return null;
		return parsed.pathname.match(/\/folders\/([\w-]{10,})/)?.[1] ?? null;
	} catch {
		return null;
	}
}
