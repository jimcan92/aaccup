<script lang="ts">
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import House from '@lucide/svelte/icons/house';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import PencilLine from '@lucide/svelte/icons/pencil-line';
	import Search from '@lucide/svelte/icons/search';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import QuickActions, { type QuickAction } from '$lib/components/site/quick-actions.svelte';
	import { dossierPath } from '$lib/data/accreditation';
	import type { Program, Visit } from '$lib/data/types';

	let { program, visit, base }: { program: Program; visit: Visit; base: string } = $props();

	// Public pages are cached for everyone, so staff links are asked for from the browser.
	let programId = $state<string | null>(null);

	onMount(async () => {
		try {
			const response = await fetch(`/admin/me?program=${encodeURIComponent(program.slug)}`, { credentials: 'same-origin' });
			const me = response.ok ? await response.json() : null;
			programId = me?.staff ? (me.programId ?? null) : null;
		} catch {
			programId = null;
		}
	});

	const items = $derived.by(() => {
		const route = page.route.id ?? '';
		const dossier = dossierPath(program, visit);
		const list: QuickAction[] = [];
		if (route !== '/[program]') list.push({ label: `${program.code} home`, href: `/${program.slug}`, icon: House });
		if (page.url.pathname !== dossier) list.push({ label: 'Open the documents', href: dossier, icon: FolderOpen });
		if (!route.endsWith('/documents')) list.push({ label: 'Search documents', href: `${base}/documents`, icon: Search });
		list.push({ label: 'All AACCUP programs', href: '/', icon: LayoutGrid });
		if (programId) {
			list.push({ label: `Edit ${program.code} page`, href: `/admin/programs/${programId}/landing`, icon: PencilLine });
			list.push({ label: `Manage ${program.code}`, href: `/admin/programs/${programId}`, icon: Settings2 });
		}
		return list;
	});
</script>

<QuickActions {items} class="bg-program text-program-contrast" />
