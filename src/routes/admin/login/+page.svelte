<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import UserX from '@lucide/svelte/icons/user-x';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Sign in · AACCUP Desk · CTU Moalboal</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="grid min-h-dvh bg-salt lg:grid-cols-[0.95fr_1.05fr]">
	<div class="relative hidden overflow-hidden bg-ink p-10 text-paper lg:flex lg:flex-col lg:justify-between" style="--ring: #c9973a">
		<a href="/" class="relative inline-flex items-center gap-3">
			<span class="grid size-9 place-items-center border border-paper/30 font-display text-[14px] font-semibold">CM</span>
			<span class="leading-none">
				<span class="block font-display text-[15px] font-semibold tracking-[-0.02em]">CTU Moalboal</span>
				<span class="mt-1 block text-[11px] text-paper/55">AACCUP Accreditation</span>
			</span>
		</a>

		<div class="relative max-w-md">
			<p class="font-mono text-[12px] text-paper/55">AACCUP Desk</p>
			<p class="mt-4 font-display text-[clamp(2.4rem,4vw,3.6rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
				Keep each program’s record current.
			</p>
			<p class="mt-5 text-[14px] leading-relaxed text-paper/65">
				For the Campus AACCUP Task Force: admins, focal persons, reviewers, and area chairs. Sign in with the same CTU
				account you use for the other campus systems.
			</p>
		</div>

		<!-- Ledger rule: four program-agnostic tabs, the dossier motif from the public site. -->
		<div class="relative flex gap-1.5" aria-hidden="true">
			{#each [0.9, 0.55, 0.35, 0.2] as opacity, index (index)}
				<span class="h-1.5 flex-1 bg-paper" style:opacity></span>
			{/each}
		</div>
	</div>

	<main id="main" class="flex items-center justify-center px-5 py-12 sm:px-8">
		<div class="w-full max-w-[26rem]">
			<a href="/" class="mb-10 inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink">
				<ArrowLeft class="size-4" />
				Back to the public site
			</a>

			<p class="font-mono text-[12px] text-ink-soft">Task force access</p>
			<h1 class="mt-2 font-display text-[clamp(2.1rem,5vw,2.9rem)] font-semibold leading-[0.96] tracking-[-0.05em]">
				Sign in to the AACCUP Desk
			</h1>

			{#if data.notListed}
				<div class="mt-7 border border-destructive/30 bg-paper p-5" role="status">
					<div class="flex items-start gap-3">
						<UserX class="mt-0.5 size-5 shrink-0 text-destructive" />
						<div>
							<p class="text-[14px] font-medium text-ink">This CTU account is not on the AACCUP list.</p>
							<p class="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
								You are signed in as <strong class="font-medium text-ink">{data.notListed.email}</strong>. Ask the AACCUP
								admin to add this email under People, then reload this page.
							</p>
						</div>
					</div>
				</div>
			{:else}
				<p class="mt-4 text-[14px] leading-relaxed text-ink-soft">
					Access is by invitation. An AACCUP admin adds your CTU email and role first.
				</p>
			{/if}

			{#if !data.configured}
				<div class="mt-5 border border-dashed border-ink/30 bg-paper p-4 text-[13px] leading-relaxed text-ink-soft">
					The admin is not configured on this deployment. It needs <code class="font-mono text-[12px]">PUBLIC_SUPABASE_URL</code>,
					<code class="font-mono text-[12px]">SUPABASE_SERVICE_ROLE_KEY</code>, and
					<code class="font-mono text-[12px]">SUPABASE_JWT_SECRET</code>.
				</div>
			{/if}

			<a
				href={data.notListed ? data.logoutUrl : data.loginUrl}
				class="mt-8 flex h-12 w-full items-center justify-between bg-ink px-5 text-[14px] font-medium text-paper transition-colors hover:bg-ink-soft"
			>
				<span class="inline-flex items-center gap-2.5">
					<ShieldCheck class="size-4" />
					{data.notListed ? 'Sign out and use another account' : 'Continue with CTU Accounts'}
				</span>
				<ArrowRight class="size-4" />
			</a>

			<p class="mt-5 text-[12px] leading-relaxed text-ink-soft">
				{data.notListed
					? 'This signs you out of every CTU campus system on this browser.'
					: 'You will sign in at accounts.ctu-moalboal.online and come straight back here.'}
			</p>
		</div>
	</main>
</div>
