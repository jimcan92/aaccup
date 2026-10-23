import { error, fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentFormat } from '#lib/data/types.js';
import type { StaffProfile, StaffRole } from './sso';

/** The signed-in staff member and their RLS-scoped client. Throws 403 for other roles. */
export function requireStaff(
	locals: App.Locals,
	roles: StaffRole[] = ['admin', 'focal', 'reviewer', 'area_chair']
): { staff: StaffProfile; supabase: SupabaseClient } {
	if (!locals.staff || !locals.supabase) error(401, 'Sign in first.');
	if (!roles.includes(locals.staff.role)) error(403, 'Your role cannot do this.');
	return { staff: locals.staff, supabase: locals.supabase };
}

export const canManage = (staff: StaffProfile | null) => staff?.role === 'admin' || staff?.role === 'focal';
export const canEdit = (staff: StaffProfile | null) => canManage(staff) || staff?.role === 'area_chair';

export function text(form: FormData, name: string): string {
	return String(form.get(name) ?? '').trim();
}

export function optional(form: FormData, name: string): string | null {
	return text(form, name) || null;
}

export function integer(form: FormData, name: string, fallback = 0): number {
	const value = Number.parseInt(text(form, name), 10);
	return Number.isFinite(value) ? value : fallback;
}

/** Turn a Supabase error into a form failure with a readable message. */
export function dbFail(err: { message: string; code?: string } | null, values: Record<string, unknown> = {}) {
	if (!err) return null;
	const message =
		err.code === '23505'
			? 'That slug or number is already used here.'
			: err.code === '42501'
				? 'Your role cannot make this change.'
				: err.code === '23514'
					? `A value is not allowed: ${err.message}`
					: err.message;
	return fail(400, { message, ...values });
}

export const SLUG = /^[a-z][a-z0-9-]*$/;
export const VISIT_SLUG = /^[0-9]{4}(-[a-z0-9]+)*$/;
export const HEX = /^#[0-9a-f]{6}$/i;

/** Best guess of a document format from a Google Drive / Docs URL. */
export function formatFromUrl(url: string): DocumentFormat {
	if (/\/folders\//.test(url)) return 'folder';
	if (/docs\.google\.com\/document\//.test(url)) return 'docx';
	if (/docs\.google\.com\/spreadsheets\//.test(url)) return 'xlsx';
	if (/docs\.google\.com\/presentation\//.test(url)) return 'pptx';
	if (/drive\.google\.com\/(file|open)/.test(url)) return 'pdf';
	return 'link';
}

export function isHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' || url.protocol === 'http:';
	} catch {
		return false;
	}
}

/**
 * Bulk paste: one document per line.
 *   Title | https://drive.google.com/...
 *   Title<TAB>https://...          (pasted from a spreadsheet)
 *   https://... Title
 *   https://...                    (title becomes "Document N")
 */
export function parseBulkLinks(raw: string): { title: string; url: string; format: DocumentFormat }[] | string {
	const rows: { title: string; url: string; format: DocumentFormat }[] = [];
	const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

	for (const [index, line] of lines.entries()) {
		const match = line.match(/https?:\/\/\S+/);
		if (!match) return `Line ${index + 1} has no link: “${line.slice(0, 60)}”`;
		const url = match[0];
		const title = line
			.replace(url, '')
			.replace(/^[\s|\t,;–—-]+|[\s|\t,;–—-]+$/g, '')
			.trim();
		rows.push({ title: title || `Document ${index + 1}`, url, format: formatFromUrl(url) });
	}

	return rows.length ? rows : 'Paste at least one link.';
}
