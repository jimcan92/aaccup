/** Data the quick actions menu fetches from the browser (public pages are cached for everyone). */

export type MenuProgram = { slug: string; code: string; name: string };

let programs: Promise<MenuProgram[]> | null = null;

/** Published programs, fetched once per page load. */
export function menuPrograms(): Promise<MenuProgram[]> {
	programs ??= fetch('/api/programs')
		.then((response) => (response.ok ? response.json() : []))
		.catch(() => []);
	return programs;
}

/** Whether the visitor is AACCUP staff, and the id of `programSlug` when asked for. */
export async function staffInfo(programSlug?: string): Promise<{ staff: boolean; programId: string | null }> {
	try {
		const query = programSlug ? `?program=${encodeURIComponent(programSlug)}` : '';
		const response = await fetch(`/admin/me${query}`, { credentials: 'same-origin' });
		const me = response.ok ? await response.json() : null;
		return { staff: Boolean(me?.staff), programId: me?.programId ?? null };
	} catch {
		return { staff: false, programId: null };
	}
}
