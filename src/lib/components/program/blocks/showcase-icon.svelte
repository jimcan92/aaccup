<script lang="ts">
	import Box from '@lucide/svelte/icons/box';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Users from '@lucide/svelte/icons/users';
	import Wrench from '@lucide/svelte/icons/wrench';
	import type { ShowcaseIcon } from '#lib/landing.js';

	// The icon for a showcase feature, by its stored name.
	let { name, class: className = 'size-5' }: { name: ShowcaseIcon; class?: string } = $props();

	const icons = { box: Box, qr: QrCode, clipboard: ClipboardCheck, wrench: Wrench, alert: TriangleAlert, chart: ChartColumn, users: Users, shield: ShieldCheck };
	const Icon = $derived(icons[name] ?? Box);
</script>

<Icon class={className} />
