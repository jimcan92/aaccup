<script lang="ts">
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Search from '@lucide/svelte/icons/search';
	import { onMount } from 'svelte';
	import QuickActions, { type QuickGroup } from '$lib/components/site/quick-actions.svelte';
	import { staffInfo, type MenuProgram } from '$lib/menu-data';

	// The home page already has the program list, so nothing is fetched for it.
	let { programs }: { programs: MenuProgram[] } = $props();

	let staff = $state(false);
	onMount(async () => (staff = (await staffInfo()).staff));

	const groups = $derived<QuickGroup[]>([
		{ title: 'Programs', items: programs.map((item) => ({ label: `Go to ${item.code}`, href: `/${item.slug}`, icon: GraduationCap })) },
		{ title: 'Search documents', items: programs.map((item) => ({ label: `Search ${item.code} documents`, href: `/${item.slug}/documents`, icon: Search })) },
		{ title: 'Staff', items: staff ? [{ label: 'Admin overview', href: '/admin', icon: LayoutDashboard }] : [] }
	]);
</script>

<QuickActions {groups} class="bg-ink text-paper" />
