<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import House from '@lucide/svelte/icons/house';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import PencilLine from '@lucide/svelte/icons/pencil-line';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import { page } from '$app/state';
	import QuickActions, { type QuickAction } from '$lib/components/site/quick-actions.svelte';

	type ProgramRef = { id: string; code: string; slug: string };
	type VisitRef = { slug: string; status: string; program?: ProgramRef | null };
	type PageData = { program?: ProgramRef | null; visit?: VisitRef | null; section?: { slug: string; visit?: VisitRef | null } | null };

	// The program this admin page is about: a program or its landing page, a visit, or a section.
	const context = $derived.by(() => {
		const data = page.data as PageData;
		const visit = data.section?.visit ?? data.visit ?? null;
		const program = data.program ?? visit?.program ?? null;
		return program?.id && program.slug ? { program, visit, section: data.section ?? null } : null;
	});

	const items = $derived.by(() => {
		const path = page.url.pathname;
		const list: QuickAction[] = [];
		if (context) {
			const { program, visit, section } = context;
			// The active visit lives at /[program]; other visits under /[program]/[visit].
			const base = !visit || visit.status === 'active' ? `/${program.slug}` : `/${program.slug}/${visit.slug}`;
			list.push({ label: `${program.code} home`, href: `/${program.slug}`, icon: House, fresh: true });
			list.push({ label: `${program.code} documents`, href: base === `/${program.slug}` ? `${base}/dossier` : base, icon: FolderOpen, fresh: true });
			if (section) list.push({ label: 'This section on the site', href: `${base}/${section.slug}`, icon: FileText, fresh: true });
			if (path !== `/admin/programs/${program.id}`) list.push({ label: `Manage ${program.code}`, href: `/admin/programs/${program.id}`, icon: Settings2 });
			if (path !== `/admin/programs/${program.id}/landing`) list.push({ label: `Edit ${program.code} page`, href: `/admin/programs/${program.id}/landing`, icon: PencilLine });
		}
		if (path !== '/admin/programs') list.push({ label: 'All programs', href: '/admin/programs', icon: LayoutGrid });
		if (path !== '/admin') list.push({ label: 'Admin overview', href: '/admin', icon: LayoutDashboard });
		return list;
	});
</script>

<QuickActions {items} class="bg-ink text-paper" />
