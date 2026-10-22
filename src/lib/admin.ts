/** Client-safe admin labels. Roles mirror public.user_role in Supabase. */
export const roleInfo: Record<string, { label: string; description: string }> = {
	admin: { label: 'Admin', description: 'Manages people, roles, and every program.' },
	focal: { label: 'Focal person', description: 'Edits and publishes content for every program.' },
	reviewer: { label: 'Reviewer', description: 'Reads drafts and approves or returns them.' },
	area_chair: { label: 'Area chair', description: 'Drafts content for an assigned program and submits it for review.' }
};

export const statusInfo: Record<string, { label: string; tone: 'neutral' | 'progress' | 'good' | 'muted' }> = {
	draft: { label: 'Draft', tone: 'neutral' },
	in_review: { label: 'In review', tone: 'progress' },
	approved: { label: 'Approved', tone: 'progress' },
	published: { label: 'Published', tone: 'good' },
	archived: { label: 'Archived', tone: 'muted' }
};

export function initials(name: string): string {
	const parts = name.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
	return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '·';
}
