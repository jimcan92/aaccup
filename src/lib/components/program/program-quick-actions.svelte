<script lang="ts">
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import House from '@lucide/svelte/icons/house';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import PencilLine from '@lucide/svelte/icons/pencil-line';
	import Printer from '@lucide/svelte/icons/printer';
	import Search from '@lucide/svelte/icons/search';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import QuickActions, { type QuickGroup } from '#lib/components/site/quick-actions.svelte';
	import { dossierPath } from '#lib/data/accreditation.js';
	import type { Program, Visit } from '#lib/data/types.js';
	import { menuPrograms, staffInfo, type MenuProgram } from '#lib/menu-data.js';

	let { program, visit, base }: { program: Program; visit: Visit; base: string } = $props();

	let others = $state<MenuProgram[]>([]);
	let staff = $state<{ staff: boolean; programId: string | null }>({ staff: false, programId: null });

	onMount(async () => {
		const [list, me] = await Promise.all([menuPrograms(), staffInfo(program.slug)]);
		others = list.filter((item) => item.slug !== program.slug);
		staff = me;
	});

	const groups = $derived.by((): QuickGroup[] => {
		const route = page.route.id ?? '';
		const dossier = dossierPath(program, visit);
		const here: QuickGroup = { title: program.code, items: [] };
		if (route !== '/[program]') here.items.push({ label: `${program.code} home`, href: `/${program.slug}`, icon: House });
		if (page.url.pathname !== dossier) here.items.push({ label: 'Open the documents', href: dossier, icon: FolderOpen });
		if (!route.endsWith('/documents')) here.items.push({ label: 'Search documents', href: `${base}/documents`, icon: Search });
		// The printable index with QR codes exists for the current visit only.
		if (base === `/${program.slug}` && !route.endsWith('/print')) here.items.push({ label: 'Print evidence index', href: `${base}/print`, icon: Printer });
		if (staff.programId) {
			here.items.push({ label: `Edit ${program.code} page`, href: `/admin/programs/${staff.programId}`, icon: PencilLine });
			here.items.push({ label: `Manage ${program.code} documents`, href: `/admin/programs/${staff.programId}?tab=docs`, icon: Settings2 });
		}
		return [
			here,
			{ title: 'Other programs', items: others.map((item) => ({ label: `Go to ${item.code}`, href: `/${item.slug}`, icon: GraduationCap })) },
			{
				title: 'Site',
				items: [
					{ label: 'All AACCUP programs', href: '/', icon: LayoutGrid },
					...(staff.staff ? [{ label: 'Admin overview', href: '/admin', icon: LayoutDashboard }] : [])
				]
			}
		];
	});
</script>

<QuickActions {groups} class="bg-program text-program-contrast" />
