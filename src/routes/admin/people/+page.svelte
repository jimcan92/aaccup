<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import PageHeader from '#lib/components/admin/page-header.svelte';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { initials, roleInfo } from '#lib/admin.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const roles = ['admin', 'focal', 'reviewer', 'area_chair'] as const;
	let newRole = $state<string>('area_chair');
	let newProgram = $state<string>('');
	let editProgram = $state<string>('');
	const areasFor = (programId: string) => data.areas.filter((area) => area.program_id === programId);
	const areaTitle = (id: string | null) => data.areas.find((area) => area.id === id)?.label ?? null;
	let editing = $state<string | null>(null);
	let editRole = $state<string>('area_chair');
	let removing = $state<{ id: string; label: string } | null>(null);

	const programCode = (id: string | null) => data.programs.find((program) => program.id === id)?.code ?? null;

	const fieldClass =
		'h-11 w-full border border-rule bg-salt px-3 text-[14px] text-ink outline-none transition-colors focus:border-ink';

	function startEdit(person: (typeof data.people)[number]) {
		editing = person.id;
		editRole = person.role;
		editProgram = person.program_id ?? '';
	}
</script>

<svelte:head>
	<title>People · AACCUP Desk</title>
</svelte:head>

<PageHeader
	eyebrow="People"
	title="Who can open the desk"
	description="Access is by invitation. Add a person’s CTU email and role; they sign in with the same CTU account they use for the other campus systems."
/>

{#if data.error}
	<div class="mt-6 border border-destructive/30 bg-paper p-4 text-[14px] text-destructive" role="alert">{data.error}</div>
{/if}

<section class="mt-8 border border-rule bg-paper p-5 sm:p-6" aria-labelledby="add-heading">
	<h2 id="add-heading" class="flex items-center gap-2 font-display text-[20px] font-semibold tracking-[-0.03em]">
		<UserPlus class="size-5" />
		Add a person
	</h2>
	<form method="POST" action="?/add" use:enhance class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_0.8fr_0.7fr_1fr_auto] xl:items-end">
		<label class="grid gap-1.5 text-[13px] font-medium text-ink">
			CTU email
			<input name="email" type="email" required autocomplete="off" placeholder="name@ctu.edu.ph" value={form && 'email' in form ? form.email : ''} class={fieldClass} />
		</label>
		<label class="grid gap-1.5 text-[13px] font-medium text-ink">
			Full name
			<input name="full_name" type="text" autocomplete="off" value={form && 'fullName' in form ? form.fullName : ''} class={fieldClass} />
		</label>
		<label class="grid gap-1.5 text-[13px] font-medium text-ink">
			Role
			<select name="role" bind:value={newRole} class={fieldClass}>
				{#each roles as role (role)}
					<option value={role}>{roleInfo[role].label}</option>
				{/each}
			</select>
		</label>
		<label class="grid gap-1.5 text-[13px] font-medium text-ink">
			Program
			<select name="program_id" bind:value={newProgram} disabled={newRole !== 'area_chair'} required={newRole === 'area_chair'} class="{fieldClass} disabled:opacity-50">
				<option value="">{newRole === 'area_chair' ? 'Choose…' : 'All programs'}</option>
				{#each data.programs as program (program.id)}
					<option value={program.id}>{program.code}</option>
				{/each}
			</select>
		</label>
		<label class="grid gap-1.5 text-[13px] font-medium text-ink">
			Section
			<select name="area_id" disabled={newRole !== 'area_chair' || !newProgram} class="{fieldClass} disabled:opacity-50">
				<option value="">Whole program</option>
				{#each areasFor(newProgram) as area (area.id)}<option value={area.id}>{area.label}</option>{/each}
			</select>
		</label>
		<button type="submit" class="h-11 bg-ink px-5 text-[14px] font-medium text-paper transition-colors hover:bg-ink-soft">
			Add
		</button>
	</form>
	<p class="mt-3 text-[13px] text-ink-soft">{roleInfo[newRole]?.description}</p>
</section>

<section class="mt-10" aria-labelledby="list-heading">
	<div class="flex items-end justify-between border-b border-ink/20 pb-2">
		<h2 id="list-heading" class="font-display text-[20px] font-semibold tracking-[-0.03em]">On the list</h2>
		<span class="font-mono text-[12px] text-ink-soft">{data.people.length} {data.people.length === 1 ? 'person' : 'people'}</span>
	</div>

	<ul>
		{#each data.people as person (person.id)}
			{@const isSelf = person.id === data.staff?.id}
			<li class="border-b border-rule py-4">
				<div class="flex flex-wrap items-center gap-x-4 gap-y-3">
					<span class="grid size-10 shrink-0 place-items-center bg-ink/[0.06] font-display text-[14px] font-semibold text-ink">
						{initials(person.full_name || person.email)}
					</span>
					<div class="min-w-0 flex-1 basis-52">
						<p class="truncate text-[15px] font-medium text-ink">
							{person.full_name || person.email}
							{#if isSelf}<span class="ml-1 text-[12px] font-normal text-ink-soft">(you)</span>{/if}
						</p>
						<p class="truncate text-[13px] text-ink-soft">{person.email}</p>
					</div>
					<div class="ml-auto flex items-center gap-2">
						<span class="border border-ink/20 bg-paper px-2 py-0.5 text-[12px] font-medium text-ink">
							{roleInfo[person.role]?.label ?? person.role}{programCode(person.program_id) ? ` · ${programCode(person.program_id)}` : ''}{areaTitle(person.area_id) ? ` · ${areaTitle(person.area_id)}` : ''}
						</span>
						<button
							type="button"
							onclick={() => (editing === person.id ? (editing = null) : startEdit(person))}
							class="h-9 px-3 text-[13px] font-medium text-ink underline-offset-4 hover:underline"
							aria-expanded={editing === person.id}
						>
							{editing === person.id ? 'Cancel' : 'Change role'}
						</button>
						{#if !isSelf}
							<button
								type="button"
								onclick={() => (removing = { id: person.id, label: person.full_name || person.email })}
								class="grid size-9 place-items-center text-ink-soft transition-colors hover:bg-destructive/10 hover:text-destructive"
								aria-label={`Remove ${person.full_name || person.email}`}
							>
								<Trash2 class="size-4" />
							</button>
						{/if}
					</div>
				</div>

				{#if editing === person.id}
					<form
						method="POST"
						action="?/role"
						use:enhance={() => async ({ update }) => {
							await update();
							editing = null;
						}}
						class="mt-4 grid gap-3 bg-paper p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
					>
						<input type="hidden" name="id" value={person.id} />
						<label class="grid gap-1.5 text-[13px] font-medium">
							Role
							<select name="role" bind:value={editRole} class={fieldClass}>
								{#each roles as role (role)}
									<option value={role} disabled={isSelf && role !== 'admin'}>{roleInfo[role].label}</option>
								{/each}
							</select>
						</label>
						<label class="grid gap-1.5 text-[13px] font-medium">
							Program
							<select name="program_id" bind:value={editProgram} disabled={editRole !== 'area_chair'} required={editRole === 'area_chair'} class="{fieldClass} disabled:opacity-50">
								<option value="">{editRole === 'area_chair' ? 'Choose…' : 'All programs'}</option>
								{#each data.programs as program (program.id)}
									<option value={program.id}>{program.code}</option>
								{/each}
							</select>
						</label>
						<label class="grid gap-1.5 text-[13px] font-medium">
							Section
							<select name="area_id" disabled={editRole !== 'area_chair' || !editProgram} class="{fieldClass} disabled:opacity-50">
								<option value="">Whole program</option>
								{#each areasFor(editProgram) as area (area.id)}<option value={area.id} selected={area.id === person.area_id}>{area.label}</option>{/each}
							</select>
						</label>
						<button type="submit" class="h-11 bg-ink px-5 text-[14px] font-medium text-paper hover:bg-ink-soft">Save</button>
					</form>
				{/if}
			</li>
		{:else}
			<li class="py-8 text-[14px] text-ink-soft">Nobody is on the list yet.</li>
		{/each}
	</ul>
</section>

<Dialog.Root open={removing !== null} onOpenChange={(open) => !open && (removing = null)}>
	<Dialog.Content class="max-w-md rounded-none">
		<Dialog.Title class="font-display text-[20px] font-semibold tracking-[-0.03em]">Remove {removing?.label}?</Dialog.Title>
		<Dialog.Description class="text-[14px] leading-relaxed text-ink-soft">
			They will no longer be able to open the AACCUP Desk. Their past edits stay in the revision history. Their CTU account is not affected.
		</Dialog.Description>
		<form
			method="POST"
			action="?/remove"
			use:enhance={() => async ({ update }) => {
				await update();
				removing = null;
			}}
			class="mt-2 flex justify-end gap-2"
		>
			<input type="hidden" name="id" value={removing?.id ?? ''} />
			<button type="button" onclick={() => (removing = null)} class="h-10 border border-rule px-4 text-[14px]">Keep</button>
			<button type="submit" class="h-10 bg-destructive px-4 text-[14px] font-medium text-white">Remove</button>
		</form>
	</Dialog.Content>
</Dialog.Root>
