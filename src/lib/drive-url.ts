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
