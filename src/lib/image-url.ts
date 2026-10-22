/**
 * Image sources for landing pages: an uploaded image (Supabase Storage public URL) is used as is;
 * a Google Drive file link becomes Google's direct image URL, which works for files shared as
 * "Anyone with the link". `width` asks Google for a smaller copy.
 */
export function imageSrc(src: string, width = 1600): string {
	try {
		const url = new URL(src);
		if (url.hostname === 'drive.google.com') {
			const id = url.pathname.match(/\/file\/d\/([\w-]{10,})/)?.[1] ?? url.searchParams.get('id');
			if (id) return `https://lh3.googleusercontent.com/d/${id}=w${width}`;
		}
		return src;
	} catch {
		return src;
	}
}

/** Paragraphs from plain text: blank lines separate paragraphs. */
export function paragraphs(text: string | undefined): string[] {
	return (text ?? '')
		.split(/\n\s*\n/)
		.map((part) => part.trim())
		.filter(Boolean);
}
