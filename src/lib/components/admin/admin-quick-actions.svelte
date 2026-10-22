<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import Globe from '@lucide/svelte/icons/globe';
	import House from '@lucide/svelte/icons/house';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import PencilLine from '@lucide/svelte/icons/pencil-line';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import { page } from '$app/state';
	import QuickActions, { type QuickGroup } from '$lib/components/site/quick-actions.svelte';

	type ProgramRef = { id: string; code: string; slug: string };
	type VisitRef = { slug: string; status: string; program?: ProgramRef | null };
	type PageData = {
		menuPrograms?: ProgramRef[];
		program?: ProgramRef | null;
		visit?: VisitRef | null;
		section?: { slug: string; visit?: VisitRef | null } | null;
	};

	// The program this admin page is about: a program or its landing page, a visit, or a section.
	const context = $derived.by(() => {
		const data = page.data as PageData;
		const visit = data.section?.visit ?? data.visit ?? null;
		const program = data.program ?? visit?.program ?? null;
		return program?.id && program.slug ? { program, visit, section: data.section ?? null } : null;
	});

	const groups = $derived.by((): QuickGroup[] => {
		const path = page.url.pathname;
		const all = (page.data as PageData).menuPrograms ?? [];
		const list: QuickGroup[] = [];

		if (context) {
			const { program, visit, section } = context;
			// The active visit lives at /[program]; other visits under /[program]/[visit].
			const base = !visit || visit.status === 'active' ? `/${program.slug}` : `/${program.slug}/${visit.slug}`;
			list.push({
				title: `${program.code} on the site`,
				items: [
					{ label: `${program.code} home`, href: `/${program.slug}`, icon: House, fresh: true },
					{ label: `${program.code} documents`, href: base === `/${program.slug}` ? `${base}/dossier` : base, icon: FolderOpen, fresh: true },
					...(section ? [{ label: 'This section on the site', href: `${base}/${section.slug}`, icon: FileText, fresh: true }] : [])
				]
			});
			list.push({
				title: `Manage ${program.code}`,
				items: [
					{ label: `Manage ${program.code}`, href: `/admin/programs/${program.id}`, icon: Settings2 },
					{ label: `Edit ${program.code} page`, href: `/admin/programs/${program.id}/landing`, icon: PencilLine }
				].filter((item) => item.href !== path)
			});
		}

		// The other programs (all of them when this page is not about one): their public home and their admin.
		list.push({
			title: context ? 'Other programs' : 'Programs',
			items: all
				.filter((item) => item.id !== context?.program.id)
				.flatMap((item) => [
					{ label: `${item.code} home`, href: `/${item.slug}`, icon: House, fresh: true },
					{ label: `Manage ${item.code}`, href: `/admin/programs/${item.id}`, icon: Settings2 }
				])
				.filter((item) => item.href !== path)
		});

		list.push({
			title: 'Admin',
			items: [
				{ label: 'All programs', href: '/admin/programs', icon: LayoutGrid },
				{ label: 'Edit home page', href: '/admin/home', icon: PencilLine },
				{ label: 'Admin overview', href: '/admin', icon: LayoutDashboard },
				{ label: 'Public site', href: '/', icon: Globe, fresh: true }
			].filter((item) => item.href !== path)
		});
		return list;
	});
</script>

<QuickActions {groups} class="bg-ink text-paper" />
