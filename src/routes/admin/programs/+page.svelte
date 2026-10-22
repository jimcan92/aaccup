<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Plus from '@lucide/svelte/icons/plus';
	import PageHeader from '$lib/components/admin/page-header.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let creating = $state(false);
	const values = $derived(form as { code?: string; name?: string; slug?: string } | null);

	const field = 'h-11 w-full border border-rule bg-salt px-3 text-[14px] text-ink outline-none focus:border-ink';
</script>

<svelte:head>
	<title>Programs · AACCUP Desk</title>
</svelte:head>

<PageHeader
	eyebrow="Records"
	title="Programs"
	description="Each program has its own dossier, colors, and visits. Open a program to edit it and manage its visits."
>
	{#snippet actions()}
		{#if data.canManage}
			<button
				type="button"
				onclick={() => (creating = !creating)}
				class="inline-flex h-10 items-center gap-2 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft"
				aria-expanded={creating}
			>
				<Plus class="size-4" />
				New program
			</button>
		{/if}
	{/snippet}
</PageHeader>

{#if form?.message}
	<div class="mt-6 border border-destructive/30 bg-paper p-4 text-[14px] text-destructive" role="alert">{form.message}</div>
{/if}
{#if data.error}
	<div class="mt-6 border border-destructive/30 bg-paper p-4 text-[14px] text-destructive" role="alert">{data.error}</div>
{/if}

{#if creating || form?.message}
	<form method="POST" action="?/create" use:enhance class="mt-6 grid gap-4 border border-rule bg-paper p-5 md:grid-cols-[8rem_1fr_9rem_1fr_auto] md:items-end">
		<label class="grid gap-1.5 text-[13px] font-medium">Code<input name="code" required placeholder="BSHM" value={values?.code ?? ''} class={field} /></label>
		<label class="grid gap-1.5 text-[13px] font-medium">Name<input name="name" required placeholder="Bachelor of Science in…" value={values?.name ?? ''} class={field} /></label>
		<label class="grid gap-1.5 text-[13px] font-medium">URL slug<input name="slug" placeholder="bshm" value={values?.slug ?? ''} class={field} /></label>
		<label class="grid gap-1.5 text-[13px] font-medium">Degree<input name="degree" placeholder="BS Hospitality Management" class={field} /></label>
		<button class="h-11 bg-ink px-5 text-[14px] font-medium text-paper hover:bg-ink-soft">Create</button>
		<p class="text-[12px] text-ink-soft md:col-span-5">New programs start as drafts and stay off the public site until you publish them.</p>
	</form>
{/if}

<ul class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
	{#each data.programs as program (program.id)}
		{@const active = program.visits.find((visit) => visit.status === 'active')}
		<li>
			<a
				href={`/admin/programs/${program.id}`}
				class="group block h-full border border-rule bg-paper transition-colors hover:border-ink/30"
			>
				<div class="h-2" style:background={program.theme_program ?? '#335052'}></div>
				<div class="flex items-start justify-between gap-4 p-5">
					<div class="min-w-0">
						<p class="font-display text-[28px] font-semibold leading-none tracking-[-0.05em]" style:color={program.theme_program}>
							{program.code}
						</p>
						<p class="mt-2 truncate text-[14px] text-ink">{program.name}</p>
						<p class="mt-1 font-mono text-[12px] text-ink-soft">/{program.slug}</p>
					</div>
					<StatusBadge status={program.status} />
				</div>
				<div class="flex items-center justify-between gap-3 border-t border-rule px-5 py-3 text-[13px]">
					<span class="text-ink-soft">
						{#if active}
							Active: <span class="font-medium text-ink">{active.year} · {active.label}</span>
						{:else}
							No active visit
						{/if}
						· {program.visits.length} {program.visits.length === 1 ? 'visit' : 'visits'}
					</span>
					<ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
				</div>
			</a>
		</li>
	{:else}
		<li class="text-[14px] text-ink-soft">No programs yet.</li>
	{/each}
</ul>
