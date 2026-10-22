<script lang="ts">
	// Stand-in for a missing photo: the person's initials on the program colour.
	let { name, class: className = '' }: { name: string; class?: string } = $props();

	const initials = $derived(
		name
			.replace(/^(dr|engr|prof|mr|ms|mrs)\.?\s+/i, '')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase())
			.join('')
	);
</script>

<div class="grid place-items-center bg-program/12 font-display font-semibold tracking-[-0.04em] text-program {className}" aria-hidden="true">{initials}</div>
